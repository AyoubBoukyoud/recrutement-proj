import axios from 'axios';
import { readStorage, STORAGE_KEYS } from '@/lib/storage';
import { recoverFromUnauthorized } from '@/lib/authSession';
import { API_BASE_URL } from '@/lib/api';

/*
 * Le client HTTP des écrans recruteur/admin/agent, portés depuis web-admin.
 * Séparé de `lib/api.ts` (le client `fetch` du candidat) car les écrans ops
 * s'appuient sur l'instance axios elle-même comme point de bascule maquette :
 * une trentaine d'appels passent tous par ce seul objet, contre les quelques
 * appels du candidat qui passent chacun par un dépôt de src/data.
 */
export const api = axios.create({
  // Même base que lib/api.ts : les deux clients ne peuvent plus diverger
  // (celui-ci partait sur des chemins relatifs quand la variable manquait).
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json' },
});

/*
 * L'import est dynamique, pas statique : un `import { mockAdapter } from
 * '@/data/mockAdapter'` en tête de fichier referme le module dans le graphe
 * de webpack dès la compilation, quoi que fasse un ternaire ensuite — le
 * tree-shaking de webpack décide au niveau des imports statiques, avant que
 * Terser ait replié `process.env.NEXT_PUBLIC_USE_MOCKS` en constante.
 * Vérifié : ce détail suffit à faire ou non fuir les faux candidats dans un
 * build de production maquettes éteintes (`npm run verify:no-mocks`).
 *
 * Avec un `import()` dynamique, `mockAdapter.ts` devient un point de
 * découpage à part : le drapeau étant lu ici littéralement, Next élimine
 * l'appel `import()` lui-même quand il est constant-faux, et le chunk n'est
 * alors même pas émis.
 *
 * Non bloquant plutôt qu'un `await` de premier niveau : le premier appel
 * réel part toujours après le montage d'un composant React, donc après que
 * cette promesse a eu le temps de résoudre — voir la maquette de web-admin
 * d'origine, qui utilisait la même bascule sous Vite.
 */
if (process.env.NEXT_PUBLIC_USE_MOCKS === '1') {
  import('@/data/mockAdapter').then(({ mockAdapter }) => {
    api.defaults.adapter = mockAdapter;
  });
}

api.interceptors.request.use((config) => {
  // Même session que le reste de l'application : une seule connexion sert
  // aussi bien l'espace candidat que les écrans ops.
  const token = readStorage<string | null>(STORAGE_KEYS.token, null);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Every route behind this client requires a session (see routes/api.php:
    // recruiter, agent and admin endpoints all sit inside the `auth:sanctum`
    // group), so a 401 here always means "sign in again" — whether or not a
    // token was attached. Gating on "a token was attached" used to leave a
    // signed-out visitor stuck on a fully rendered but silently broken admin
    // page: no token → no Authorization header → the 401 was ignored instead
    // of redirecting, and every list on the page looked empty rather than
    // saying the session had ended.
    if (error?.response?.status === 401) recoverFromUnauthorized();
    return Promise.reject(error);
  }
);
