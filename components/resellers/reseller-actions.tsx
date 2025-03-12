"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { type Reseller, deleteReseller } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { DeleteConfirmDialog } from "@/components/resellers/delete-confirm-dialog"

interface ResellerActionsProps {
  reseller: Reseller
  onDeleted: () => void
}

export function ResellerActions({ reseller, onDeleted }: ResellerActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async () => {
    try {
      const success = await deleteReseller(reseller.id)
      if (success) {
        toast({
          title: "Revendedor excluído",
          description: "O revendedor foi excluído com sucesso.",
        })
        onDeleted()
      } else {
        throw new Error("Falha ao excluir revendedor")
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir revendedor",
        description: "Não foi possível excluir o revendedor.",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/resellers/${reseller.id}`)}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Editar</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Excluir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        resellerName={`${reseller.nome} ${reseller.sobrenome}`}
      />
    </>
  )
}

