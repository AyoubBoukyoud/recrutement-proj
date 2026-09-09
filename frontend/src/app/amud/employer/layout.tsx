/** `/amud/employer` n'est plus qu'une redirection (voir `page.tsx`) — passthrough simple pour ne pas monter l'ancien `EmployerShell` avant que la redirection ne s'exécute. */
export default function AmudEmployerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
