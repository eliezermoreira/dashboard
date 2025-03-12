"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Reseller } from "@/lib/api"
import { useDeleteReseller } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2, Users } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DeleteConfirmDialog } from "@/components/resellers/delete-confirm-dialog"
import { ResellerTableSkeleton } from "@/components/ui/skeletons"
import { Badge } from "@/components/ui/badge"

interface ResellersTableProps {
  resellers: Reseller[]
  isLoading: boolean
}

export function ResellersTable({ resellers, isLoading }: ResellersTableProps) {
  const router = useRouter()
  const [resellerToDelete, setResellerToDelete] = useState<Reseller | null>(null)
  const deleteMutation = useDeleteReseller()

  const handleDelete = async () => {
    if (!resellerToDelete) return

    await deleteMutation.mutateAsync(resellerToDelete.id)
    setResellerToDelete(null)
  }

  // Função para classificar o número de clientes
  const getClientBadge = (count: number) => {
    if (count === 0) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
          Nenhum
        </Badge>
      )
    } else if (count < 10) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Poucos
        </Badge>
      )
    } else if (count < 50) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Médio
        </Badge>
      )
    } else if (count < 100) {
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          Alto
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          Premium
        </Badge>
      )
    }
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
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">Usuário</TableHead>
              <TableHead className="font-semibold">CPF</TableHead>
              <TableHead className="font-semibold">WhatsApp</TableHead>
              <TableHead className="font-semibold">Clientes</TableHead>
              <TableHead className="text-right font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resellers.map((reseller, index) => (
              <TableRow
                key={reseller.id}
                className={index % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-900"}
              >
                <TableCell className="font-medium">
                  {reseller.nome} {reseller.sobrenome}
                </TableCell>
                <TableCell>{reseller.nome_usuario}</TableCell>
                <TableCell>{reseller.cpf}</TableCell>
                <TableCell>{reseller.whatsapp}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{reseller.quantidade_clientes}</span>
                    {getClientBadge(reseller.quantidade_clientes)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/resellers/${reseller.id}`)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setResellerToDelete(reseller)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {resellerToDelete && (
        <DeleteConfirmDialog
          open={!!resellerToDelete}
          onOpenChange={() => setResellerToDelete(null)}
          onConfirm={handleDelete}
          resellerName={`${resellerToDelete.nome} ${resellerToDelete.sobrenome}`}
        />
      )}
    </>
  )
}

