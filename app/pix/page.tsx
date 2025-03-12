"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePixStatus } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, MessageSquare, RefreshCw, CreditCard, FileText, ListFilter } from "lucide-react"
import { CreatePixCharge } from "@/components/pix/create-pix-charge"
import { BulkPixCharge } from "@/components/pix/bulk-pix-charge"
import { PixTransactionHistory } from "@/components/pix/pix-transaction-history"
import { PixChargesByStatus } from "@/components/pix/pix-charges-by-status"

export default function PixPage() {
  const router = useRouter()
  const { data: pixStatus, isLoading, refetch } = usePixStatus()
  const [isRefetching, setIsRefetching] = useState(false)

  const connectionStatus = pixStatus?.connection ?? null
  const authStatus = pixStatus?.auth ?? null

  const handleRetryConnection = async () => {
    setIsRefetching(true)
    await refetch()
    setIsRefetching(false)
  }

  useEffect(() => {
    if (!connectionStatus || !authStatus) {
      console.warn("Problema de conexão ou autenticação com o sistema PIX.")
    }
  }, [connectionStatus, authStatus])
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sistema PIX</h1>
          <p className="text-muted-foreground mt-1">Gerencie cobranças PIX e acompanhe transações</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleRetryConnection}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span>Verificar Conexão</span>
          </Button>
          <Button
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex items-center gap-2"
            onClick={() => router.push("/whatsapp")}
          >
            <MessageSquare className="h-4 w-4" />
            Enviar PIX por WhatsApp
          </Button>
        </div>
      </div>

      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle>Status do Sistema PIX</CardTitle>
          <CardDescription>Verifique o status da conexão com o sistema PIX</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Conexão:</span>
                  {connectionStatus === null ? (
                    <span>Desconhecido</span>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryConnection}
                  disabled={isRefetching}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                  <span>Atualizar</span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Autenticação:</span>
                {authStatus === null ? (
                  <span>Desconhecido</span>
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
              {(!connectionStatus || !authStatus) && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Problema de conexão</AlertTitle>
                  <AlertDescription>
                    Há um problema com a conexão ao sistema PIX. Verifique se o serviço está online e tente novamente.
                    <div className="mt-2">
                      <Button onClick={handleRetryConnection} disabled={isRefetching}>
                        {isRefetching ? "Verificando..." : "Tentar novamente"}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="status" className="space-y-4 mt-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger
            value="status"
            className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950"
          >
            <ListFilter className="h-4 w-4" />
            Cobranças por Status
          </TabsTrigger>
          <TabsTrigger
            value="bulk"
            className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950"
          >
            <CreditCard className="h-4 w-4" />
            Cobranças em Massa
          </TabsTrigger>
          <TabsTrigger
            value="create"
            className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            Gerar Cobrança
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950"
          >
            <FileText className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>
        <TabsContent value="status">
          <PixChargesByStatus />
        </TabsContent>
        <TabsContent value="bulk">
          <BulkPixCharge disabled={!connectionStatus || !authStatus} />
        </TabsContent>
        <TabsContent value="create">
          <CreatePixCharge disabled={!connectionStatus || !authStatus} />
        </TabsContent>
        <TabsContent value="history">
          <PixTransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

