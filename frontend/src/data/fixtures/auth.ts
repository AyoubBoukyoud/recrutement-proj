/**
 * Comptes de démonstration — un par rôle, pour que chaque espace soit
 * atteignable sans backend. Le code est le même partout : en maquette, la
 * vérification ne contrôle que sa forme, pas sa valeur secrète.
 */
import type { UserRole } from '@/lib/types';

/** Le code que la maquette accepte. Affiché à l'écran en mode maquette. */
export const MOCK_OTP_CODE = '000000';

export interface MockAccount {
  phone: string;
  role: UserRole;
  id: number;
  /** Étape de profil restée incomplète, ou `null` si le profil est prêt. */
  incompleteProfileStep: number | null;
}

/**
 * Le numéro composé décide du rôle : c'est le seul moyen, sans backend,
 * d'ouvrir les quatre espaces depuis le même écran de connexion.
 */
export const MOCK_ACCOUNTS: MockAccount[] = [
  { phone: '+212600000001', role: 'candidate', id: 101, incompleteProfileStep: null },
  { phone: '+212600000002', role: 'candidate', id: 102, incompleteProfileStep: 2 },
  { phone: '+212600000003', role: 'employer', id: 201, incompleteProfileStep: null },
  { phone: '+212600000004', role: 'admin', id: 301, incompleteProfileStep: null },
  { phone: '+212600000005', role: 'agent', id: 401, incompleteProfileStep: null },
];

/** Tout numéro non listé ouvre une session candidat : le cas courant. */
export const DEFAULT_MOCK_ACCOUNT: MockAccount = MOCK_ACCOUNTS[0];

const digitsOf = (phone: string) => phone.replace(/\D/g, '');

export function findMockAccount(phone: string): MockAccount {
  const wanted = digitsOf(phone);
  return (
    MOCK_ACCOUNTS.find((account) => digitsOf(account.phone) === wanted) ?? {
      ...DEFAULT_MOCK_ACCOUNT,
      phone,
    }
  );
}
