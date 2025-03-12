"use client"

import { useState, useEffect } from "react"
import { listResellers, type Reseller } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function RecentResellers() {
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchResellers = async () => {
      try {
        const data = await listResellers()
        // Ensure data is an array
        if (!Array.isArray(data)) {
          setResellers([])
          return
        }

        // Sort by most recent (assuming there's a created_at field, or using id as fallback)
        const sorted = data.sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
          return b.id.localeCompare(a.id)
        })
        setResellers(sorted.slice(0, 5)) // Get only the 5 most recent
      } catch (error) {
        toast({
          title: "Erro ao carregar revendedores",
          description: "Não foi possível carregar a lista de revendedores recentes.",
          variant: "destructive",
        })
        setResellers([])
      } finally {
        setLoading(false)
      }
    }

    fetchResellers()
  }, [toast])

  if (loading) {
    return <div className="text-center py-4">Carregando revendedores recentes...</div>
  }

  if (resellers.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="mb-4">Nenhum revendedor cadastrado.</p>
        <Button onClick={() => router.push("/resellers/new")}>Cadastrar Revendedor</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {resellers.map((reseller) => (
        <div key={reseller.id} className="flex items-center justify-between border-b pb-2">
          <div>
            <div className="font-medium">
              {reseller.nome} {reseller.sobrenome}
            </div>
            <div className="text-sm text-muted-foreground">
              {reseller.nome_usuario} • {reseller.quantidade_clientes} clientes
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push(`/resellers/${reseller.id}`)}>
            Ver
          </Button>
        </div>
      ))}
      <div className="pt-2">
        <Button variant="outline" className="w-full" onClick={() => router.push("/resellers")}>
          Ver Todos os Revendedores
        </Button>
      </div>
    </div>
  )
}

