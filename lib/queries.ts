"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listResellers,
  getReseller,
  createReseller,
  updateReseller,
  deleteReseller,
  testConnection,
  testAuthentication,
  createPixCharge,
  getPixCharge,
  listPixChargesByStatus,
  cancelPixCharge,
  cancelAllActivePixCharges,
  type Reseller,
} from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

// Reseller queries
export function useResellers() {
  const { toast } = useToast()

  return useQuery({
    queryKey: ["resellers"],
    queryFn: async () => {
      try {
        return await listResellers()
      } catch (error) {
        toast({
          title: "Erro ao carregar revendedores",
          description: "Não foi possível carregar a lista de revendedores.",
          variant: "destructive",
        })
        return []
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useReseller(id: string) {
  const { toast } = useToast()

  return useQuery({
    queryKey: ["reseller", id],
    queryFn: async () => {
      if (id === "new") return null

      try {
        return await getReseller(id)
      } catch (error) {
        toast({
          title: "Erro ao carregar revendedor",
          description: "Não foi possível carregar os dados do revendedor.",
          variant: "destructive",
        })
        return null
      }
    },
    enabled: id !== "new",
  })
}

export function useCreateReseller() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Omit<Reseller, "id">) => createReseller(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resellers"] })
      toast({
        title: "Revendedor criado",
        description: "O revendedor foi criado com sucesso.",
      })
    },
    onError: () => {
      toast({
        title: "Erro ao criar revendedor",
        description: "Não foi possível criar o revendedor. Verifique os dados e tente novamente.",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateReseller() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Reseller> }) => updateReseller(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resellers"] })
      queryClient.invalidateQueries({ queryKey: ["reseller", variables.id] })
      toast({
        title: "Revendedor atualizado",
        description: "O revendedor foi atualizado com sucesso.",
      })
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar revendedor",
        description: "Não foi possível atualizar o revendedor. Verifique os dados e tente novamente.",
        variant: "destructive",
      })
    },
  })
}

export function useDeleteReseller() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteReseller(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resellers"] })
      toast({
        title: "Revendedor excluído",
        description: "O revendedor foi excluído com sucesso.",
      })
    },
    onError: () => {
      toast({
        title: "Erro ao excluir revendedor",
        description: "Não foi possível excluir o revendedor.",
        variant: "destructive",
      })
    },
  })
}

// PIX queries
export function usePixStatus() {
  return useQuery({
    queryKey: ["pixStatus"],
    queryFn: async () => {
      const connection = await testConnection()
      let auth = false

      if (connection) {
        auth = await testAuthentication()
      }

      return { connection, auth }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useCreatePixCharge() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: { valor: number; cpf: string; nome: string }) => createPixCharge(data),
    onSuccess: () => {
      toast({
        title: "Cobrança PIX gerada",
        description: "A cobrança PIX foi gerada com sucesso.",
      })
    },
    onError: () => {
      toast({
        title: "Erro ao gerar cobrança PIX",
        description: "Não foi possível gerar a cobrança PIX. Verifique os dados e tente novamente.",
        variant: "destructive",
      })
    },
  })
}

export function usePixCharge(id: string) {
  const { toast } = useToast()

  return useQuery({
    queryKey: ["pixCharge", id],
    queryFn: async () => {
      try {
        return await getPixCharge(id)
      } catch (error) {
        toast({
          title: "Erro ao consultar cobrança PIX",
          description: "Não foi possível consultar a cobrança PIX. Verifique o ID e tente novamente.",
          variant: "destructive",
        })
        return null
      }
    },
    enabled: !!id,
  })
}

// Query para listar cobranças por status com melhor tratamento de erros
export function usePixChargesByStatus(status?: "ativa" | "pendente" | "concluida") {
  const { toast } = useToast()
  const [hasShownError, setHasShownError] = useState(false)

  return useQuery({
    queryKey: ["pixCharges", status],
    queryFn: async () => {
      try {
        const result = await listPixChargesByStatus(status)

        // Limpar o flag de erro quando a operação for bem-sucedida
        if (hasShownError) {
          setHasShownError(false)
        }

        return result
      } catch (error) {
        // Mostrar o toast apenas uma vez para evitar spam
        if (!hasShownError) {
          toast({
            title: "Erro ao carregar cobranças",
            description: `Não foi possível carregar as cobranças ${status || "todas"}. Tentando novamente...`,
            variant: "destructive",
          })
          setHasShownError(true)
        }

        console.error(`Error in usePixChargesByStatus(${status}):`, error)
        return [] // Retornar array vazio para evitar quebra da UI
      }
    },
    staleTime: 1000 * 60 * 1, // 1 minuto
    refetchInterval: 30000, // Tentar novamente a cada 30 segundos
    retry: 3, // Tentar novamente até 3 vezes em caso de falha
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}

// Mutation para cancelar uma cobrança específica
export function useCancelPixCharge() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (txid: string) => cancelPixCharge(txid),
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a cobranças PIX
      queryClient.invalidateQueries({ queryKey: ["pixCharges"] })

      toast({
        title: "Cobrança cancelada",
        description: "A cobrança PIX foi cancelada com sucesso.",
      })
    },
    onError: () => {
      toast({
        title: "Erro ao cancelar cobrança",
        description: "Não foi possível cancelar a cobrança PIX. Tente novamente.",
        variant: "destructive",
      })
    },
  })
}

// Mutation para cancelar todas as cobranças ativas
export function useCancelAllActivePixCharges() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: () => cancelAllActivePixCharges(),
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a cobranças PIX
      queryClient.invalidateQueries({ queryKey: ["pixCharges"] })

      toast({
        title: "Cobranças canceladas",
        description: "Todas as cobranças PIX ativas foram canceladas com sucesso.",
      })
    },
    onError: () => {
      toast({
        title: "Erro ao cancelar cobranças",
        description: "Não foi possível cancelar todas as cobranças PIX ativas. Tente novamente.",
        variant: "destructive",
      })
    },
  })
}

