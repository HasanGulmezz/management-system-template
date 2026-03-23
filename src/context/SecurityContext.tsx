import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface SecurityContextType {
  isUnlocked: boolean
  unlock: () => void
  lock: () => void
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

export function SecurityProvider({ children }: { children: ReactNode }) {
  // Initialize from sessionStorage to persist across refreshes
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('app_unlocked') === 'true'
  })

  useEffect(() => {
    sessionStorage.setItem('app_unlocked', String(isUnlocked))
  }, [isUnlocked])

  const unlock = () => setIsUnlocked(true)
  const lock = () => setIsUnlocked(false)

  return (
    <SecurityContext.Provider value={{ isUnlocked, unlock, lock }}>
      {children}
    </SecurityContext.Provider>
  )
}

export function useSecurity() {
  const context = useContext(SecurityContext)
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider')
  }
  return context
}
