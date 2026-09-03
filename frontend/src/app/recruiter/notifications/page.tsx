// Seul écran recruteur sans TopBar : il n'avait donc ni bascule de thème, ni
// sélecteur de langue, ni déconnexion. La barre est posée ici plutôt que dans
// NotificationsFeed, que la console admin réutilise sous un layout qui en
// fournit déjà une.
import{NotificationsFeed}from'@/components/NotificationsFeed';import{TopBar}from'@/components/TopBar';
export default function Page(){return <div className="min-h-screen bg-surface"><TopBar title="Notifications"/><div className="pb-24 md:pb-0"><h1 className="sr-only">Notifications</h1><NotificationsFeed/></div></div>}
