import { z } from "zod"

export const resellerSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  sobrenome: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve conter 11 dígitos numéricos"),
  whatsapp: z.string().regex(/^\d{10,11}$/, "WhatsApp deve conter 10 ou 11 dígitos numéricos"),
  nome_usuario: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  quantidade_clientes: z.number().int().min(0, "Quantidade de clientes não pode ser negativa"),
})

export const pixChargeSchema = z.object({
  valor: z.number().positive("Valor deve ser positivo"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve conter 11 dígitos numéricos"),
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
})

export const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
})

export type ResellerFormValues = z.infer<typeof resellerSchema>
export type PixChargeFormValues = z.infer<typeof pixChargeSchema>
export type LoginFormValues = z.infer<typeof loginSchema>

