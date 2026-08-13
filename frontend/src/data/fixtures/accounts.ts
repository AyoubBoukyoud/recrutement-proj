/**
 * Les comptes de démonstration, tenus identiques à ceux de
 * `user-app/src/data/fixtures/auth.ts` : le même numéro doit ouvrir le même
 * rôle des deux côtés du produit.
 *
 * Auparavant ce fichier n'existait pas et la maquette dérivait le rôle du
 * dernier chiffre du numéro, ce qui accordait « Administrator » aux deux
 * numéros de candidat — la branche « votre compte n'a pas accès » ne pouvait
 * donc jamais être atteinte, ni testée.
 */

/** Le code que la maquette accepte. */
export const MOCK_OTP_CODE = '000000'

export interface MockAccount {
  phone: string
  /** Les noms de rôles de Spatie, tels que le back les renvoie. */
  roles: string[]
  id: number
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  { phone: '+212600000001', roles: ['User'], id: 101 },
  { phone: '+212600000002', roles: ['User'], id: 102 },
  { phone: '+212600000003', roles: ['Company'], id: 201 },
  { phone: '+212600000004', roles: ['Administrator'], id: 301 },
  { phone: '+212600000005', roles: ['Commercial Agent'], id: 401 },
]

const digitsOf = (phone: string) => phone.replace(/\D/g, '')

/** Un numéro non listé ouvre une session candidat, qui n'a pas d'espace ici. */
export function findMockAccount(phone: string): MockAccount {
  const wanted = digitsOf(phone)
  return (
    MOCK_ACCOUNTS.find((account) => digitsOf(account.phone) === wanted) ?? {
      phone,
      roles: ['User'],
      id: 999,
    }
  )
}
