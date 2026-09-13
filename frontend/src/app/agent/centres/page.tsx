import { RecruitmentCenters } from '@/components/RecruitmentCenters';

export default function AgentCentersPage() {
  return (
    <div className="mx-auto grid max-w-[1200px] gap-6">
      <header>
        <p className="eyebrow eyebrow-accent">Prospection partagée</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-on-surface">Centres et entreprises</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
          Retrouvez les organismes déjà contactés, leur statut et les notes de suivi de l’équipe commerciale.
        </p>
      </header>
      <RecruitmentCenters />
    </div>
  );
}
