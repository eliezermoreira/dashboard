"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Copy, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Interface para rastrear cobranças
interface ChargeTracking {
  resellerId: string
  chargeId: string
  txid?: string // Adicionado txid
  status: "pending" | "generated" | "sent" | "error"
  lastChecked?: string
  chargeData?: any
}

export function PixTransactionHistory() {
  const [chargeTracking, setChargeTracking] = useState<ChargeTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Carregar dados de rastreamento do localStorage
  useEffect(() => {
    const loadData = () => {
      setLoading(true)
      const savedTracking = localStorage.getItem("pixChargeTracking")
      if (savedTracking) {
        try {
          const parsed = JSON.parse(savedTracking)
          setChargeTracking(parsed)
        } catch (e) {
          console.error("Erro ao carregar dados de rastreamento:", e)
          toast({
            title: "Erro ao carregar histórico",
            description: "Não foi possível carregar o histórico de transações.",
            variant: "destructive",
          })
        }
      }
      setLoading(false)
    }

    loadData()
  }, [toast])

  // Filtrar transações com base no termo de busca
  const filteredTransactions = chargeTracking.filter(
    (transaction) =>
      (transaction.chargeId && transaction.chargeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.txid && transaction.txid.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.chargeData?.nome && transaction.chargeData.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.chargeData?.cpf && transaction.chargeData.cpf.includes(searchTerm)),
  )

  // Função para copiar o ID da transação
  const copyTransactionId = (transaction: ChargeTracking) => {
    // Preferir o txid se disponível
    const idToCopy = transaction.txid || transaction.chargeId
    navigator.clipboard.writeText(idToCopy)
    toast({
      title: "ID copiado",
      description: "ID da transação copiado para a área de transferência.",
    })
  }

  // Função para limpar o histórico
  const clearHistory = () => {
    if (confirm("Tem certeza que deseja limpar todo o histórico de transações?")) {
      localStorage.removeItem("pixChargeTracking")
      setChargeTracking([])
      toast({
        title: "Histórico limpo",
        description: "O histórico de transações foi limpo com sucesso.",
      })
    }
  }

  // Função para formatar a data
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"

    try {
      const date = new Date(dateString)
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return "Data inválida"
    }
  }

  // Função para obter o status formatado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800"
          >
            Pendente
          </Badge>
        )
      case "generated":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800"
          >
            Gerada
          </Badge>
        )
      case "sent":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
          >
            Enviada
          </Badge>
        )
      case "error":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800"
          >
            Erro
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Histórico de Transações PIX</CardTitle>
            <CardDescription>Visualize todas as cobranças PIX geradas</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true)
                setTimeout(() => {
                  const savedTracking = localStorage.getItem("pixChargeTracking")
                  if (savedTracking) {
                    try {
                      setChargeTracking(JSON.parse(savedTracking))
                    } catch (e) {
                      console.error("Erro ao recarregar dados:", e)
                    }
                  }
                  setLoading(false)
                }, 500)
              }}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="destructive" size="sm" onClick={clearHistory} className="flex items-center gap-1">
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
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" x2="10" y1="11" y2="17"></line>
                <line x1="14" x2="14" y1="11" y2="17"></line>
              </svg>
              Limpar Histórico
            </Button>
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Carregando histórico de transações...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto h-12 w-12 text-muted-foreground"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <line x1="3" x2="21" y1="9" y2="9"></line>
              <path d="M8 3v3"></path>
              <path d="M16 3v3"></path>
              <path d="M12 12h.01"></path>
              <path d="M17 12h.01"></path>
              <path d="M7 12h.01"></path>
              <path d="M12 16h.01"></path>
              <path d="M17 16h.01"></path>
              <path d="M7 16h.01"></path>
            </svg>
            <h3 className="mt-2 text-lg font-medium">Nenhuma transação encontrada</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm
                ? "Nenhuma transação corresponde aos termos de busca."
                : "Ainda não há transações registradas."}
            </p>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">ID da Transação (TXID)</TableHead>
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="font-semibold">CPF</TableHead>
                  <TableHead className="font-semibold">Valor</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction, index) => (
                  <TableRow
                    key={transaction.chargeId}
                    className={index % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-900"}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <span className="truncate max-w-[120px]">{transaction.txid || transaction.chargeId}</span>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.chargeData?.nome || "N/A"}</TableCell>
                    <TableCell>{transaction.chargeData?.cpf || "N/A"}</TableCell>
                    <TableCell>
                      {transaction.chargeData?.valor ? `R$ ${Number(transaction.chargeData.valor).toFixed(2)}` : "N/A"}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>{formatDate(transaction.lastChecked)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyTransactionId(transaction)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copiar ID</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

