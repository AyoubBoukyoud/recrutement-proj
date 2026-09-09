import { redirect } from 'next/navigation';

/**
 * L'entrée de production mène au site public réel. Le hub `/amud` est un
 * catalogue de maquettes de conception et ne doit jamais être la porte
 * d'entrée d'un utilisateur.
 */
export default function RootPage() {
  redirect('/accueil-public');
}
