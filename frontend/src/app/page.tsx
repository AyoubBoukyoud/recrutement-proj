import { redirect } from 'next/navigation';

/**
 * `/` redirige vers le hub `/amud`, désormais page d'accueil de l'app. Le
 * vrai site public (ex-contenu de cette route) a été déplacé vers
 * `/accueil-public`, accessible depuis le hub.
 */
export default function RootPage() {
  redirect('/amud');
}
