import { NotificationsFeed } from '@/components/NotificationsFeed';

/** `RecruiterShell` fournit désormais le thème/langue/déconnexion — cet écran n'a plus besoin de sa propre `TopBar`. */
export default function Page() {
  return <NotificationsFeed />;
}
