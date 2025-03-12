"use client"

import { useState, useEffect } from "react"
import { listResellers } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function ResellerStats() {
  const [totalResellers, setTotalResellers] = useState(0)
  const [totalClients, setTotalClients] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resellers = await listResellers()
        // Ensure resellers is an array
        if (!Array.isArray(resellers)) {
          setTotalResellers(0)
          setTotalClients(0)
          return
        }

        setTotalResellers(resellers.length)

        const clients = resellers.reduce((total, reseller) => total + (reseller.quantidade_clientes || 0), 0)
        setTotalClients(clients)
      } catch (error) {
        toast({
          title: "Erro ao carregar estatísticas",
          description: "Não foi possível carregar as estatísticas de revendedores.",
          variant: "destructive",
        })
        setTotalResellers(0)
        setTotalClients(0)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [toast])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Revendedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "--" : totalResellers}</div>
          <p className="text-xs text-muted-foreground">
            {loading ? "Carregando dados..." : "Revendedores cadastrados"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "--" : totalClients}</div>
          <p className="text-xs text-muted-foreground">{loading ? "Carregando dados..." : "Clientes atendidos"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Média de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading || totalResellers === 0 ? "--" : (totalClients / totalResellers).toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">{loading ? "Carregando dados..." : "Clientes por revendedor"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">Ativo</div>
          <p className="text-xs text-muted-foreground">Sistema operando normalmente</p>
        </CardContent>
      </Card>
    </div>
  )
}

