import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: 'application/json' },
})

/**
 * En phase interfaces, l'instance entière répond depuis `src/data` : aucun
 * appel ne part sur le réseau, et pas une ligne d'écran n'a besoin de le
 * savoir. Retirer VITE_USE_MOCKS rebranche l'API réelle telle quelle.
 *
 * L'import est dynamique, et non statique, pour que le graphe des maquettes —
 * adaptateur *et* jeux de données — soit absent du bundle de production. Un
 * import statique embarquerait les faux candidats dans l'application livrée,
 * même avec le drapeau éteint.
 *
 * L'`await` de premier niveau suspend les modules qui importent celui-ci, donc
 * l'adaptateur est en place avant le premier appel.
 *
 * Le drapeau est lu ici littéralement plutôt qu'importé de `data/config` :
 * Vite substitue `import.meta.env` à la compilation, la condition devient donc
 * une constante et Rollup supprime l'import dynamique — le chunk des maquettes
 * n'est pas même émis dans un build de production.
 */
if (import.meta.env.VITE_USE_MOCKS === '1') {
  const { mockAdapter } = await import('../data/mockAdapter')
  api.defaults.adapter = mockAdapter
  console.info('[maquette] API simulée — VITE_USE_MOCKS=1')
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
