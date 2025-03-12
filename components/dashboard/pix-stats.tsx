"use client"

import { useState, useEffect } from "react"
import { testConnection, testAuthentication } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle } from "lucide-react"

interface PixStatsProps {
  compact?: boolean
}

export function PixStats({ compact = false }: PixStatsProps) {
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null)
  const [authStatus, setAuthStatus] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const connection = await testConnection()
        setConnectionStatus(connection)

        if (connection) {
          const auth = await testAuthentication()
          setAuthStatus(auth)
        }
      } catch (error) {
        toast({
          title: "Erro ao verificar status PIX",
          description: "Não foi possível verificar o status do sistema PIX.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [toast])

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">Conexão:</span>
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
            ) : connectionStatus ? (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5 mr-1" />
                <span>Conectado</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5 mr-1" />
                <span>Desconectado</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">Autenticação:</span>
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
            ) : authStatus ? (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5 mr-1" />
                <span>Autenticado</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5 mr-1" />
                <span>Não autenticado</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status da Conexão</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-xl font-bold flex items-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mr-2"></div>
              Verificando...
            </div>
          ) : connectionStatus ? (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-xl font-bold">Conectado</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600 dark:text-red-400">
              <XCircle className="h-5 w-5 mr-2" />
              <span className="text-xl font-bold">Desconectado</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Status da conexão com o servidor PIX</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status da Autenticação</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-xl font-bold flex items-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mr-2"></div>
              Verificando...
            </div>
          ) : authStatus ? (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-xl font-bold">Autenticado</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600 dark:text-red-400">
              <XCircle className="h-5 w-5 mr-2" />
              <span className="text-xl font-bold">Não Autenticado</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Status da autenticação com o servidor PIX</p>
        </CardContent>
      </Card>
    </div>
  )
}

