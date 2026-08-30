'use client';

import { generateId } from './storage/ids';
import { candidateAccountsCollection } from './localCandidateAccounts';
import { candidateAuthCollection, findCandidateAuthByEmail, type CandidateAuthAccount } from './localCandidateAuth';
import { candidateActivitiesCollection } from './localCandidateActivities';
import { setCandidateSession, clearCandidateSession } from './candidateSession';
import { pushNotification } from './storage/notify';
import { blankCandidateAccount, type CandidateAccount } from '@/data/amud/candidateAccount';

export type SignupInput = { prenom: string; nom: string; email: string; telephone: string; password: string };

/** Inscription (§9) : crée le compte candidat + les identifiants, ouvre la session, notifie/journalise la bienvenue. */
export function signupCandidate(input: SignupInput): { account: CandidateAccount; error?: string } | { account: null; error: string } {
  if (findCandidateAuthByEmail(input.email)) {
    return { account: null, error: 'Un compte existe déjà avec cet email.' };
  }
  const account = blankCandidateAccount({
    id: generateId('candidate_acc'),
    prenom: input.prenom.trim(),
    nom: input.nom.trim(),
    email: input.email.trim(),
    telephone: input.telephone.trim(),
  });
  candidateAccountsCollection.add(account);

  const auth: CandidateAuthAccount = {
    id: generateId('candidate_auth'),
    candidateAccountId: account.id,
    email: input.email.trim(),
    password: input.password,
    createdAt: account.createdAt,
  };
  candidateAuthCollection.add(auth);

  setCandidateSession(account.id);

  pushNotification({
    scope: 'candidate',
    targetId: account.id,
    title: `Bienvenue sur Amud Skills, ${account.prenom} !`,
    category: 'Compte',
    href: '/amud/candidat',
  });
  candidateActivitiesCollection.add({
    id: generateId('candidate_activity'),
    candidateAccountId: account.id,
    type: 'compte',
    label: 'Compte créé',
    createdAt: account.createdAt,
  });

  return { account };
}

export function loginCandidate(email: string, password: string): { account: CandidateAccount | null; error?: string } {
  const auth = findCandidateAuthByEmail(email);
  if (!auth || auth.password !== password) {
    return { account: null, error: 'Email ou mot de passe incorrect.' };
  }
  const account = candidateAccountsCollection.getById(auth.candidateAccountId) ?? null;
  if (!account) return { account: null, error: 'Compte introuvable.' };
  setCandidateSession(account.id);
  return { account };
}

export function logoutCandidate() {
  clearCandidateSession();
}
