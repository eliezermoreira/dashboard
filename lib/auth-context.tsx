"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/lib/store"

interface AuthContextType {
  isAuthenticated: boolean
  user: { id: string; name: string; role: string } | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  const { isAuthenticated, user, login: storeLogin, logout: storeLogout } = useAppStore()

  useEffect(() => {
    // Verificar autenticação quando o componente montar
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login")
    }
    setLoading(false)
  }, [isAuthenticated, pathname, router])

  const login = async (username: string, password: string) => {
    const success = await storeLogin(username, password)
    if (success) {
      router.push("/")
    }
    return success
  }

  const logout = () => {
    storeLogout()
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

