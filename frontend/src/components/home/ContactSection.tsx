'use client';

import { useState, type FormEvent } from 'react';
import { useHomeContent } from '@/lib/useLocalizedContent';
import { submitContactMessage } from '@/lib/contactMessages';
import { ApiError } from '@/lib/api';
import { Icon, SectionHeading } from './ui';
import { Reveal } from './Reveal';

const FIELD_CLASS =
  'w-full rounded-xl border border-home-line bg-home-surface px-4 py-3 text-sm text-home-ink placeholder:text-home-slate/70 transition-colors focus:border-home-coral focus:outline-none focus:ring-2 focus:ring-home-coral/20 aria-[invalid=true]:border-error';

type Status = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Formulaire « nous contacter » en bas de la page d'accueil publique, juste
 * au-dessus du footer. Soumission publique (`POST /contact`, sans jeton) —
 * les messages atterrissent dans la file de tri admin (`/admin/contact`),
 * au même endroit que les réclamations candidat.
 */
export function ContactSection() {
  const { contact } = useHomeContent();
  const { form } = contact;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);

    try {
      await submitContactMessage({ name: name.trim(), email: email.trim(), message: message.trim() });
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      setStatus('error');
      if (error instanceof ApiError && error.status === 422) {
        setErrorMessage(form.errorValidation);
      } else {
        setErrorMessage(form.errorGeneric);
      }
    }
  };

  return (
    <section id="contact" className="scroll-mt-20 bg-home-sand py-20 lg:py-28">
      <div className="mx-auto max-w-[640px] px-6 lg:px-12">
        <Reveal>
          <SectionHeading eyebrow={contact.eyebrow} title={contact.title} subtitle={contact.subtitle} align="center" className="mx-auto" />
        </Reveal>

        <Reveal delay={100} className="mt-10">
          {status === 'success' ? (
            <div className="rounded-2xl border border-home-line bg-home-surface p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-home-coral-soft text-home-coral-dark">
                <Icon name="check_circle" className="text-2xl" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-home-ink">{form.successTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-home-slate">{form.successBody}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-home-line bg-home-surface p-6 shadow-[0_10px_30px_rgba(16,35,58,0.06)] sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-home-slate">{form.nameLabel}</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={form.namePlaceholder}
                    className={FIELD_CLASS}
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-home-slate">{form.emailLabel}</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={form.emailPlaceholder}
                    className={FIELD_CLASS}
                  />
                </label>
              </div>

              <label className="mt-4 grid gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-home-slate">{form.messageLabel}</span>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={form.messagePlaceholder}
                  className={`${FIELD_CLASS} resize-y`}
                />
              </label>

              {status === 'error' && errorMessage ? (
                <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error">
                  <Icon name="error" className="mt-0.5 shrink-0 text-base" />
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-home-coral px-8 py-4 text-base font-bold text-white shadow-[0_8px_24px_rgba(241,105,63,0.25)] transition-colors hover:bg-home-coral-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-coral active:scale-[0.99] disabled:opacity-70 sm:w-auto"
              >
                {status === 'submitting' ? form.submitting : form.submit}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
