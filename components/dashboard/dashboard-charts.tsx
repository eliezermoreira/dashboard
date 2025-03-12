"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, LineChart, PieChart } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Dados de exemplo para os gráficos
const monthlyData = [
  { name: "Jan", value: 1200 },
  { name: "Fev", value: 1900 },
  { name: "Mar", value: 1500 },
  { name: "Abr", value: 2200 },
  { name: "Mai", value: 2800 },
  { name: "Jun", value: 2600 },
  { name: "Jul", value: 3100 },
  { name: "Ago", value: 2900 },
  { name: "Set", value: 3300 },
  { name: "Out", value: 3500 },
  { name: "Nov", value: 3800 },
  { name: "Dez", value: 4100 },
]

const resellerDistribution = [
  { name: "São Paulo", value: 45 },
  { name: "Rio de Janeiro", value: 25 },
  { name: "Minas Gerais", value: 15 },
  { name: "Outros", value: 15 },
]

const clientsPerReseller = [
  { name: "1-10", value: 30 },
  { name: "11-20", value: 25 },
  { name: "21-50", value: 20 },
  { name: "51-100", value: 15 },
  { name: "100+", value: 10 },
]

export function DashboardCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Transações PIX Mensais</CardTitle>
          <CardDescription>Volume de transações PIX nos últimos 12 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bar">
            <TabsList className="mb-4">
              <TabsTrigger value="bar">Barras</TabsTrigger>
              <TabsTrigger value="line">Linha</TabsTrigger>
            </TabsList>
            <TabsContent value="bar">
              <BarChart data={monthlyData} height={300} />
            </TabsContent>
            <TabsContent value="line">
              <LineChart data={monthlyData} height={300} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Distribuição</CardTitle>
          <CardDescription>Análise de distribuição</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="resellers">
            <TabsList className="mb-4">
              <TabsTrigger value="resellers">Revendedores</TabsTrigger>
              <TabsTrigger value="clients">Clientes</TabsTrigger>
            </TabsList>
            <TabsContent value="resellers">
              <PieChart data={resellerDistribution} height={300} />
            </TabsContent>
            <TabsContent value="clients">
              <PieChart data={clientsPerReseller} height={300} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

