import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebase'
import type { User, UserRole } from '@/types/user'

const BASE = import.meta.env.VITE_API_URL as string

/** Stamp lastLoginAt on the backend — fire-and-forget, never throws. */
async function stampLastLogin(getToken: () => Promise<string>) {
  try {
    const token = await getToken()
    void fetch(`${BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    // non-critical — swallow silently
  }
}

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

function makeInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (!fbUser) {
        setUser(null)
        setLoading(false)
        return
      }
      const tokenResult = await fbUser.getIdTokenResult()
      const role = (tokenResult.claims['role'] as UserRole | undefined) ?? 'sales_agent'
      const name = fbUser.displayName ?? fbUser.email ?? ''
      setUser({
        id: fbUser.uid,
        name,
        email: fbUser.email ?? '',
        role,
        avatarInitials: makeInitials(name),
      })
      setLoading(false)
      // Stamp lastLoginAt in Firestore on every session restore
      void stampLastLogin(() => fbUser.getIdToken())
    })
    return unsub
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
    const tokenResult = await cred.user.getIdTokenResult(true)
    const role = (tokenResult.claims['role'] as UserRole | undefined) ?? 'sales_agent'
    const name = cred.user.displayName ?? cred.user.email ?? ''
    setUser({
      id: cred.user.uid,
      name,
      email: cred.user.email ?? '',
      role,
      avatarInitials: makeInitials(name),
    })
    // Stamp lastLoginAt in Firestore on explicit login
    void stampLastLogin(() => cred.user.getIdToken())
  }, [])

  const logout = useCallback(async () => {
    await firebaseSignOut(firebaseAuth)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
