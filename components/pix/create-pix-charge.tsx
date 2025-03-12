"use client"

import type React from "react"

import { useState, useEffect, useCallback, useReducer } from "react"
import { createPixCharge, listResellers, sendWhatsAppMessage, type Reseller } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, Send, Loader2, Copy } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreatePixChargeProps {
  disabled?: boolean
}

// Tipagem dos dados do formulário
interface FormData {
  valor: number
  cpf: string
  nome: string
}

// Tipagem do resultado da cobrança, incluindo os campos extras
interface ChargeResult {
  id: string
  txid?: string
  qrcode?: string
  valor?: number
  codigo_pix?: string
  nome?: string
  cpf?: string
  status?: string
  data_criacao?: string
}

// Tipagem do estado e ações do reducer para gerenciamento do componente
type State = {
  formData: FormData
  loading: boolean
  sendingMessage: boolean
  resellers: Reseller[]
  selectedReseller: string
  clientValue: number
  chargeResult: ChargeResult | null
}

type Action =
  | { type: 'SET_FORM_DATA', payload: Partial<FormData> }
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'SET_SENDING_MESSAGE', payload: boolean }
  | { type: 'SET_RESELLERS', payload: Reseller[] }
  | { type: 'SET_SELECTED_RESELLER', payload: string }
  | { type: 'SET_CLIENT_VALUE', payload: number }
  | { type: 'SET_CHARGE_RESULT', payload: ChargeResult | null }
  | { type: 'RESET_FORM' };

const initialState: State = {
  formData: {
    valor: 0,
    cpf: "",
    nome: "",
  },
  loading: false,
  sendingMessage: false,
  resellers: [],
  selectedReseller: "",
  clientValue: 0,
  chargeResult: null
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SENDING_MESSAGE':
      return { ...state, sendingMessage: action.payload };
    case 'SET_RESELLERS':
      return { ...state, resellers: action.payload };
    case 'SET_SELECTED_RESELLER':
      return { ...state, selectedReseller: action.payload };
    case 'SET_CLIENT_VALUE':
      return { ...state, clientValue: action.payload };
    case 'SET_CHARGE_RESULT':
      return { ...state, chargeResult: action.payload };
    case 'RESET_FORM':
      return {
        ...state,
        formData: {
          valor: 0,
          cpf: "",
          nome: "",
        },
        selectedReseller: "",
        clientValue: 0,
        chargeResult: null
      };
    default:
      return state;
  }
}

export function CreatePixCharge({ disabled = false }: CreatePixChargeProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { toast } = useToast();

  const { 
    formData, 
    loading, 
    sendingMessage, 
    resellers, 
    selectedReseller, 
    clientValue, 
    chargeResult 
  } = state;

  // Formata número para moeda brasileira
  const formatCurrency = (value: any): string => {
    if (value === undefined || value === null) return "0,00";
    const numValue = typeof value === "number" ? value : Number(value);
    return isNaN(numValue) 
      ? "0,00" 
      : new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numValue);
  };

  // Formata CPF para o padrão xxx.xxx.xxx-xx
  const formatCPF = (cpf: string): string => {
    if (!cpf) return "";
    const cleanCpf = cpf.replace(/\D/g, "").slice(0, 11);
    if (cleanCpf.length !== 11) return cleanCpf;
    return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Formata data para o padrão brasileiro
  const formatDate = (isoDate?: string): string => {
    if (!isoDate) {
      return new Date().toLocaleDateString('pt-BR') + 
             ', ' + 
             new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR') + 
           ', ' + 
           date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Buscar lista de revendedores ao montar o componente
  useEffect(() => {
    const fetchResellers = async () => {
      try {
        const data = await listResellers();
        dispatch({ type: 'SET_RESELLERS', payload: Array.isArray(data) ? data : [] });
      } catch (error) {
        console.error("Falha ao carregar revendedores:", error);
        toast({
          title: "Erro ao carregar revendedores",
          description: "Não foi possível carregar a lista de revendedores. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    };

    fetchResellers();
  }, [toast]);

  // Atualiza os campos do formulário
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "valor") {
      const parsedValue = value === "" ? 0 : Number.parseFloat(value);
      if (!isNaN(parsedValue)) {
        dispatch({ 
          type: 'SET_FORM_DATA', 
          payload: { [name]: parsedValue } 
        });
      }
    } else if (name === "cpf") {
      const cleanCpf = value.replace(/\D/g, "");
      dispatch({ 
        type: 'SET_FORM_DATA', 
        payload: { [name]: cleanCpf } 
      });
    } else {
      dispatch({ 
        type: 'SET_FORM_DATA', 
        payload: { [name]: value } 
      });
    }
  }, []);

  const handleResellerChange = useCallback((value: string) => {
    dispatch({ type: 'SET_SELECTED_RESELLER', payload: value });

    const reseller = resellers.find((r) => r.id === value);
    if (reseller) {
      dispatch({ 
        type: 'SET_FORM_DATA', 
        payload: {
          nome: `${reseller.nome} ${reseller.sobrenome}`,
          cpf: reseller.cpf,
        }
      });

      if (reseller.quantidade_clientes > 0) {
        const calculatedValue = reseller.quantidade_clientes * 10;
        dispatch({ type: 'SET_CLIENT_VALUE', payload: calculatedValue });
        dispatch({ 
          type: 'SET_FORM_DATA', 
          payload: { valor: calculatedValue }
        });
      }
    }
  }, [resellers]);

  const saveToLocalStorage = useCallback((result: ChargeResult) => {
    try {
      const storageKey = "pix_charge_tracking";
      const savedTracking = localStorage.getItem(storageKey);
      let tracking = [];

      if (savedTracking) {
        tracking = JSON.parse(savedTracking);
      }

      if (selectedReseller) {
        const newTracking = {
          resellerId: selectedReseller,
          chargeId: result.id,
          txid: result.txid,
          status: "generated",
          lastChecked: new Date().toISOString(),
          valor: result.valor,
        };

        tracking.unshift(newTracking);
        if (tracking.length > 20) {
          tracking = tracking.slice(0, 20);
        }
        localStorage.setItem(storageKey, JSON.stringify(tracking));
      }
    } catch (error) {
      console.error("Erro ao salvar no localStorage:", error);
    }
  }, [selectedReseller]);

  // Função para enviar os dados e gerar a cobrança PIX
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.valor <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor maior que zero.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.cpf.length !== 11) {
      toast({
        title: "CPF inválido",
        description: "Por favor, insira um CPF válido com 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_CHARGE_RESULT', payload: null });

    try {
      const result = await createPixCharge(formData);
      // Se a API retornar um array, pega o primeiro item
      const apiResponse = Array.isArray(result) ? result[0] : result;
      
      if (apiResponse && apiResponse.dados) {
        const dados = apiResponse.dados;
        const enhancedResult: ChargeResult = {
          id: dados.txid,
          txid: dados.txid,
          qrcode: dados.pix?.qrCode,
          codigo_pix: dados.pix?.copiaCola,
          valor: typeof dados.valor === "string" ? Number(dados.valor) : dados.valor,
          nome: dados.devedor?.nome || formData.nome,
          cpf: dados.devedor?.cpf || formData.cpf,
          status: dados.status?.toLowerCase() || "ativa",
          data_criacao: dados.criacao || new Date().toISOString(),
        };

        dispatch({ type: 'SET_CHARGE_RESULT', payload: enhancedResult });
        saveToLocalStorage(enhancedResult);

        toast({
          title: "Cobrança PIX gerada",
          description: "A cobrança PIX foi gerada com sucesso.",
        });
      } else {
        throw new Error("Estrutura de resposta inesperada");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao gerar cobrança PIX",
        description: `Não foi possível gerar a cobrança PIX: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleSendWhatsApp = async () => {
    if (!chargeResult || !selectedReseller) return;

    dispatch({ type: 'SET_SENDING_MESSAGE', payload: true });

    try {
      const reseller = resellers.find((r) => r.id === selectedReseller);
      if (!reseller) {
        throw new Error("Revendedor não encontrado");
      }

      const message = `*Cobrança PIX Gerada*

Olá ${reseller.nome},

Sua cobrança PIX foi gerada com sucesso!

Valor: R$ ${formatCurrency(chargeResult.valor || formData.valor)}
ID da Transação: ${chargeResult.id}
${
  chargeResult.txid
    ? `TXID: ${chargeResult.txid}
`
    : ""
}
${
  chargeResult.codigo_pix
    ? `Código PIX Copia e Cola:
${chargeResult.codigo_pix}
`
    : ""
}

Por favor, efetue o pagamento utilizando o QR Code enviado ou os dados acima.

Atenciosamente,
Prime Stream`;

      const success = await sendWhatsAppMessage({
        number: reseller.whatsapp,
        text: message,
        delay: 8000,
      });

      if (success) {
        toast({
          title: "Mensagem enviada",
          description: "A cobrança PIX foi enviada por WhatsApp com sucesso.",
        });

        try {
          const storageKey = "pix_charge_tracking";
          const savedTracking = localStorage.getItem(storageKey);
          if (savedTracking) {
            const tracking = JSON.parse(savedTracking);
            const updatedTracking = tracking.map((item: any) => {
              if (item.chargeId === chargeResult.id) {
                return {
                  ...item,
                  status: "sent",
                  lastChecked: new Date().toISOString(),
                };
              }
              return item;
            });
            localStorage.setItem(storageKey, JSON.stringify(updatedTracking));
          }
        } catch (e) {
          console.error("Erro ao atualizar tracking:", e);
        }
      } else {
        throw new Error("Falha ao enviar mensagem");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao enviar mensagem",
        description: `Não foi possível enviar a cobrança por WhatsApp: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      dispatch({ type: 'SET_SENDING_MESSAGE', payload: false });
    }
  };

  const handleCopyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text || "");
    toast({
      title: "Texto copiado",
      description,
    });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerar Cobrança PIX</CardTitle>
        <CardDescription>Preencha os dados para gerar uma nova cobrança PIX</CardDescription>
      </CardHeader>
      <CardContent>
        {chargeResult ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Cobrança PIX gerada com sucesso</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">ID:</span> 
                    <div className="flex items-center gap-1">
                      <span className="text-sm truncate max-w-[200px]">{chargeResult.id}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyToClipboard(chargeResult.id, "ID copiado para a área de transferência")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {chargeResult.txid && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">TXID:</span> 
                      <div className="flex items-center gap-1">
                        <span className="text-sm truncate max-w-[200px]">{chargeResult.txid}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyToClipboard(chargeResult.txid || "", "TXID copiado para a área de transferência")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Valor:</span> 
                    <span>R$ {formatCurrency(chargeResult.valor || formData.valor)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Nome:</span> 
                    <span>{chargeResult.nome || formData.nome}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">CPF:</span> 
                    <span>{formatCPF(chargeResult.cpf || formData.cpf)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span> 
                    <span className="text-green-600 font-medium">{chargeResult.status || "ativa"}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Data de Criação:</span> 
                    <span>{formatDate(chargeResult.data_criacao)}</span>
                  </div>
                  
                  {chargeResult.codigo_pix && (
                    <div className="pt-2">
                      <div className="font-medium mb-2">Código PIX (Copia e Cola):</div>
                      <div className="bg-white p-4 inline-block rounded-md border border-gray-200 relative group w-full">
                        <div className="text-xs break-all pr-8 max-w-full">{chargeResult.codigo_pix}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1"
                          onClick={() => handleCopyToClipboard(
                            chargeResult.codigo_pix || "", 
                            "Código PIX copiado para a área de transferência"
                          )}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {chargeResult.qrcode && (
                    <div className="mt-4">
                      <div className="font-medium mb-2">QR Code:</div>
                      <div className="bg-white p-4 inline-block rounded-md border border-gray-200">
                        <img
                          src={chargeResult.qrcode || "/placeholder.svg"}
                          alt="QR Code PIX"
                          className="max-w-[200px] max-h-[200px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleReset}>Gerar Nova Cobrança</Button>
              <Button
                variant="secondary"
                onClick={handleSendWhatsApp}
                disabled={sendingMessage || !selectedReseller}
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
                    Enviar por WhatsApp
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reseller">Revendedor</Label>
                <Select value={selectedReseller} onValueChange={handleResellerChange} disabled={disabled}>
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

              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  name="valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.valor || ""}
                  onChange={handleChange}
                  required
                  disabled={disabled}
                />
                {clientValue > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Valor calculado: R$ {formatCurrency(clientValue)} (
                    {resellers.find((r) => r.id === selectedReseller)?.quantidade_clientes} clientes × R$ 10,00)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  required
                  placeholder="Apenas números"
                  maxLength={11}
                  disabled={disabled}
                />
                {formData.cpf && formData.cpf.length !== 11 && (
                  <p className="text-xs text-red-500">CPF deve conter 11 dígitos</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  disabled={disabled}
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading || disabled || formData.valor <= 0 || formData.cpf.length !== 11 || !formData.nome} 
                className="w-full flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando cobrança...
                  </>
                ) : (
                  "Gerar Cobrança PIX"
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

