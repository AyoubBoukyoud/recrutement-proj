'use client';

import { useState } from 'react';
import type { Centre } from '@/data/amud/centres';
import { GERMAN_LEVELS, type CenterLead } from '@/data/amud/centerTypes';
import { centerLeadsCollection } from '@/lib/amud/localCenterLeads';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { logCenterActivity } from '@/lib/amud/localCenterActivities';
import { pushNotification } from '@/lib/amud/storage/notify';
import { themeHeading, type ThemeStyle } from '@/lib/amud/themeStyles';

/**
 * Formulaire de contact du site public. Il n'affiche pas seulement un
 * formulaire décoratif : l'envoi crée un **vrai lead** en localStorage
 * (statut `NOUVEAU`), notifie l'espace Centre et alimente le journal
 * d'activité — la page `/amud/centre/leads` le voit apparaître
 * immédiatement, ce qui referme la boucle « site public → leads » décrite
 * au cahier des charges.
 *
 * Le formulaire est inerte dans l'aperçu (`compact`) pour qu'éditer le site
 * ne crée pas de faux leads.
 */
export function PublicSiteContactForm({
  centre,
  t,
  card,
  compact,
}: {
  centre: Centre;
  t: ThemeStyle;
  card: React.CSSProperties;
  compact: boolean;
}) {
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [niveauSouhaite, setNiveauSouhaite] = useState<CenterLead['niveauSouhaite']>('A1');
  const [horairePrefere, setHorairePrefere] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const control: React.CSSProperties = {
    width: '100%',
    minHeight: 44,
    padding: '10px 12px',
    borderRadius: t.cardStyle === 'minimal' ? 0 : '8px',
    border: `1px solid ${t.border}`,
    background: t.surface,
    color: t.text,
    fontSize: 15,
    fontFamily: t.bodyFont,
  };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: t.textMuted, marginBottom: 4 };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (compact) return;
    if (!nom.trim()) return setError('Merci d’indiquer votre nom.');
    if (!telephone.trim() && !email.trim()) return setError('Indiquez au moins un téléphone ou un email.');
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Adresse email invalide.');
    setError('');

    const lead: CenterLead = {
      id: generateId('lead'),
      centerId: centre.id,
      nom: nom.trim(),
      telephone: telephone.trim(),
      email: email.trim(),
      niveauSouhaite,
      horairePrefere: horairePrefere.trim() || undefined,
      message: message.trim() || undefined,
      statut: 'NOUVEAU',
      createdAt: new Date().toISOString(),
    };
    centerLeadsCollection.add(lead);
    pushNotification({
      scope: 'centre',
      title: `Nouveau lead : ${lead.nom}`,
      category: 'Site public',
      href: '/amud/centre/leads',
    });
    logAudit({
      utilisateur: `${lead.nom} (visiteur)`,
      role: 'N/A',
      action: 'Demande d’inscription depuis le site public',
      actionType: 'create',
      module: 'Centres de formation — Leads',
      reference: `${lead.nom} (#${lead.id})`,
      centerId: centre.id,
    });
    logCenterActivity({ centerId: centre.id, type: 'LEAD_CREATED', message: `Nouveau lead « ${lead.nom} » depuis le site public.`, utilisateur: `${lead.nom} (visiteur)`, role: 'N/A' });
    setSent(true);
  }

  if (sent) {
    return (
      <div style={{ ...card, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 32, color: t.accent, marginBottom: 8 }}>✓</div>
        <h3 style={{ ...themeHeading(t, true), fontSize: 18 }}>Demande envoyée</h3>
        <p style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.6, margin: '8px 0 0' }}>
          Merci {nom}. L’équipe de {centre.nom} vous recontacte très vite.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }} noValidate>
      <h3 style={{ ...themeHeading(t, true), fontSize: compact ? 15 : 17 }}>Demander des informations</h3>

      <div>
        <label style={labelStyle} htmlFor="aps-nom">
          Nom complet *
        </label>
        <input id="aps-nom" style={control} value={nom} onChange={(e) => setNom(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="aps-tel">
          Téléphone
        </label>
        <input id="aps-tel" type="tel" style={control} value={telephone} onChange={(e) => setTelephone(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="aps-email">
          Email
        </label>
        <input id="aps-email" type="email" style={control} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="aps-niveau">
          Niveau souhaité
        </label>
        <select
          id="aps-niveau"
          style={control}
          value={niveauSouhaite}
          onChange={(e) => setNiveauSouhaite(e.target.value as CenterLead['niveauSouhaite'])}
        >
          {GERMAN_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
          <option value="Non précisé">Non précisé</option>
        </select>
      </div>
      <div>
        <label style={labelStyle} htmlFor="aps-horaire">
          Horaire préféré
        </label>
        <input id="aps-horaire" style={control} value={horairePrefere} onChange={(e) => setHorairePrefere(e.target.value)} placeholder="Soir, week-end…" />
      </div>
      <div>
        <label style={labelStyle} htmlFor="aps-message">
          Message
        </label>
        <textarea id="aps-message" rows={3} style={{ ...control, minHeight: 88 }} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      {error ? (
        <p role="alert" style={{ margin: 0, fontSize: 13, color: '#dc2626' }}>
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={compact}
        style={{
          minHeight: 48,
          background: t.primary,
          color: t.primaryText,
          border: 'none',
          borderRadius: t.buttonRadius,
          fontSize: 15,
          fontWeight: 700,
          cursor: compact ? 'default' : 'pointer',
          opacity: compact ? 0.7 : 1,
          fontFamily: t.bodyFont,
        }}
      >
        {centre.site.ctaLabel}
      </button>
      {compact ? <p style={{ margin: 0, fontSize: 12, color: t.textMuted, textAlign: 'center' }}>Aperçu — le formulaire est actif sur le site publié.</p> : null}
    </form>
  );
}
