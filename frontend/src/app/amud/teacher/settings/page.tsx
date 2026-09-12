'use client';

export default function TeacherSettingsPage() {
  return (
    <div className="space-y-lg">
      <h1 className="text-headline-md text-amud-on-surface">Paramètres</h1>
      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <p className="text-body-md text-amud-on-surface-variant">
          Pour modifier vos coordonnées, rendez-vous sur votre{' '}
          <a href="/amud/teacher/profile" className="text-amud-primary hover:underline">profil</a>.
        </p>
        <p className="mt-sm text-body-md text-amud-on-surface-variant">
          Pour toute demande relative à votre contrat ou votre rémunération, contactez l&apos;administration de votre centre.
        </p>
      </div>
    </div>
  );
}
