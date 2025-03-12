"use client"

import { useState, useEffect } from "react"
import { listResellers } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { BarChart } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

export function ResellersByClientsChart() {
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resellers = await listResellers()

        if (Array.isArray(resellers)) {
          // Agrupar revendedores por faixas de quantidade de clientes
          const groups = {
            "0-10": 0,
            "11-20": 0,
            "21-50": 0,
            "51-100": 0,
            "100+": 0,
          }

          resellers.forEach((reseller) => {
            const clients = reseller.quantidade_clientes || 0

            if (clients <= 10) groups["0-10"]++
            else if (clients <= 20) groups["11-20"]++
            else if (clients <= 50) groups["21-50"]++
            else if (clients <= 100) groups["51-100"]++
            else groups["100+"]++
          })

          // Converter para o formato do gráfico
          const data = Object.entries(groups).map(([range, count]) => ({
            name: range,
            value: count,
          }))

          setChartData(data)
        }
      } catch (error) {
        console.error("Erro ao carregar dados para o gráfico:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados para o gráfico.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  if (loading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (chartData.length === 0) {
    return <div className="text-center py-4">Nenhum dado disponível para exibição.</div>
  }

  return <BarChart data={chartData} height={300} className="mt-4" />
}

