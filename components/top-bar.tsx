"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Moon, Sun, Menu } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export function TopBar() {
  const { theme, setTheme } = useTheme()
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()

  // Não mostrar a barra superior na página de login
  if (pathname === "/login") {
    return null
  }

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden mr-2">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Prime Stream</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <NotificationsDropdown />
      </div>
    </div>
  )
}

