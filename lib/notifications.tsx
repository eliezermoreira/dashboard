"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export type NotificationType = "info" | "success" | "warning" | "error"

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  timestamp: Date
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "read" | "timestamp">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { toast } = useToast()

  const unreadCount = notifications.filter((n) => !n.read).length

  // Simular notificações em tempo real
  useEffect(() => {
    // Carregar notificações do localStorage
    const savedNotifications = localStorage.getItem("notifications")
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications)
        setNotifications(
          parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          })),
        )
      } catch (e) {
        console.error("Erro ao carregar notificações:", e)
      }
    }

    // Simular notificações aleatórias a cada 30-60 segundos
    const interval = setInterval(
      () => {
        const random = Math.random()
        if (random > 0.7) {
          const types: NotificationType[] = ["info", "success", "warning", "error"]
          const type = types[Math.floor(Math.random() * types.length)]

          const titles = {
            info: "Nova atualização",
            success: "Operação concluída",
            warning: "Atenção necessária",
            error: "Erro detectado",
          }

          const messages = {
            info: "Uma nova atualização está disponível para o sistema.",
            success: "A operação foi concluída com sucesso.",
            warning: "Verifique as configurações do sistema.",
            error: "Ocorreu um erro ao processar a solicitação.",
          }

          addNotification({
            title: titles[type],
            message: messages[type],
            type,
          })
        }
      },
      Math.random() * 30000 + 30000,
    ) // Entre 30 e 60 segundos

    return () => clearInterval(interval)
  }, [])

  // Salvar notificações no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications))
  }, [notifications])

  const addNotification = (notification: Omit<Notification, "id" | "read" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      timestamp: new Date(),
    }

    setNotifications((prev) => [newNotification, ...prev])

    // Mostrar toast para notificações novas
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === "error" ? "destructive" : "default",
    })
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}

