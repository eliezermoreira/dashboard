"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getReseller, updateReseller } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function EditResellerPage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    cpf: "",
    whatsapp: "",
    nome_usuario: "",
    quantidade_clientes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { id } = params

  useEffect(() => {
    // If the ID is "new", redirect to the new reseller page
    if (id === "new") {
      router.push("/resellers/new")
      return
    }

    const fetchReseller = async () => {
      try {
        const reseller = await getReseller(id)
        if (reseller) {
          setFormData({
            nome: reseller.nome,
            sobrenome: reseller.sobrenome,
            cpf: reseller.cpf,
            whatsapp: reseller.whatsapp,
            nome_usuario: reseller.nome_usuario,
            quantidade_clientes: reseller.quantidade_clientes,
          })
        } else {
          toast({
            title: "Revendedor não encontrado",
            description: "Não foi possível encontrar o revendedor solicitado.",
            variant: "destructive",
          })
          router.push("/resellers")
        }
      } catch (error) {
        console.error(`Failed to fetch reseller ${id}:`, error)
        toast({
          title: "Erro ao carregar revendedor",
          description: "Não foi possível carregar os dados do revendedor.",
          variant: "destructive",
        })
        router.push("/resellers")
      } finally {
        setLoading(false)
      }
    }

    fetchReseller()
  }, [id, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantidade_clientes" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const result = await updateReseller(id, formData)
      if (result) {
        toast({
          title: "Revendedor atualizado",
          description: "O revendedor foi atualizado com sucesso.",
        })
        router.push("/resellers")
      } else {
        throw new Error("Falha ao atualizar revendedor")
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar revendedor",
        description: "Não foi possível atualizar o revendedor. Verifique os dados e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Editar Revendedor</h1>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="text-center">Carregando dados do revendedor...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Editar Revendedor</h1>
        <Button variant="outline" onClick={() => router.push("/resellers")}>
          Voltar
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Editar Revendedor</CardTitle>
            <CardDescription>Atualize os dados do revendedor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sobrenome">Sobrenome</Label>
                <Input id="sobrenome" name="sobrenome" value={formData.sobrenome} onChange={handleChange} required />
              </div>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                required
                placeholder="Apenas números com DDD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome_usuario">Nome de Usuário</Label>
              <Input
                id="nome_usuario"
                name="nome_usuario"
                value={formData.nome_usuario}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade_clientes">Quantidade de Clientes</Label>
              <Input
                id="quantidade_clientes"
                name="quantidade_clientes"
                type="number"
                min="0"
                value={formData.quantidade_clientes}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/resellers")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

