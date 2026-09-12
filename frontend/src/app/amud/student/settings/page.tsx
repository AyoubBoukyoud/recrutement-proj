'use client';

export default function StudentSettingsPage() {
  return (
    <div className="space-y-lg">
      <h1 className="text-headline-md text-amud-on-surface">Paramètres</h1>
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <p className="text-body-md text-amud-on-surface-variant">
          Pour modifier vos informations personnelles, rendez-vous sur votre{' '}
          <a href="/amud/student/profile" className="text-amud-primary hover:underline">profil</a>.
        </p>
        <p className="mt-sm text-body-md text-amud-on-surface-variant">
          Pour toute autre demande (changement de formation, d&apos;enseignant, etc.), contactez votre centre de formation.
        </p>
      </div>
    </div>
  );
}
