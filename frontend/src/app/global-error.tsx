'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console -- seul filet de sécurité si la mise en page racine elle-même a échoué.
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, background: '#F9F9FF', color: '#191C1D', fontFamily: 'system-ui, sans-serif' }}>
        <main
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            padding: '4rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#BA1A1A' }}>
            Erreur critique
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>L&apos;application n&apos;a pas pu démarrer</h1>
          <p style={{ maxWidth: '28rem', fontSize: '0.875rem', lineHeight: 1.6, color: '#43474E' }}>
            Un problème inattendu a empêché le chargement de la page. Réessayez ; si cela persiste, revenez plus
            tard.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              borderRadius: '0.75rem',
              background: '#006266',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.875rem',
              padding: '0.75rem 1.5rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
