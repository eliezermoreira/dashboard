"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResellerStats } from "@/components/dashboard/reseller-stats"
import { PixStats } from "@/components/dashboard/pix-stats"
import { RecentResellers } from "@/components/dashboard/recent-resellers"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { ResellersByClientsChart } from "@/components/dashboard/resellers-by-clients-chart"
import { useAuth } from "@/lib/auth-context"
import { DashboardSkeleton } from "@/components/ui/skeletons"
import { listResellers } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [resellerCount, setResellerCount] = useState(0)
  const [clientCount, setClientCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resellers = await listResellers()

        if (Array.isArray(resellers)) {
          // Total de revendedores
          setResellerCount(resellers.length)

          // Total de clientes
          const totalClients = resellers.reduce((sum, reseller) => sum + (reseller.quantidade_clientes || 0), 0)
          setClientCount(totalClients)
        }
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados do dashboard.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  if (authLoading || loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        {user && <div className="text-sm text-muted-foreground">Bem-vindo, {user.name}</div>}
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="resellers">Revendedores</TabsTrigger>
          <TabsTrigger value="pix">Pagamentos PIX</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Revendedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{resellerCount}</div>
                <p className="text-xs text-blue-600 dark:text-blue-400">Revendedores cadastrados no sistema</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">{clientCount}</div>
                <p className="text-xs text-green-600 dark:text-green-400">Clientes atendidos pelos revendedores</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Média de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {resellerCount > 0 ? (clientCount / resellerCount).toFixed(1) : "0"}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">Média de clientes por revendedor</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">Ativo</div>
                <p className="text-xs text-amber-600 dark:text-amber-400">Sistema operando normalmente</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Distribuição de Clientes</CardTitle>
                <CardDescription>Análise da distribuição de clientes por revendedor</CardDescription>
              </CardHeader>
              <CardContent>
                <ResellersByClientsChart />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Revendedores Recentes</CardTitle>
                <CardDescription>Últimos revendedores cadastrados no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentResellers />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Transações PIX Recentes</CardTitle>
                <CardDescription>Últimas transações PIX realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentTransactions />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Status do Sistema PIX</CardTitle>
                <CardDescription>Status da conexão com o sistema PIX</CardDescription>
              </CardHeader>
              <CardContent>
                <PixStats compact />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="resellers" className="space-y-4">
          <ResellerStats />
        </TabsContent>
        <TabsContent value="pix" className="space-y-4">
          <PixStats />
        </TabsContent>
      </Tabs>
    </div>
  )
}

