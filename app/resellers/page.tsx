"use client"

import { useState } from "react"
import { Trash2, Users, UserPlus, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useResellers } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { DeleteAllConfirmDialog } from "@/components/resellers/delete-all-confirm-dialog"
import { ResellersTable } from "@/components/resellers/resellers-table"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResellerCards } from "@/components/resellers/reseller-cards"

export default function ResellersPage() {
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  // Usar React Query para buscar revendedores
  const { data: resellers = [], isLoading } = useResellers()

  const handleDeleteAll = async () => {
    // Implementação simplificada - em produção, seria necessário um endpoint específico
    toast({
      title: "Funcionalidade não implementada",
      description: "A exclusão em massa de revendedores ainda não está implementada.",
      variant: "destructive",
    })
    setShowDeleteAllDialog(false)
  }

  const filteredResellers = resellers.filter(
    (reseller) =>
      reseller.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reseller.sobrenome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reseller.nome_usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reseller.cpf.includes(searchTerm),
  )

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Revendedores</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os revendedores cadastrados no sistema</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => router.push("/resellers/new")}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Novo Revendedor
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteAllDialog(true)}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Excluir Todos
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar revendedor por nome, usuário ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <Tabs defaultValue="cards" className="w-full">
          <div className="px-4 pt-4 border-b border-gray-200 dark:border-gray-800">
            <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
              <TabsTrigger
                value="cards"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
              >
                <Users className="mr-2 h-4 w-4" />
                Cards
              </TabsTrigger>
              <TabsTrigger
                value="table"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
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
                  className="mr-2 h-4 w-4"
                >
                  <path d="M3 3h18v18H3z" />
                  <path d="M3 9h18" />
                  <path d="M3 15h18" />
                  <path d="M9 3v18" />
                  <path d="M15 3v18" />
                </svg>
                Tabela
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="cards" className="p-4">
            <ResellerCards resellers={filteredResellers} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="table" className="p-4">
            <ResellersTable resellers={filteredResellers} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>

      <DeleteAllConfirmDialog
        open={showDeleteAllDialog}
        onOpenChange={setShowDeleteAllDialog}
        onConfirm={handleDeleteAll}
      />
    </div>
  )
}

