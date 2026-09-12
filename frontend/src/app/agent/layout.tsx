import { AgentShell } from '@/components/AgentShell';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="main-content" tabIndex={-1} className="min-h-screen bg-amud-background outline-none">
      <AgentShell>{children}</AgentShell>
    </div>
  );
}
