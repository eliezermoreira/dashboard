"use client"

import { useState, useEffect } from "react"
import { listResellers, createPixCharge, getPixCharge, type Reseller, type PixCharge } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BulkPixChargeProps {
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

export function BulkPixCharge({ disabled = false }: BulkPixChargeProps) {
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResellers, setSelectedResellers] = useState<string[]>([])
  const [bulkChargeProgress, setBulkChargeProgress] = useState(0)
  const [isBulkCharging, setIsBulkCharging] = useState(false)
  const [chargeTracking, setChargeTracking] = useState<ChargeTracking[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const [isCheckingCharges, setIsCheckingCharges] = useState(false)

  // Carregar dados de rastreamento do localStorage
  useEffect(() => {
    const savedTracking = localStorage.getItem("pixChargeTracking")
    if (savedTracking) {
      try {
        setChargeTracking(JSON.parse(savedTracking))
      } catch (e) {
        console.error("Erro ao carregar dados de rastreamento:", e)
      }
    }
  }, [])

  // Salvar dados de rastreamento no localStorage quando mudar
  useEffect(() => {
    if (chargeTracking.length > 0) {
      localStorage.setItem("pixChargeTracking", JSON.stringify(chargeTracking))
    }
  }, [chargeTracking])

  // Fetch resellers on component mount
  useEffect(() => {
    const fetchResellers = async () => {
      try {
        const data = await listResellers()
        setResellers(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch resellers:", error)
        toast({
          title: "Erro ao carregar revendedores",
          description: "Não foi possível carregar a lista de revendedores.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchResellers()
  }, [toast])

  // Função para atualizar o rastreamento de cobranças
  const updateChargeTracking = (
    resellerId: string,
    chargeId: string,
    status: ChargeTracking["status"],
    chargeData?: PixCharge,
  ) => {
    setChargeTracking((prev) => {
      // Verificar se já existe um registro para esta revenda
      const existingIndex = prev.findIndex((item) => item.resellerId === resellerId)

      if (existingIndex >= 0) {
        // Atualizar registro existente
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          chargeId,
          txid: chargeData?.txid,
          status,
          lastChecked: new Date().toISOString(),
          chargeData: chargeData || updated[existingIndex].chargeData,
        }
        return updated
      } else {
        // Criar novo registro
        return [
          ...prev,
          {
            resellerId,
            chargeId,
            txid: chargeData?.txid,
            status,
            lastChecked: new Date().toISOString(),
            chargeData,
          },
        ]
      }
    })
  }

  // Função para gerar uma cobrança para um revendedor
  const generateChargeForReseller = async (reseller: Reseller): Promise<string | null> => {
    try {
      // Calcular valor com base na quantidade de clientes
      const valor = reseller.quantidade_clientes * 10

      const chargeData = {
        valor,
        cpf: reseller.cpf,
        nome: `${reseller.nome} ${reseller.sobrenome}`,
      }

      const result = await createPixCharge(chargeData)

      if (result && result.id) {
        // Atualizar rastreamento
        updateChargeTracking(reseller.id, result.id, "generated", result)

        // Mostrar toast de sucesso
        toast({
          title: "Cobrança gerada",
          description: `Cobrança gerada com sucesso para ${reseller.nome} ${reseller.sobrenome}.`,
        })

        return result.id
      }
    } catch (error) {
      console.error(`Erro ao gerar cobrança para ${reseller.nome}:`, error)
      // Registrar erro no rastreamento
      updateChargeTracking(reseller.id, "error", "error")

      // Mostrar toast de erro
      toast({
        title: "Erro ao gerar cobrança",
        description: `Não foi possível gerar cobrança para ${reseller.nome} ${reseller.sobrenome}.`,
        variant: "destructive",
      })
    }

    return null
  }

  // Função para verificar o status de uma cobrança e obter o TXID
  const checkChargeStatus = async (tracking: ChargeTracking) => {
    try {
      // Pular verificação para cobranças com erro ou pendentes
      if (tracking.status === "error" || tracking.status === "pending") {
        return null
      }

      const charge = await getPixCharge(tracking.chargeId)
      if (charge) {
        // Atualizar o tracking com os dados mais recentes, incluindo o TXID
        updateChargeTracking(tracking.resellerId, tracking.chargeId, tracking.status, charge)
        return charge
      }
    } catch (error) {
      console.error(`Erro ao verificar cobrança ${tracking.chargeId}:`, error)
    }
    return null
  }

  // Função para verificar todas as cobranças
  const checkAllCharges = async () => {
    if (isCheckingCharges || chargeTracking.length === 0) return

    setIsCheckingCharges(true)

    try {
      for (const tracking of chargeTracking) {
        await checkChargeStatus(tracking)
        // Pequeno delay para não sobrecarregar a API
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      toast({
        title: "Verificação concluída",
        description: "Status de todas as cobranças atualizado.",
      })
    } catch (error) {
      console.error("Erro ao verificar cobranças:", error)
    } finally {
      setIsCheckingCharges(false)
    }
  }

  // Função para gerar cobranças em massa
  const handleBulkCharge = async () => {
    if (selectedResellers.length === 0) {
      toast({
        title: "Nenhum revendedor selecionado",
        description: "Selecione pelo menos um revendedor para gerar cobranças.",
        variant: "destructive",
      })
      return
    }

    setIsBulkCharging(true)
    setBulkChargeProgress(0)

    try {
      const selectedResellersList = resellers.filter((r) => selectedResellers.includes(r.id))
      let processed = 0
      let successful = 0

      for (const reseller of selectedResellersList) {
        // Registrar como pendente
        updateChargeTracking(reseller.id, "pending", "pending")

        // Gerar cobrança
        const chargeId = await generateChargeForReseller(reseller)
        if (chargeId) successful++

        // Atualizar progresso
        processed++
        setBulkChargeProgress(Math.round((processed / selectedResellersList.length) * 100))

        // Pequeno delay para não sobrecarregar a API
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      toast({
        title: "Processo concluído",
        description: `Foram geradas ${successful} de ${processed} cobranças com sucesso.`,
      })

      // Limpar seleção
      setSelectedResellers([])
    } catch (error) {
      console.error("Erro ao gerar cobranças em massa:", error)
      toast({
        title: "Erro ao gerar cobranças",
        description: "Ocorreu um erro ao gerar as cobranças em massa.",
        variant: "destructive",
      })
    } finally {
      setIsBulkCharging(false)
    }
  }

  // Função para selecionar/desselecionar todos os revendedores
  const toggleSelectAll = () => {
    if (selectedResellers.length === filteredResellers.length) {
      setSelectedResellers([])
    } else {
      setSelectedResellers(filteredResellers.map((r) => r.id))
    }
  }

  // Função para alternar a seleção de um revendedor
  const toggleResellerSelection = (resellerId: string) => {
    setSelectedResellers((prev) =>
      prev.includes(resellerId) ? prev.filter((id) => id !== resellerId) : [...prev, resellerId],
    )
  }

  // Função para obter o status formatado de uma cobrança
  const getChargeStatusDisplay = (resellerId: string) => {
    const tracking = chargeTracking.find((t) => t.resellerId === resellerId)

    if (!tracking) {
      return <Badge variant="outline">Não gerada</Badge>
    }

    switch (tracking.status) {
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
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
          >
            Gerada
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

  // Filtrar revendedores com base no termo de busca
  const filteredResellers = resellers.filter(
    (reseller) =>
      reseller.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reseller.sobrenome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reseller.nome_usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reseller.cpf.includes(searchTerm),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Geração de Cobranças em Massa</CardTitle>
        <CardDescription>Gere cobranças PIX para múltiplos revendedores de uma só vez</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedResellers.length === filteredResellers.length && filteredResellers.length > 0}
                onCheckedChange={toggleSelectAll}
                disabled={loading || disabled}
              />
              <Label htmlFor="select-all" className="text-sm font-medium">
                Selecionar todos ({filteredResellers.length})
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative w-full md:w-64">
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
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                <Input
                  placeholder="Buscar revendedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  disabled={loading || disabled}
                />
              </div>
              <Button
                onClick={handleBulkCharge}
                disabled={selectedResellers.length === 0 || isBulkCharging || disabled}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isBulkCharging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
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
                    Gerar Cobranças
                  </>
                )}
              </Button>
            </div>
          </div>

          {isBulkCharging && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso:</span>
                <span>{bulkChargeProgress}%</span>
              </div>
              <Progress value={bulkChargeProgress} className="h-2" />
            </div>
          )}

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="font-semibold">Revendedor</TableHead>
                  <TableHead className="font-semibold">Usuário</TableHead>
                  <TableHead className="font-semibold">Clientes</TableHead>
                  <TableHead className="font-semibold">Valor</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">Carregando revendedores...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredResellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      <div className="text-sm text-muted-foreground">
                        {searchTerm
                          ? "Nenhum revendedor encontrado com os termos de busca."
                          : "Nenhum revendedor cadastrado."}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResellers.map((reseller, index) => {
                    const tracking = chargeTracking.find((t) => t.resellerId === reseller.id)
                    return (
                      <TableRow
                        key={reseller.id}
                        className={index % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-900"}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedResellers.includes(reseller.id)}
                            onCheckedChange={() => toggleResellerSelection(reseller.id)}
                            disabled={disabled}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {reseller.nome} {reseller.sobrenome}
                        </TableCell>
                        <TableCell>{reseller.nome_usuario}</TableCell>
                        <TableCell>{reseller.quantidade_clientes}</TableCell>
                        <TableCell>R$ {(reseller.quantidade_clientes * 10).toFixed(2)}</TableCell>
                        <TableCell>{getChargeStatusDisplay(reseller.id)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {tracking && tracking.chargeId !== "pending" && tracking.chargeId !== "error" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Copiar o txid da cobrança para a área de transferência (se disponível)
                                  const idToCopy = tracking.txid || tracking.chargeId
                                  navigator.clipboard.writeText(idToCopy)
                                  toast({
                                    title: "ID copiado",
                                    description: "ID da cobrança copiado para a área de transferência.",
                                  })
                                }}
                                className="flex items-center gap-1"
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
                                  className="h-3.5 w-3.5"
                                >
                                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                                </svg>
                                Copiar ID
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateChargeForReseller(reseller)}
                                disabled={disabled || isBulkCharging}
                                className="flex items-center gap-1"
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
                                  className="h-3.5 w-3.5"
                                >
                                  <path d="M5 12h14"></path>
                                  <path d="M12 5v14"></path>
                                </svg>
                                Gerar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          {selectedResellers.length} de {filteredResellers.length} revendedores selecionados
        </div>
        <div className="text-sm text-muted-foreground">
          Valor total: R${" "}
          {selectedResellers
            .reduce((total, id) => {
              const reseller = resellers.find((r) => r.id === id)
              return total + (reseller ? reseller.quantidade_clientes * 10 : 0)
            }, 0)
            .toFixed(2)}
        </div>
      </CardFooter>
    </Card>
  )
}

