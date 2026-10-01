export type StoredAccount = {
  user_id: string
  email: string
  name: string | null
  role: string | null
  access_token: string
  refresh_token: string
  added_at: string
}

const STORAGE_KEY = 'sv_extra_sessions'

export function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (a) =>
        a &&
        typeof a.user_id === 'string' &&
        typeof a.email === 'string' &&
        typeof a.refresh_token === 'string'
    )
  } catch {
    return []
  }
}

function save(accounts: StoredAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
  // Notify any listening components
  window.dispatchEvent(new Event('sv-accounts-changed'))
}

export function upsertStoredAccount(account: StoredAccount) {
  const existing = getStoredAccounts()
  const filtered = existing.filter((a) => a.user_id !== account.user_id)
  filtered.push(account)
  save(filtered)
}

export function removeStoredAccount(userId: string) {
  const filtered = getStoredAccounts().filter((a) => a.user_id !== userId)
  save(filtered)
}

export function clearAllStoredAccounts() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('sv-accounts-changed'))
}