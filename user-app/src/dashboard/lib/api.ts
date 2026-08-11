import axios from 'axios'
import { readStorage, STORAGE_KEYS } from '@/lib/storage'

// Même hôte, même jeton que le reste de l'application : une seule connexion
// (téléphone + code) sert aussi bien l'espace candidat que ces écrans.
const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

export const api = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = readStorage<string | null>(STORAGE_KEYS.token, null)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** L'URL du disque `storage` de Laravel, dérivée de la même base d'API. */
export const storageUrl = (path: string) => `${baseURL.replace(/\/api$/, '')}/storage/${path}`
