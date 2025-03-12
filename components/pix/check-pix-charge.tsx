"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getPixCharge, type PixCharge } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Search, Copy, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CheckPixChargeProps {
  disabled?: boolean
}

// Interface para rastrear cobranças
interface ChargeTracking {
  resellerId: string
  chargeId: string
  txid?: string
  status: "pending" | "generated" | "sent" | "error"
  lastChecked?: string
  chargeData?: PixCharge
}

export function CheckPixCharge({ disabled = false }: CheckPixChargeProps) {
  const [transactionId, setTransactionId] = useState("")
  const [loading, setLoading] = useState(false)
  const [chargeResult, setChargeResult] = useState<PixCharge | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<ChargeTracking[]>([])
  const { toast } = useToast()

  // Carregar transações recentes do localStorage
  useEffect(() => {
    const savedTracking = localStorage.getItem("pixChargeTracking")
    if (savedTracking) {
      try {
        const parsed = JSON.parse(savedTracking)
        // Ordenar por data mais recente
        const sorted = parsed.sort((a: ChargeTracking, b: ChargeTracking) => {
          const dateA = a.lastChecked ? new Date(a.lastChecked).getTime() : 0
          const dateB = b.lastChecked ? new Date(b.lastChecked).getTime() : 0
          return dateB - dateA
        })
        // Pegar apenas as 5 mais recentes
        setRecentTransactions(sorted.slice(0, 5))
      } catch (e) {
        console.error("Erro ao carregar dados de rastreamento:", e)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transactionId.trim()) return

    setLoading(true)
    setChargeResult(null)
    setError(null)

    try {
      const result = await getPixCharge(transactionId)
      // Se a resposta for um array, pega o primeiro item
      const apiResponse = Array.isArray(result) ? result[0] : result
      
      if (apiResponse && apiResponse.dados) {
        const dados = apiResponse.dados
        const enhancedCharge: PixCharge = {
          id: dados.txid,
          txid: dados.txid,
          valor: typeof dados.valor === "string" ? Number(dados.valor) : dados.valor,
          nome: dados.devedor?.nome || "",
          cpf: dados.devedor?.cpf || "",
          status: dados.status,
          created_at: dados.criacao,
          codigo_pix: dados.pix?.copiaCola,
          qrcode: dados.pix?.qrCode,
        }
        setChargeResult(enhancedCharge)

        // Atualizar o tracking se esta cobrança já existir
        const savedTracking = localStorage.getItem("pixChargeTracking")
        if (savedTracking) {
          try {
            const tracking = JSON.parse(savedTracking)
            let updated = false

            const updatedTracking = tracking.map((item: ChargeTracking) => {
              if (item.chargeId === enhancedCharge.id || (enhancedCharge.txid && item.txid === enhancedCharge.txid)) {
                updated = true
                return {
                  ...item,
                  txid: enhancedCharge.txid,
                  lastChecked: new Date().toISOString(),
                  chargeData: enhancedCharge,
                }
              }
              return item
            })

            if (updated) {
              localStorage.setItem("pixChargeTracking", JSON.stringify(updatedTracking))

              // Atualizar as transações recentes
              const sorted = updatedTracking.sort((a: ChargeTracking, b: ChargeTracking) => {
                const dateA = a.lastChecked ? new Date(a.lastChecked).getTime() : 0
                const dateB = b.lastChecked ? new Date(b.lastChecked).getTime() : 0
                return dateB - dateA
              })
              setRecentTransactions(sorted.slice(0, 5))
            }
          } catch (e) {
            console.error("Erro ao atualizar tracking:", e)
          }
        }
      } else {
        setError("Transação não encontrada ou ocorreu um erro ao consultar.")
      }
    } catch (error) {
      toast({
        title: "Erro ao consultar cobrança PIX",
        description: "Não foi possível consultar a cobrança PIX. Verifique o ID e tente novamente.",
        variant: "destructive",
      })
      setError("Erro ao consultar cobrança PIX. Verifique o ID e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setTransactionId("")
    setChargeResult(null)
    setError(null)
  }

  // Helper function para formatar valores monetários
  const formatCurrency = (value: any): string => {
    if (value === undefined || value === null) return "0.00"
    const numValue = typeof value === "number" ? value : Number(value)
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2)
  }

  // Função para formatar data
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Consultar Cobrança PIX</CardTitle>
          <CardDescription>Consulte o status de uma cobrança PIX pelo ID da transação ou TXID</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transactionId">ID da Transação ou TXID</Label>
              <div className="flex gap-2">
                <Input
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  required
                  disabled={disabled || loading}
                  placeholder="Digite o ID ou TXID da transação PIX"
                />
                <Button type="submit" disabled={loading || disabled || !transactionId.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {chargeResult && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 mt-4">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle>Cobrança PIX encontrada</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="font-medium">ID:</span> {chargeResult.id}
                    </div>
                    {chargeResult.txid && (
                      <div>
                        <span className="font-medium">TXID:</span> {chargeResult.txid}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Valor:</span> R$ {formatCurrency(chargeResult.valor)}
                    </div>
                    <div>
                      <span className="font-medium">Nome:</span> {chargeResult.nome || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">CPF:</span> {chargeResult.cpf || "N/A"}
                    </div>
                    {chargeResult.status && (
                      <div>
                        <span className="font-medium">Status:</span> {chargeResult.status}
                      </div>
                    )}
                    {chargeResult.created_at && (
                      <div>
                        <span className="font-medium">Data de Criação:</span>{" "}
                        {new Date(chargeResult.created_at).toLocaleString()}
                      </div>
                    )}
                    {chargeResult.codigo_pix && (
                      <div className="pt-2">
                        <div className="font-medium">Código PIX (Copia e Cola):</div>
                        <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-md relative group">
                          <div className="text-xs break-all pr-8">{chargeResult.codigo_pix}</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1"
                            onClick={() => {
                              navigator.clipboard.writeText(chargeResult.codigo_pix || "")
                              toast({
                                title: "Código copiado",
                                description: "Código PIX copiado para a área de transferência.",
                              })
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Erro na consulta</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {(chargeResult || error) && (
              <Button variant="outline" onClick={handleReset} className="mt-2">
                Nova Consulta
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas transações PIX geradas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Nenhuma transação recente encontrada.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">TXID</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction, index) => (
                  <TableRow
                    key={transaction.chargeId}
                    className={index % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-900"}
                  >
                    <TableCell className="font-medium">
                      <div className="truncate max-w-[150px]">{transaction.txid || transaction.chargeId}</div>
                    </TableCell>
                    <TableCell>{formatDate(transaction.lastChecked)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const idToUse = transaction.txid || transaction.chargeId
                            setTransactionId(idToUse)
                            handleSubmit({ preventDefault: () => {} } as React.FormEvent)
                          }}
                          disabled={disabled || loading}
                          className="h-8"
                        >
                          <Search className="h-3.5 w-3.5 mr-1" />
                          Consultar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const idToCopy = transaction.txid || transaction.chargeId
                            navigator.clipboard.writeText(idToCopy)
                            toast({
                              title: "ID copiado",
                              description: "ID da transação copiado para a área de transferência.",
                            })
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="sr-only">Copiar ID</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

