"use client"

import { useRouter } from "next/navigation"
import type { Reseller } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Pencil, Trash2, Users, Phone, User } from "lucide-react"
import { useState } from "react"
import { useDeleteReseller } from "@/lib/queries"
import { DeleteConfirmDialog } from "@/components/resellers/delete-confirm-dialog"
import { ResellerTableSkeleton } from "@/components/ui/skeletons"

interface ResellerCardsProps {
  resellers: Reseller[]
  isLoading: boolean
}

export function ResellerCards({ resellers, isLoading }: ResellerCardsProps) {
  const router = useRouter()
  const [resellerToDelete, setResellerToDelete] = useState<Reseller | null>(null)
  const deleteMutation = useDeleteReseller()

  const handleDelete = async () => {
    if (!resellerToDelete) return

    await deleteMutation.mutateAsync(resellerToDelete.id)
    setResellerToDelete(null)
  }

  // Função para gerar uma cor baseada no nome do revendedor
  const getColorClass = (name: string) => {
    const colors = [
      "from-blue-500 to-indigo-500",
      "from-green-500 to-emerald-500",
      "from-purple-500 to-violet-500",
      "from-amber-500 to-orange-500",
      "from-rose-500 to-pink-500",
      "from-cyan-500 to-sky-500",
      "from-fuchsia-500 to-purple-500",
      "from-lime-500 to-green-500",
    ]

    // Usar a soma dos códigos ASCII das letras do nome para escolher uma cor
    const sum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[sum % colors.length]
  }

  if (isLoading) {
    return <ResellerTableSkeleton />
  }

  if (resellers.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium">Nenhum revendedor encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">Comece adicionando um novo revendedor ao sistema.</p>
        <div className="mt-6">
          <Button onClick={() => router.push("/resellers/new")}>Adicionar Revendedor</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {resellers.map((reseller) => (
        <Card key={reseller.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <div className={`h-3 bg-gradient-to-r ${getColorClass(reseller.nome)}`} />
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {reseller.nome} {reseller.sobrenome}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center mt-1">
                  <User className="h-3.5 w-3.5 mr-1" />
                  {reseller.nome_usuario}
                </p>
              </div>
              <div className="flex items-center justify-center rounded-full w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                <span className="text-lg font-bold">{reseller.nome.charAt(0)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">{reseller.quantidade_clientes}</span>
                <span className="text-muted-foreground ml-1">clientes</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{reseller.whatsapp}</span>
              </div>
              <div className="flex items-center text-sm">
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
                  className="h-4 w-4 mr-2 text-muted-foreground"
                >
                  <path d="M22 8a.76.76 0 0 0 0-.21v-.08a.77.77 0 0 0-.07-.16.35.35 0 0 0-.05-.08l-.1-.13-.08-.06-.12-.09-9-5a1 1 0 0 0-1 0l-9 5-.09.07-.11.08a.41.41 0 0 0-.09.11.39.39 0 0 0-.06.09.7.7 0 0 0-.06.18.71.71 0 0 0-.01.14V15a1 1 0 0 0 .52.87l9 5a.84.84 0 0 0 .13.06h.1a1.06 1.06 0 0 0 .5-.01.88.88 0 0 0 .13-.05l9-5A1 1 0 0 0 22 15V8z"></path>
                  <path d="M12 22V12"></path>
                  <path d="m2 8 10 5 10-5"></path>
                </svg>
                <span>{reseller.cpf}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/resellers/${reseller.id}`)}
              className="flex items-center"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResellerToDelete(reseller)}
              className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Excluir
            </Button>
          </CardFooter>
        </Card>
      ))}

      {resellerToDelete && (
        <DeleteConfirmDialog
          open={!!resellerToDelete}
          onOpenChange={() => setResellerToDelete(null)}
          onConfirm={handleDelete}
          resellerName={`${resellerToDelete.nome} ${resellerToDelete.sobrenome}`}
        />
      )}
    </div>
  )
}

