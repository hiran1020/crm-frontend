import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@/types/user'

const STORAGE_KEY = 'crm_auth'

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const mockUsers: Array<{ email: string; password: string; user: User }> = [
  {
    email: 'sarah@crm.com',
    password: 'password',
    user: {
      id: 'USR-001',
      name: 'Sarah Wilson',
      email: 'sarah@crm.com',
      role: 'manager',
      avatarInitials: 'SW',
    },
  },
  {
    email: 'david@crm.com',
    password: 'password',
    user: {
      id: 'USR-002',
      name: 'David Chen',
      email: 'david@crm.com',
      role: 'sales_agent',
      avatarInitials: 'DC',
    },
  },
  {
    email: 'emily@crm.com',
    password: 'password',
    user: {
      id: 'USR-003',
      name: 'Emily Rodriguez',
      email: 'emily@crm.com',
      role: 'sales_agent',
      avatarInitials: 'ER',
    },
  },
  {
    email: 'admin@crm.com',
    password: 'password',
    user: {
      id: 'USR-004',
      name: 'Admin User',
      email: 'admin@crm.com',
      role: 'admin',
      avatarInitials: 'AU',
    },
  },
  {
    email: 'alex@crm.com',
    password: 'password',
    user: {
      id: 'USR-005',
      name: 'Alex Thompson',
      email: 'alex@crm.com',
      role: 'support',
      avatarInitials: 'AT',
    },
  },
]

function loadUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as User
  } catch {
    return null
  }
}

function saveUser(user: User): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

function clearUser(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser)

  // Sync state if storage changes in another tab
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        setUser(loadUser())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    // Simulate network delay
    await new Promise<void>((resolve) => setTimeout(resolve, 600))

    const match = mockUsers.find(
      (entry) =>
        entry.email.toLowerCase() === email.toLowerCase() &&
        entry.password === password,
    )

    if (!match) {
      throw new Error('Invalid email or password')
    }

    saveUser(match.user)
    setUser(match.user)
  }, [])

  const logout = useCallback(() => {
    clearUser()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, login, logout }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
