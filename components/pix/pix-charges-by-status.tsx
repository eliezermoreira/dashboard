"use client"

import { useState, useEffect } from "react"
import { sendWhatsAppMessage, listResellers, type PixCharge, type Reseller } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Loader2, RefreshCw, Copy, Send, Search, CheckCircle, AlertTriangle, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PixChargesByStatus() {
  const [activeCharges, setActiveCharges] = useState<PixCharge[]>([])
  const [pendingCharges, setPendingCharges] = useState<PixCharge[]>([])
  const [completedCharges, setCompletedCharges] = useState<PixCharge[]>([])

  const [loading, setLoading] = useState<{ [key: string]: boolean }>({
    active: true,
    pending: true,
    completed: true,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [selectedCharge, setSelectedCharge] = useState<PixCharge | null>(null)
  const [selectedReseller, setSelectedReseller] = useState<string>("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageSuccess, setMessageSuccess] = useState(false)
  const { toast } = useToast()
  // Adicione isso dentro do componente PixChargesByStatus
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Carregar revendedores
  useEffect(() => {
    const fetchResellers = async () => {
      try {
        const data = await listResellers()
        setResellers(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch resellers:", error)
      }
    }

    fetchResellers()
  }, [])

  // Add these console logs at the beginning of the fetchChargesByStatus function to track loading state changes
  const fetchChargesByStatus = async (status?: "ativa" | "pendente" | "concluida") => {
    const statusKey = status || "all"
    console.log(`Setting loading state for ${statusKey} to true`)
    setLoading((prev) => ({ ...prev, [statusKey]: true }))
    setError(null) // Limpar erros anteriores

    console.log(`Iniciando carregamento de cobranças ${status || "todas"}`)

    try {
      // Determinar qual endpoint usar com base no status
      let endpoint = "https://efi.prime-stream.site/pix/cobrancas/todas"

      if (status === "ativa" || status === "pendente") {
        endpoint = "https://efi.prime-stream.site/pix/cobrancas/ativas"
      } else if (status === "concluida") {
        endpoint = "https://efi.prime-stream.site/pix/cobrancas/concluidas"
      }

      console.log(`Fazendo requisição para: ${endpoint}`)

      // Fazer a requisição diretamente
      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`)
      }

      // Verificar o tipo de conteúdo da resposta
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.warn(`Resposta não é JSON: ${contentType}`)
        const text = await response.text()
        console.log("Resposta em texto:", text)
        throw new Error(`Resposta não é JSON: ${contentType}`)
      }

      // Obter o texto da resposta para debug
      const responseText = await response.text()
      console.log("Resposta em texto:", responseText)

      // Verificar se a resposta está vazia
      if (!responseText || responseText.trim() === "") {
        console.log("Resposta vazia do servidor")
        return []
      }

      // Tentar fazer o parse do JSON com tratamento de erro
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Erro ao fazer parse do JSON:", parseError)
        console.log("Texto que causou o erro:", responseText)
        throw new Error(`Erro ao processar resposta do servidor: ${parseError.message}`)
      }

      console.log(`Resposta processada:`, data)

      // Processar a resposta da API
      let charges: PixCharge[] = []

      // Verificar se a resposta tem a estrutura esperada
      if (data.success && data.dados && data.dados.cobrancas) {
        // Extrair as cobranças do objeto de resposta
        charges = data.dados.cobrancas.map((cobranca: any) => ({
          id: cobranca.txid || "",
          txid: cobranca.txid || "",
          valor: typeof cobranca.valor === "string" ? Number.parseFloat(cobranca.valor) : cobranca.valor || 0,
          cpf: cobranca.devedor?.cpf || "",
          nome: cobranca.devedor?.nome || "",
          status: cobranca.status?.toLowerCase() || (status === "concluida" ? "concluida" : "ativa"),
          created_at: cobranca.criacao || new Date().toISOString(),
          codigo_pix: cobranca.location || "",
          statusDetalhado: cobranca.statusDetalhado || "",
        }))
      } else {
        console.warn("Resposta da API não contém a estrutura esperada:", data)
      }

      console.log(`Cobranças processadas (${charges.length}):`, charges)

      // Formatar os dados para garantir que estejam no formato esperado
      const formattedCharges = charges.map((charge) => ({
        ...charge,
        valor: typeof charge.valor === "number" ? charge.valor : Number(charge.valor) || 0,
      }))

      console.log(`Cobranças formatadas:`, formattedCharges)

      // Após o processamento da resposta, adicione este log:
      console.log(`Atualizando estado para ${status || "todas"} com ${formattedCharges.length} cobranças`)

      // Atualizar o estado com base no status
      if (status === "ativa" || status === "pendente") {
        console.log("Atualizando cobranças ativas:", formattedCharges)
        setActiveCharges([...formattedCharges])
        // Se estamos carregando cobranças ativas, também definimos as mesmas como pendentes
        if (status === "ativa") {
          setPendingCharges([...formattedCharges])
        }
      } else if (status === "concluida") {
        console.log("Atualizando cobranças concluídas:", formattedCharges)
        setCompletedCharges([...formattedCharges])
      }

      // Atualizar o localStorage com as cobranças mais recentes
      updateLocalStorage(formattedCharges)

      return formattedCharges
    } catch (error) {
      console.error(`Falha ao buscar cobranças ${status || "todas"}:`, error)
      setError(`Não foi possível carregar as cobranças ${status || "todas"}. Erro: ${error.message}`)

      // Definir um array vazio para evitar que a interface fique em estado de carregamento indefinidamente
      if (status === "ativa") {
        setActiveCharges([])
        setPendingCharges([])
      } else if (status === "pendente") {
        setPendingCharges([])
      } else if (status === "concluida") {
        setCompletedCharges([])
      }

      return []
    } finally {
      console.log(`Setting loading state for ${statusKey} to false`)
      setLoading((prev) => {
        const newState = { ...prev, [statusKey]: false }
        console.log(`New loading state:`, newState)
        return newState
      })
    }
  }

  // Atualizar o localStorage com as cobranças mais recentes
  const updateLocalStorage = (charges: PixCharge[]) => {
    if (!charges.length) return

    try {
      const savedTracking = localStorage.getItem("pixChargeTracking")
      let tracking = []

      if (savedTracking) {
        tracking = JSON.parse(savedTracking)
      }

      // Para cada cobrança, verificar se já existe no tracking e atualizar
      let updated = false
      charges.forEach((charge) => {
        if (!charge.id) return

        const existingIndex = tracking.findIndex(
          (t: any) => t.chargeId === charge.id || (charge.txid && t.txid === charge.txid),
        )

        if (existingIndex >= 0) {
          tracking[existingIndex] = {
            ...tracking[existingIndex],
            txid: charge.txid,
            status: charge.status === "concluida" ? "sent" : "generated",
            lastChecked: new Date().toISOString(),
            chargeData: charge,
          }
          updated = true
        }
      })

      if (updated) {
        localStorage.setItem("pixChargeTracking", JSON.stringify(tracking))
      }
    } catch (error) {
      console.error("Error updating localStorage:", error)
    }
  }

  // Modificar a função refreshAllCharges para não carregar pendentes separadamente
  const refreshAllCharges = async () => {
    setError(null)
    setRetryCount((prev) => prev + 1)

    try {
      // Carregar apenas ativas e concluídas, já que pendentes são as mesmas que ativas
      await Promise.all([fetchChargesByStatus("ativa"), fetchChargesByStatus("concluida")])
      // Se todos os carregamentos forem bem-sucedidos, resetar a contagem de retry
      setRetryCount(0)
    } catch (err) {
      console.error("Erro ao atualizar cobranças:", err)
      setError("Não foi possível carregar as cobranças. Verifique sua conexão e tente novamente.")
    }
  }

  // Carregar cobranças iniciais
  // Modificar o useEffect para carregar apenas ativas e concluídas
  useEffect(() => {
    console.log("Initial fetch of charges")
    // Fetch active charges
    fetchChargesByStatus("ativa").then(() => {
      console.log("Active charges fetched, setting pending charges loading to false")
      // Explicitly set pending charges to the same as active charges
      setLoading((prev) => ({ ...prev, pending: false }))
    })

    // Fetch completed charges
    fetchChargesByStatus("concluida")
  }, [])

  // Filtrar cobranças com base no termo de busca
  const filterCharges = (charges: PixCharge[]) => {
    if (!searchTerm) return charges

    return charges.filter(
      (charge) =>
        (charge.nome && charge.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (charge.cpf && charge.cpf.includes(searchTerm)) ||
        (charge.id && charge.id.includes(searchTerm)) ||
        (charge.txid && charge.txid.includes(searchTerm)),
    )
  }

  // Formatar valor para exibição
  const formatCurrency = (value: any): string => {
    if (value === undefined || value === null) return "0.00"
    const numValue = typeof value === "number" ? value : Number(value)
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2)
  }

  // Formatar data para exibição
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

  // Obter badge de status
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ativa":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
          >
            Ativa
          </Badge>
        )
      case "pendente":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800"
          >
            Pendente
          </Badge>
        )
      case "concluida":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800"
          >
            Concluída
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  // Enviar mensagem WhatsApp
  const handleSendWhatsApp = async () => {
    if (!selectedCharge || !selectedReseller) return

    setSendingMessage(true)
    setMessageSuccess(false)

    try {
      const reseller = resellers.find((r) => r.id === selectedReseller)
      if (!reseller) {
        throw new Error("Revendedor não encontrado")
      }

      // Format the message with PIX details
      const message = `*Cobrança PIX*

Olá ${reseller.nome},

Sua cobrança PIX está disponível:

Valor: R$ ${formatCurrency(selectedCharge.valor)}
ID da Transação: ${selectedCharge.id}
${
  selectedCharge.txid
    ? `TXID: ${selectedCharge.txid}
`
    : ""
}
${
  selectedCharge.codigo_pix
    ? `Código PIX Copia e Cola:
${selectedCharge.codigo_pix}
`
    : ""
}

Por favor, efetue o pagamento utilizando o código PIX acima.

Atenciosamente,
Prime Stream`

      const success = await sendWhatsAppMessage({
        number: reseller.whatsapp,
        text: message,
        delay: 8000,
      })

      if (success) {
        setMessageSuccess(true)

        // Atualizar status no tracking
        const savedTracking = localStorage.getItem("pixChargeTracking")
        if (savedTracking) {
          try {
            const tracking = JSON.parse(savedTracking)
            const updatedTracking = tracking.map((item: any) => {
              if (item.chargeId === selectedCharge.id || (selectedCharge.txid && item.txid === selectedCharge.txid)) {
                return {
                  ...item,
                  status: "sent",
                  lastChecked: new Date().toISOString(),
                }
              }
              return item
            })
            localStorage.setItem("pixChargeTracking", JSON.stringify(updatedTracking))
          } catch (e) {
            console.error("Erro ao atualizar tracking:", e)
          }
        }

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

  // Modifique a função renderChargesTable para mostrar mais informações de debug
  const renderChargesTable = (charges: PixCharge[], isLoading: boolean, statusName: string) => {
    console.log(`Renderizando tabela para ${statusName}:`, charges)
    const filteredCharges = filterCharges(charges)
    console.log(`Cobranças filtradas para ${statusName}:`, filteredCharges)

    // Modificar o div de carregamento para mostrar mais informações de debug
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Carregando cobranças {statusName}...</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Buscando dados no endpoint:{" "}
            {statusName === "ativas" || statusName === "pendentes"
              ? "cobrancas/ativas"
              : statusName === "concluidas"
                ? "cobrancas/concluidas"
                : "cobrancas/todas"}
          </p>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 max-w-md">
            <p className="text-sm font-medium">Informações de Debug:</p>
            <ul className="text-xs mt-1 space-y-1 list-disc pl-4">
              <li>Estado de carregamento: {isLoading ? "Carregando" : "Concluído"}</li>
              <li>Número de cobranças: {charges.length}</li>
              <li>Tipo de cobranças: {statusName}</li>
              <li>Último erro: {error || "Nenhum"}</li>
            </ul>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              console.log(`Forçando atualização para ${statusName}`)
              fetchChargesByStatus(statusName === "ativas" || statusName === "pendentes" ? "ativa" : "concluida")
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Forçar atualização
          </Button>
        </div>
      )
    }

    // Adicione também esta verificação logo após o bloco de carregamento para garantir que as cobranças sejam exibidas
    // Isso ajudará a identificar se o problema está no carregamento ou na renderização
    console.log(`Renderizando tabela para ${statusName}:`, {
      isLoading,
      chargesLength: charges.length,
      filteredChargesLength: filterCharges(charges).length,
      charges: charges.slice(0, 3), // Mostrar apenas as 3 primeiras para não sobrecarregar o console
    })

    // Mostrar mensagem de erro com botão de retry quando houver erro
    if (error) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <h3 className="mt-2 text-lg font-medium">Erro ao carregar cobranças</h3>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              fetchChargesByStatus(
                statusName === "ativas" ? "ativa" : statusName === "pendentes" ? "pendente" : "concluida",
              )
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente ({retryCount})
          </Button>
        </div>
      )
    }

    if (filteredCharges.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-muted-foreground">
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
          </div>
          <h3 className="mt-2 text-lg font-medium">Nenhuma cobrança encontrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? "Nenhuma cobrança corresponde aos termos de busca." : `Não há cobranças ${statusName}.`}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              fetchChargesByStatus(
                statusName === "ativas" ? "ativa" : statusName === "pendentes" ? "pendente" : "concluida",
              )
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      )
    }

    return (
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">ID/TXID</TableHead>
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">CPF</TableHead>
              <TableHead className="font-semibold">Valor</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Data</TableHead>
              <TableHead className="text-right font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCharges.map((charge, index) => (
              <TableRow
                key={charge.id}
                className={index % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-900"}
              >
                <TableCell className="font-medium">
                  <div className="truncate max-w-[150px]">{charge.txid || charge.id}</div>
                </TableCell>
                <TableCell>{charge.nome || "N/A"}</TableCell>
                <TableCell>{charge.cpf || "N/A"}</TableCell>
                <TableCell>R$ {formatCurrency(charge.valor)}</TableCell>
                <TableCell>{getStatusBadge(charge.status)}</TableCell>
                <TableCell>{formatDate(charge.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const idToCopy = charge.txid || charge.id
                        navigator.clipboard.writeText(idToCopy)
                        toast({
                          title: "ID copiado",
                          description: "ID da cobrança copiado para a área de transferência.",
                        })
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span className="sr-only">Copiar ID</span>
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => setSelectedCharge(charge)}>
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Enviar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Enviar Cobrança por WhatsApp</DialogTitle>
                          <DialogDescription>
                            Selecione um revendedor para enviar esta cobrança PIX por WhatsApp.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="reseller">Revendedor</Label>
                            <Select value={selectedReseller} onValueChange={setSelectedReseller}>
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

                          {selectedCharge && (
                            <div className="space-y-2 border rounded-md p-3 bg-muted/20">
                              <div>
                                <span className="font-medium">ID:</span> {selectedCharge.id}
                              </div>
                              {selectedCharge.txid && (
                                <div>
                                  <span className="font-medium">TXID:</span> {selectedCharge.txid}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Valor:</span> R$ {formatCurrency(selectedCharge.valor)}
                              </div>
                              <div>
                                <span className="font-medium">Nome:</span> {selectedCharge.nome || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium">CPF:</span> {selectedCharge.cpf || "N/A"}
                              </div>
                            </div>
                          )}

                          {messageSuccess && (
                            <div className="rounded-md bg-green-50 p-3 text-green-700 border border-green-200">
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                <span className="font-medium">Mensagem enviada com sucesso!</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <DialogFooter>
                          <Button
                            onClick={handleSendWhatsApp}
                            disabled={!selectedReseller || sendingMessage}
                            className="flex items-center gap-2"
                          >
                            {sendingMessage ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Enviar Mensagem
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => setSelectedCharge(charge)}>
                          <Search className="h-3.5 w-3.5 mr-1" />
                          Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes da Cobrança PIX</DialogTitle>
                          <DialogDescription>Informações completas sobre a cobrança PIX.</DialogDescription>
                        </DialogHeader>

                        {selectedCharge && (
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium">ID:</span> {selectedCharge.id}
                              </div>
                              {selectedCharge.txid && (
                                <div>
                                  <span className="font-medium">TXID:</span> {selectedCharge.txid}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Valor:</span> R$ {formatCurrency(selectedCharge.valor)}
                              </div>
                              <div>
                                <span className="font-medium">Nome:</span> {selectedCharge.nome || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium">CPF:</span> {selectedCharge.cpf || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium">Status:</span> {selectedCharge.status || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium">Data de Criação:</span>{" "}
                                {formatDate(selectedCharge.created_at)}
                              </div>
                            </div>

                            {selectedCharge.codigo_pix && (
                              <div className="space-y-2">
                                <Label>Código PIX (Copia e Cola)</Label>
                                <div className="p-3 bg-muted rounded-md relative group">
                                  <div className="text-xs break-all pr-8">{selectedCharge.codigo_pix}</div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1"
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedCharge.codigo_pix || "")
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
                        )}

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const idToCopy = selectedCharge?.txid || selectedCharge?.id || ""
                              navigator.clipboard.writeText(idToCopy)
                              toast({
                                title: "ID copiado",
                                description: "ID da cobrança copiado para a área de transferência.",
                              })
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar ID
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Cobranças PIX por Status</CardTitle>
            <CardDescription>Visualize e gerencie todas as cobranças PIX do sistema</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refreshAllCharges()
              }}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF, ID ou TXID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-1">
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
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Pendentes ({pendingCharges?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1">
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
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Concluídas ({completedCharges?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Pending Charges Tab - Similar structure to Active */}
          <TabsContent value="pending">
            {loading.pending ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Carregando cobranças pendentes...</p>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 max-w-md">
                  <p className="text-sm font-medium">Informações de Debug:</p>
                  <ul className="text-xs mt-1 space-y-1 list-disc pl-4">
                    <li>Estado de carregamento: {JSON.stringify(loading)}</li>
                    <li>Número de cobranças pendentes: {pendingCharges.length}</li>
                    <li>Número de cobranças ativas: {activeCharges.length}</li>
                    <li>Último erro: {error || "Nenhum"}</li>
                  </ul>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    console.log("Forcing pending charges loading state to false")
                    setLoading((prev) => ({ ...prev, pending: false }))
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Forçar carregamento
                </Button>
              </div>
            ) : pendingCharges.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium">Nenhuma cobrança pendente encontrada</h3>
                <Button variant="outline" className="mt-4" onClick={() => fetchChargesByStatus("pendente")}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Simple List Header */}
                <div className="grid grid-cols-4 gap-4 font-medium text-sm px-4 py-2 bg-muted rounded-t-md">
                  <div>Nome</div>
                  <div>Valor</div>
                  <div>Status</div>
                  <div>Data</div>
                </div>

                {/* List of Charges */}
                <div className="space-y-2">
                  {filterCharges(pendingCharges).map((charge, index) => (
                    <div
                      key={charge.id || index}
                      className="grid grid-cols-4 gap-4 p-4 rounded-md hover:bg-muted/50 transition-colors border"
                    >
                      <div className="truncate">{charge.nome || "N/A"}</div>
                      <div>R$ {formatCurrency(charge.valor)}</div>
                      <div>{getStatusBadge(charge.status)}</div>
                      <div>{formatDate(charge.created_at)}</div>

                      {/* Action buttons on hover */}
                      <div className="col-span-4 flex justify-end gap-2 mt-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const idToCopy = charge.txid || charge.id
                            navigator.clipboard.writeText(idToCopy)
                            toast({
                              title: "ID copiado",
                              description: "ID da cobrança copiado para a área de transferência.",
                            })
                          }}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copiar ID
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={async () => {
                            try {
                              const idToCancel = charge.txid || charge.id
                              const response = await fetch(`https://efi.prime-stream.site/pix/cancelar/${idToCancel}`, {
                                method: "DELETE",
                              })

                              if (response.ok) {
                                toast({
                                  title: "Cobrança cancelada",
                                  description: "A cobrança PIX foi cancelada com sucesso.",
                                })
                                // Refresh charges after cancellation
                                fetchChargesByStatus("pendente")
                              } else {
                                throw new Error(`Erro ao cancelar: ${response.status}`)
                              }
                            } catch (error) {
                              console.error("Erro ao cancelar cobrança:", error)
                              toast({
                                title: "Erro ao cancelar",
                                description: "Não foi possível cancelar a cobrança PIX.",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Excluir
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedCharge(charge)}>
                              <Send className="h-3.5 w-3.5 mr-1" />
                              Enviar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Enviar Cobrança por WhatsApp</DialogTitle>
                              <DialogDescription>
                                Selecione um revendedor para enviar esta cobrança PIX por WhatsApp.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="reseller">Revendedor</Label>
                                <Select value={selectedReseller} onValueChange={setSelectedReseller}>
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

                              {selectedCharge && (
                                <div className="space-y-2 border rounded-md p-3 bg-muted/20">
                                  <div>
                                    <span className="font-medium">ID:</span> {selectedCharge.id}
                                  </div>
                                  {selectedCharge.txid && (
                                    <div>
                                      <span className="font-medium">TXID:</span> {selectedCharge.txid}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium">Valor:</span> R${" "}
                                    {formatCurrency(selectedCharge.valor)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Nome:</span> {selectedCharge.nome || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">CPF:</span> {selectedCharge.cpf || "N/A"}
                                  </div>
                                </div>
                              )}

                              {messageSuccess && (
                                <div className="rounded-md bg-green-50 p-3 text-green-700 border border-green-200">
                                  <div className="flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    <span className="font-medium">Mensagem enviada com sucesso!</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <DialogFooter>
                              <Button
                                onClick={handleSendWhatsApp}
                                disabled={!selectedReseller || sendingMessage}
                                className="flex items-center gap-2"
                              >
                                {sendingMessage ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Enviando...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4" />
                                    Enviar Mensagem
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedCharge(charge)}>
                              <Search className="h-3.5 w-3.5 mr-1" />
                              Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Detalhes da Cobrança PIX</DialogTitle>
                              <DialogDescription>Informações completas sobre a cobrança PIX.</DialogDescription>
                            </DialogHeader>

                            {selectedCharge && (
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <div>
                                    <span className="font-medium">ID:</span> {selectedCharge.id}
                                  </div>
                                  {selectedCharge.txid && (
                                    <div>
                                      <span className="font-medium">TXID:</span> {selectedCharge.txid}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium">Valor:</span> R${" "}
                                    {formatCurrency(selectedCharge.valor)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Nome:</span> {selectedCharge.nome || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">CPF:</span> {selectedCharge.cpf || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Status:</span> {selectedCharge.status || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Data de Criação:</span>{" "}
                                    {formatDate(selectedCharge.created_at)}
                                  </div>
                                </div>

                                {selectedCharge.codigo_pix && (
                                  <div className="space-y-2">
                                    <Label>Código PIX (Copia e Cola)</Label>
                                    <div className="p-3 bg-muted rounded-md relative group">
                                      <div className="text-xs break-all pr-8">{selectedCharge.codigo_pix}</div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1"
                                        onClick={() => {
                                          navigator.clipboard.writeText(selectedCharge.codigo_pix || "")
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
                            )}

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const idToCopy = selectedCharge?.txid || selectedCharge?.id || ""
                                  navigator.clipboard.writeText(idToCopy)
                                  toast({
                                    title: "ID copiado",
                                    description: "ID da cobrança copiado para a área de transferência.",
                                  })
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar ID
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Completed Charges Tab - Similar structure to Active */}
          <TabsContent value="completed">
            {loading.completed ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Carregando cobranças concluídas...</p>
              </div>
            ) : completedCharges.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium">Nenhuma cobrança concluída encontrada</h3>
                <Button variant="outline" className="mt-4" onClick={() => fetchChargesByStatus("concluida")}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Simple List Header */}
                <div className="grid grid-cols-4 gap-4 font-medium text-sm px-4 py-2 bg-muted rounded-t-md">
                  <div>Nome</div>
                  <div>Valor</div>
                  <div>Status</div>
                  <div>Data</div>
                </div>

                {/* List of Charges */}
                <div className="space-y-2">
                  {filterCharges(completedCharges).map((charge, index) => (
                    <div
                      key={charge.id || index}
                      className="grid grid-cols-4 gap-4 p-4 rounded-md hover:bg-muted/50 transition-colors border"
                    >
                      <div className="truncate">{charge.nome || "N/A"}</div>
                      <div>R$ {formatCurrency(charge.valor)}</div>
                      <div>{getStatusBadge(charge.status)}</div>
                      <div>{formatDate(charge.created_at)}</div>

                      {/* Action buttons on hover */}
                      <div className="col-span-4 flex justify-end gap-2 mt-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const idToCopy = charge.txid || charge.id
                            navigator.clipboard.writeText(idToCopy)
                            toast({
                              title: "ID copiado",
                              description: "ID da cobrança copiado para a área de transferência.",
                            })
                          }}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copiar ID
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedCharge(charge)}>
                              <Search className="h-3.5 w-3.5 mr-1" />
                              Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Detalhes da Cobrança PIX</DialogTitle>
                              <DialogDescription>Informações completas sobre a cobrança PIX.</DialogDescription>
                            </DialogHeader>

                            {selectedCharge && (
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <div>
                                    <span className="font-medium">ID:</span> {selectedCharge.id}
                                  </div>
                                  {selectedCharge.txid && (
                                    <div>
                                      <span className="font-medium">TXID:</span> {selectedCharge.txid}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium">Valor:</span> R${" "}
                                    {formatCurrency(selectedCharge.valor)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Nome:</span> {selectedCharge.nome || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">CPF:</span> {selectedCharge.cpf || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Status:</span> {selectedCharge.status || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Data de Criação:</span>{" "}
                                    {formatDate(selectedCharge.created_at)}
                                  </div>
                                </div>
                              </div>
                            )}

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const idToCopy = selectedCharge?.txid || selectedCharge?.id || ""
                                  navigator.clipboard.writeText(idToCopy)
                                  toast({
                                    title: "ID copiado",
                                    description: "ID da cobrança copiado para a área de transferência.",
                                  })
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar ID
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          Total de cobranças: {activeCharges.length + pendingCharges.length + completedCharges.length}
        </div>
        <div className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleString()}</div>
      </CardFooter>
      {error && (
        <div className="p-4 bg-red-100 text-red-700 border border-red-400 rounded-md mt-4">
          <p>{error}</p>
        </div>
      )}
    </Card>
  )
}

