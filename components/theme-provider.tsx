"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useAppStore } from "@/lib/store"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { theme, setTheme } = useAppStore()

  // Sincronizar o tema do store com o next-themes
  React.useEffect(() => {
    if (props.defaultTheme && !theme) {
      setTheme(props.defaultTheme as "light" | "dark" | "system")
    }
  }, [props.defaultTheme, theme, setTheme])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

