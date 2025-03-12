"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  listResellers,
  getPixCharge,
  createPixCharge,
  sendWhatsAppMessage,
  type Reseller,
  type PixCharge,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Copy, Send, Search, RefreshCw, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"

// Interface para rastrear cobranças
interface ChargeTracking {
  resellerId: string
  chargeId: string
  txid?: string // Adicionado txid
  status: "pending" | "generated" | "sent" | "error"
  lastChecked?: string
  chargeData?: PixCharge
}

export default function WhatsAppPage() {
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [selectedReseller, setSelectedReseller] = useState<string>("")
  const [transactionId, setTransactionId] = useState("")
  const [pixCharge, setPixCharge] = useState<PixCharge | null>(null)
  const [messageTemplate, setMessageTemplate] = useState(
    "*Cobrança PIX Gerada*\n\nOlá {nome},\n\nSua cobrança PIX foi gerada com sucesso!\n\nValor: R$ {valor}\nID da Transação: {id}\nTXID: {txid}\n\nCódigo PIX Copia e Cola:\n{codigopix}\n\nPor favor, efetue o pagamento utilizando o QR Code enviado ou o código acima.\n\nAtenciosamente,\nPrime Stream",
  )
  const [finalMessage, setFinalMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [searchingPix, setSearchingPix] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [success, setSuccess] = useState(false)
  const [selectedResellers, setSelectedResellers] = useState<string[]>([])
  const [bulkChargeProgress, setBulkChargeProgress] = useState(0)
  const [isBulkCharging, setIsBulkCharging] = useState(false)
  const [chargeTracking, setChargeTracking] = useState<ChargeTracking[]>([])
  const [isCheckingCharges, setIsCheckingCharges] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

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
      }
    }

    fetchResellers()
  }, [toast])

  // Verificação periódica das cobranças
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isCheckingCharges && chargeTracking.length > 0) {
        checkAllCharges()
      }
    }, 60000) // Verificar a cada 1 minuto

    return () => clearInterval(interval)
  }, [chargeTracking, isCheckingCharges])

  // Update final message when template or PIX charge changes
  useEffect(() => {
    if (pixCharge && selectedReseller) {
      const reseller = resellers.find((r) => r.id === selectedReseller)
      if (!reseller) return

      let message = messageTemplate

      // Replace variables in template
      message = message.replace(/{nome}/g, reseller.nome)
      message = message.replace(/{sobrenome}/g, reseller.sobrenome)
      message = message.replace(/{valor}/g, formatCurrency(pixCharge.valor))
      message = message.replace(/{id}/g, pixCharge.id || "")
      message = message.replace(/{txid}/g, pixCharge.txid || "")
      message = message.replace(/{codigopix}/g, pixCharge.codigo_pix || "Não disponível")

      setFinalMessage(message)
    }
  }, [messageTemplate, pixCharge, selectedReseller, resellers])

  const handleResellerChange = (value: string) => {
    setSelectedReseller(value)
  }

  const handleSearchPix = async () => {
    if (!transactionId.trim()) return

    setSearchingPix(true)
    setPixCharge(null)
    setSuccess(false)

    try {
      const result = await getPixCharge(transactionId)
      if (result) {
        setPixCharge(result)
      } else {
        toast({
          title: "Cobrança não encontrada",
          description: "Não foi possível encontrar a cobrança PIX com o ID informado.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao buscar cobrança",
        description: "Ocorreu um erro ao buscar a cobrança PIX.",
        variant: "destructive",
      })
    } finally {
      setSearchingPix(false)
    }
  }

  const handleSendMessage = async () => {
    if (!pixCharge || !selectedReseller || !finalMessage) return

    setSendingMessage(true)
    setSuccess(false)

    try {
      const reseller = resellers.find((r) => r.id === selectedReseller)
      if (!reseller) {
        throw new Error("Revendedor não encontrado")
      }

      const success = await sendWhatsAppMessage({
        number: reseller.whatsapp,
        text: finalMessage,
        delay: 8000,
      })

      if (success) {
        setSuccess(true)

        // Atualizar o rastreamento
        updateChargeTracking(selectedReseller, pixCharge.id, "sent", pixCharge)

        toast({
          title: "Mensagem enviada",
          description: "A cobrança PIX foi enviada por WhatsApp com sucesso.",
        })
      } else {
        throw new Error("Falha ao enviar mensagem")
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a cobrança por WhatsApp.",
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    })
  }

  // Helper function to safely format currency values
  const formatCurrency = (value: any): string => {
    if (value === undefined || value === null) return "0.00"
    const numValue = typeof value === "number" ? value : Number(value)
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2)
  }

  const resetForm = () => {
    setTransactionId("")
    setPixCharge(null)
    setSuccess(false)
  }

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
          txid: chargeData?.txid, // Armazenar o txid
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
            txid: chargeData?.txid, // Armazenar o txid
            status,
            lastChecked: new Date().toISOString(),
            chargeData,
          },
        ]
      }
    })
  }

  // Função para verificar o status de uma cobrança
  const checkChargeStatus = async (tracking: ChargeTracking) => {
    try {
      const charge = await getPixCharge(tracking.chargeId)
      if (charge) {
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
        return result.id
      }
    } catch (error) {
      console.error(`Erro ao gerar cobrança para ${reseller.nome}:`, error)
      // Registrar erro no rastreamento
      updateChargeTracking(reseller.id, "error", "error")
    }

    return null
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

      for (const reseller of selectedResellersList) {
        // Registrar como pendente
        updateChargeTracking(reseller.id, "pending", "pending")

        // Gerar cobrança
        await generateChargeForReseller(reseller)

        // Atualizar progresso
        processed++
        setBulkChargeProgress(Math.round((processed / selectedResellersList.length) * 100))

        // Pequeno delay para não sobrecarregar a API
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      toast({
        title: "Cobranças geradas",
        description: `Foram geradas cobranças para ${processed} revendedores.`,
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

  // Função para enviar mensagem para um revendedor específico
  const sendMessageToReseller = async (resellerId: string, chargeId: string) => {
    try {
      const reseller = resellers.find((r) => r.id === resellerId)
      const tracking = chargeTracking.find((t) => t.resellerId === resellerId && t.chargeId === chargeId)

      if (!reseller || !tracking || !tracking.chargeData) {
        throw new Error("Dados incompletos para envio")
      }

      // Gerar mensagem
      let message = messageTemplate
      message = message.replace(/{nome}/g, reseller.nome)
      message = message.replace(/{sobrenome}/g, reseller.sobrenome)
      message = message.replace(/{valor}/g, formatCurrency(tracking.chargeData.valor))
      message = message.replace(/{id}/g, tracking.chargeData.id || "")
      message = message.replace(/{txid}/g, tracking.chargeData.txid || "")
      message = message.replace(/{codigopix}/g, tracking.chargeData.codigo_pix || "Não disponível")

      // Enviar mensagem
      const success = await sendWhatsAppMessage({
        number: reseller.whatsapp,
        text: message,
        delay: 8000,
      })

      if (success) {
        // Atualizar rastreamento
        updateChargeTracking(resellerId, chargeId, "sent", tracking.chargeData)

        toast({
          title: "Mensagem enviada",
          description: `Mensagem enviada para ${reseller.nome} com sucesso.`,
        })

        return true
      } else {
        throw new Error("Falha ao enviar mensagem")
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem WhatsApp.",
        variant: "destructive",
      })
      return false
    }
  }

  // Função para visualizar detalhes de uma cobrança
  const viewChargeDetails = async (chargeId: string) => {
    setTransactionId(chargeId)
    await handleSearchPix()

    // Mudar para a aba de envio
    const sendTab = document.querySelector('[data-state="inactive"][value="send"]') as HTMLButtonElement
    if (sendTab) {
      sendTab.click()
    }
  }

  // Função para selecionar/desselecionar todos os revendedores
  const toggleSelectAll = () => {
    if (selectedResellers.length === resellers.length) {
      setSelectedResellers([])
    } else {
      setSelectedResellers(resellers.map((r) => r.id))
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
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pendente
          </Badge>
        )
      case "generated":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Gerada
          </Badge>
        )
      case "sent":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Enviada
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Erro
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Envio de PIX por WhatsApp</h1>
        <Button variant="outline" onClick={() => router.push("/pix")}>
          Voltar
        </Button>
      </div>

      <Tabs defaultValue="bulk" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bulk">Cobranças em Massa</TabsTrigger>
          <TabsTrigger value="send">Enviar Cobrança</TabsTrigger>
          <TabsTrigger value="template">Personalizar Mensagem</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Cobranças</CardTitle>
                <CardDescription>Gere cobranças PIX para múltiplos revendedores e envie por WhatsApp</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedResellers.length === resellers.length && resellers.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                      <Label htmlFor="select-all">Selecionar todos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={handleBulkCharge}
                        disabled={selectedResellers.length === 0 || isBulkCharging}
                        className="flex items-center gap-2"
                      >
                        {isBulkCharging ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Gerar Cobranças em Massa
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={checkAllCharges}
                        disabled={isCheckingCharges || chargeTracking.length === 0}
                        className="flex items-center gap-2"
                      >
                        {isCheckingCharges ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Atualizar Status
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
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Revendedor</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Clientes</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resellers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              Nenhum revendedor encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          resellers.map((reseller) => {
                            const tracking = chargeTracking.find((t) => t.resellerId === reseller.id)
                            return (
                              <TableRow key={reseller.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedResellers.includes(reseller.id)}
                                    onCheckedChange={() => toggleResellerSelection(reseller.id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  {reseller.nome} {reseller.sobrenome}
                                </TableCell>
                                <TableCell>{reseller.nome_usuario}</TableCell>
                                <TableCell>{reseller.quantidade_clientes}</TableCell>
                                <TableCell>R$ {(reseller.quantidade_clientes * 10).toFixed(2)}</TableCell>
                                <TableCell>{getChargeStatusDisplay(reseller.id)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {tracking && tracking.chargeId !== "pending" && tracking.chargeId !== "error" && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => viewChargeDetails(tracking.chargeId)}
                                        >
                                          Detalhes
                                        </Button>
                                        {tracking.status !== "sent" && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => sendMessageToReseller(reseller.id, tracking.chargeId)}
                                          >
                                            Enviar
                                          </Button>
                                        )}
                                      </>
                                    )}
                                    {(!tracking || tracking.chargeId === "error") && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => generateChargeForReseller(reseller)}
                                      >
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
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedResellers.length} de {resellers.length} revendedores selecionados
                </div>
                <div className="text-sm text-muted-foreground">
                  Última atualização:{" "}
                  {isCheckingCharges
                    ? "Verificando..."
                    : chargeTracking.length > 0
                      ? new Date(
                          Math.max(
                            ...chargeTracking.map((t) => (t.lastChecked ? new Date(t.lastChecked).getTime() : 0)),
                          ),
                        ).toLocaleString()
                      : "Nunca"}
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="send">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Buscar Cobrança PIX</CardTitle>
                <CardDescription>Busque uma cobrança PIX pelo ID da transação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">ID da Transação (TXID)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="transactionId"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Digite o TXID da transação PIX"
                      />
                      <Button onClick={handleSearchPix} disabled={searchingPix || !transactionId.trim()}>
                        {searchingPix ? "Buscando..." : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {pixCharge && (
                    <div className="space-y-4">
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle>Cobrança PIX encontrada</AlertTitle>
                        <AlertDescription>
                          <div className="mt-2 space-y-2">
                            <div>
                              <span className="font-medium">ID:</span> {pixCharge.id}
                            </div>
                            {pixCharge.txid && (
                              <div>
                                <span className="font-medium">TXID:</span> {pixCharge.txid}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Valor:</span> R$ {formatCurrency(pixCharge.valor)}
                            </div>
                            <div>
                              <span className="font-medium">Nome:</span> {pixCharge.nome || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">CPF:</span> {pixCharge.cpf || "N/A"}
                            </div>
                            {pixCharge.status && (
                              <div>
                                <span className="font-medium">Status:</span> {pixCharge.status}
                              </div>
                            )}
                            {pixCharge.codigo_pix && (
                              <div className="pt-2">
                                <div className="font-medium">Código PIX (Copia e Cola):</div>
                                <div className="mt-1 p-2 bg-gray-100 rounded-md relative group">
                                  <div className="text-xs break-all pr-8">{pixCharge.codigo_pix}</div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1"
                                    onClick={() => copyToClipboard(pixCharge.codigo_pix || "")}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>

                      <Button variant="outline" onClick={resetForm}>
                        Buscar Outra Cobrança
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enviar por WhatsApp</CardTitle>
                <CardDescription>Selecione um revendedor e envie a cobrança PIX</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reseller">Revendedor</Label>
                    <Select value={selectedReseller} onValueChange={handleResellerChange} disabled={!pixCharge}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um revendedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {resellers.map((reseller) => (
                          <SelectItem key={reseller.id} value={reseller.id}>
                            {reseller.nome} {reseller.sobrenome} ({reseller.nome_usuario})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {pixCharge && selectedReseller && (
                    <>
                      <div className="space-y-2">
                        <Label>Prévia da Mensagem</Label>
                        <div className="p-3 bg-gray-100 rounded-md text-sm whitespace-pre-wrap">{finalMessage}</div>
                      </div>

                      <Button
                        className="w-full flex items-center gap-2"
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !finalMessage}
                      >
                        <Send className="h-4 w-4" />
                        {sendingMessage ? "Enviando..." : "Enviar Mensagem"}
                      </Button>

                      {success && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertTitle>Mensagem enviada com sucesso!</AlertTitle>
                          <AlertDescription>
                            A cobrança PIX foi enviada por WhatsApp para o revendedor.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Personalizar Modelo de Mensagem</CardTitle>
              <CardDescription>
                Personalize o modelo de mensagem que será enviado por WhatsApp. Use as variáveis abaixo para incluir
                informações dinâmicas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-gray-100 rounded-md text-sm">
                  <p className="font-medium mb-2">Variáveis disponíveis:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <code>{"{nome}"}</code> - Nome do revendedor
                    </li>
                    <li>
                      <code>{"{sobrenome}"}</code> - Sobrenome do revendedor
                    </li>
                    <li>
                      <code>{"{valor}"}</code> - Valor da cobrança
                    </li>
                    <li>
                      <code>{"{id}"}</code> - ID da transação
                    </li>
                    <li>
                      <code>{"{txid}"}</code> - TXID da transação
                    </li>
                    <li>
                      <code>{"{codigopix}"}</code> - Código PIX (copia e cola)
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="messageTemplate">Modelo de Mensagem</Label>
                  <Textarea
                    id="messageTemplate"
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() =>
                      setMessageTemplate(
                        "*Cobrança PIX Gerada*\n\nOlá {nome},\n\nSua cobrança PIX foi gerada com sucesso!\n\nValor: R$ {valor}\nID da Transação: {id}\nTXID: {txid}\n\nCódigo PIX Copia e Cola:\n{codigopix}\n\nPor favor, efetue o pagamento utilizando o QR Code enviado ou o código acima.\n\nAtenciosamente,\nPrime Stream",
                      )
                    }
                    variant="outline"
                  >
                    Restaurar Padrão
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

