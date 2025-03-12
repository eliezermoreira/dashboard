import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Reseller, PixCharge } from "@/lib/api"

interface AppState {
  // Auth state
  isAuthenticated: boolean
  user: { id: string; name: string; role: string } | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void

  // Resellers state
  resellers: Reseller[]
  loadingResellers: boolean
  setResellers: (resellers: Reseller[]) => void
  setLoadingResellers: (loading: boolean) => void

  // PIX state
  pixCharges: PixCharge[]
  loadingPixCharges: boolean
  connectionStatus: boolean | null
  authStatus: boolean | null
  setPixCharges: (charges: PixCharge[]) => void
  setLoadingPixCharges: (loading: boolean) => void
  setPixStatus: (connection: boolean | null, auth: boolean | null) => void

  // UI state
  sidebarOpen: boolean
  theme: "light" | "dark" | "system"
  toggleSidebar: () => void
  setTheme: (theme: "light" | "dark" | "system") => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth state - inicialmente mockado
      isAuthenticated: false,
      user: null,
      login: async (username, password) => {
        // Mock de autenticação - em produção, isso seria uma chamada à API
        if (username === "admin" && password === "admin") {
          set({
            isAuthenticated: true,
            user: { id: "1", name: "Administrador", role: "admin" },
          })
          return true
        }
        return false
      },
      logout: () => set({ isAuthenticated: false, user: null }),

      // Resellers state
      resellers: [],
      loadingResellers: false,
      setResellers: (resellers) => set({ resellers }),
      setLoadingResellers: (loading) => set({ loadingResellers: loading }),

      // PIX state
      pixCharges: [],
      loadingPixCharges: false,
      connectionStatus: null,
      authStatus: null,
      setPixCharges: (charges) => set({ pixCharges: charges }),
      setLoadingPixCharges: (loading) => set({ loadingPixCharges: loading }),
      setPixStatus: (connection, auth) => set({ connectionStatus: connection, authStatus: auth }),

      // UI state
      sidebarOpen: true,
      theme: "light",
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "prime-stream-storage",
      partialize: (state) => ({
        theme: state.theme,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
)

