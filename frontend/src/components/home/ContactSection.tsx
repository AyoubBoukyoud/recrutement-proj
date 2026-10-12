'use client';

import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { translator, type Locale } from '@/components/landing/content';
import { LEGAL_PATHS } from '@/content/legal';
import { ApiError } from '@/lib/api';
import { submitContactMessage } from '@/lib/contactMessages';
import { homeFor } from '@/lib/homeContent';
import { COMPANY } from '@/lib/company';

type Status = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Formulaire « nous contacter » de la page d'accueil publique, juste avant
 * l'appel à découvrir l'entreprise. Soumission publique (`POST /contact`, sans
 * jeton) : les messages atterrissent dans la file de tri admin
 * (`/admin/contact`), au même endroit que les réclamations candidat.
 *
 * Les libellés viennent de `content/home.*.json` ; l'habillage (`r-contact*`)
 * est celui de la page d'accueil de référence.
 */
export function ContactSection({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const { contact } = homeFor(locale);
  const { form } = contact;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      await submitContactMessage({ name: name.trim(), email: email.trim(), message: message.trim() });
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof ApiError && error.status === 422 ? form.errorValidation : form.errorGeneric);
    }
  };

  return (
    <section className="r-contact" id="contact" aria-labelledby="r-contact-title">
      <div className="r-contact-intro">
        <p className="r-eyebrow">{contact.eyebrow}</p>
        <h2 id="r-contact-title">{contact.title}</h2>
        <p>{contact.subtitle}</p>
        <p className="r-contact-mail">
          {t('Ou par e-mail :', 'أو عبر البريد الإلكتروني:', 'Oder per E-Mail:', 'Or by email:')}{' '}
          <a href={`mailto:${COMPANY.email}`} dir="ltr">{COMPANY.email}</a>
        </p>
      </div>

      {status === 'success' ? (
        <div className="r-contact-success" role="status">
          <Check aria-hidden="true" />
          <h3>{form.successTitle}</h3>
          <p>{form.successBody}</p>
        </div>
      ) : (
        <form className="r-contact-form" onSubmit={handleSubmit}>
          <div className="r-contact-row">
            <label>
              {form.nameLabel}
              <input
                type="text"
                name="name"
                autoComplete="name"
                required
                maxLength={150}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={form.namePlaceholder}
              />
            </label>
            <label>
              {form.emailLabel}
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={150}
                dir="ltr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={form.emailPlaceholder}
              />
            </label>
          </div>
          <label>
            {form.messageLabel}
            <textarea
              name="message"
              required
              rows={5}
              maxLength={5000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={form.messagePlaceholder}
            />
          </label>
          {status === 'error' && <p className="r-contact-error" role="alert">{errorMessage}</p>}
          <p className="r-contact-privacy">
            {t(
              'Nous utilisons ces informations uniquement pour vous répondre. ',
              'نستعمل هذه المعلومات فقط للرد عليك. ',
              'Wir verwenden diese Angaben nur, um Ihnen zu antworten. ',
              'We use this information only to reply to you. ',
            )}
            <a href={LEGAL_PATHS.privacy}>{t('Politique de confidentialité', 'سياسة الخصوصية', 'Datenschutzerklärung', 'Privacy policy')}</a>
          </p>
          <button className="r-button" type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? form.submitting : form.submit}
            <ArrowUpRight aria-hidden="true" />
          </button>
        </form>
      )}
    </section>
  );
}
