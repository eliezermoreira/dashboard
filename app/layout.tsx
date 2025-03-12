import type React from "react"
import type { Metadata } from "next/types"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { AppSidebar } from "@/components/app-sidebar"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/lib/query-provider"
import { NotificationsProvider } from "@/lib/notifications"
import { TopBar } from "@/components/top-bar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Prime Stream Dashboard",
  description: "Manage resellers and PIX payments",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <NotificationsProvider>
                <SidebarProvider>
                  <div className="flex min-h-screen">
                    <AppSidebar />
                    <div className="flex flex-col flex-1 overflow-x-hidden">
                      <TopBar />
                      <main className="flex-1">{children}</main>
                    </div>
                  </div>
                  <Toaster />
                </SidebarProvider>
              </NotificationsProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}



import './globals.css'