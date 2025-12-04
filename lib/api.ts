// Base URLs for the APIs
// Proxy via Next.js route to evitar CORS no browser
const RESELLER_API_BASE = "/api/resellers"
const PIX_API_BASE = "mock"
const WHATSAPP_API_BASE = "mock"

// Types
export interface Reseller {
  id: string
  nome: string
  sobrenome: string
  cpf: string
  whatsapp: string
  nome_usuario: string
  quantidade_clientes: number
  created_at?: string
}

export interface PixCharge {
  id: string
  valor: number
  cpf: string
  nome: string
  status?: string
  created_at?: string
  txid?: string
  codigo_pix?: string // Código PIX copia e cola
}

export interface PixTransaction {
  id: string
  txid: string
  valor: number
  status: string
  created_at: string
  updated_at?: string
}

export interface WhatsAppMessage {
  delay: number
  number: string
  text: string
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

let mockResellers: Reseller[] = [
  { id: "r1", nome: "Ana", sobrenome: "Silva", cpf: "12345678901", whatsapp: "11999999999", nome_usuario: "ana.s", quantidade_clientes: 12, created_at: new Date().toISOString() },
  { id: "r2", nome: "Bruno", sobrenome: "Souza", cpf: "23456789012", whatsapp: "21988888888", nome_usuario: "bruno", quantidade_clientes: 8, created_at: new Date().toISOString() },
  { id: "r3", nome: "Carla", sobrenome: "Oliveira", cpf: "34567890123", whatsapp: "31977777777", nome_usuario: "carla.o", quantidade_clientes: 22, created_at: new Date().toISOString() },
  { id: "r4", nome: "Diego", sobrenome: "Almeida", cpf: "45678901234", whatsapp: "41966666666", nome_usuario: "diego", quantidade_clientes: 5, created_at: new Date().toISOString() },
  { id: "r5", nome: "Elaine", sobrenome: "Costa", cpf: "56789012345", whatsapp: "51955555555", nome_usuario: "elaine", quantidade_clientes: 18, created_at: new Date().toISOString() },
  { id: "r6", nome: "Fábio", sobrenome: "Mendes", cpf: "67890123456", whatsapp: "61944444444", nome_usuario: "fabio", quantidade_clientes: 35, created_at: new Date().toISOString() },
  { id: "r7", nome: "Gabi", sobrenome: "Pereira", cpf: "78901234567", whatsapp: "71933333333", nome_usuario: "gabi", quantidade_clientes: 11, created_at: new Date().toISOString() },
  { id: "r8", nome: "Hugo", sobrenome: "Ramos", cpf: "89012345678", whatsapp: "81922222222", nome_usuario: "hugo", quantidade_clientes: 48, created_at: new Date().toISOString() },
]

let mockPixCharges: PixCharge[] = [
  { id: "c1", txid: "TX-1001", valor: 49.9, cpf: "12345678901", nome: "Cliente A", status: "ativa", created_at: new Date(Date.now() - 86400000).toISOString(), codigo_pix: "COD-1001" },
  { id: "c2", txid: "TX-1002", valor: 99.9, cpf: "23456789012", nome: "Cliente B", status: "concluida", created_at: new Date(Date.now() - 172800000).toISOString(), codigo_pix: "COD-1002" },
  { id: "c3", txid: "TX-1003", valor: 15.0, cpf: "34567890123", nome: "Cliente C", status: "ativa", created_at: new Date().toISOString(), codigo_pix: "COD-1003" },
  { id: "c4", txid: "TX-1004", valor: 120.0, cpf: "45678901234", nome: "Cliente D", status: "concluida", created_at: new Date(Date.now() - 3600000).toISOString(), codigo_pix: "COD-1004" },
]

// Reseller API functions
export async function listResellers(): Promise<Reseller[]> {
  await delay(150)
  return [...mockResellers]
}

export async function getReseller(id: string): Promise<Reseller | null> {
  await delay(100)
  if (id === "new") return null
  const item = mockResellers.find((r) => r.id === id) || null
  return item ? { ...item } : null
}

export async function createReseller(data: Omit<Reseller, "id">): Promise<Reseller | null> {
  await delay(150)
  const id = `r${Math.random().toString(36).slice(2, 8)}`
  const item: Reseller = { id, ...data, created_at: new Date().toISOString() }
  mockResellers = [item, ...mockResellers]
  return item
}

export async function updateReseller(id: string, data: Partial<Reseller>): Promise<Reseller | null> {
  await delay(150)
  const idx = mockResellers.findIndex((r) => r.id === id)
  if (idx < 0) return null
  const updated = { ...mockResellers[idx], ...data }
  mockResellers[idx] = updated
  return { ...updated }
}

export async function deleteReseller(id: string): Promise<boolean> {
  await delay(100)
  const before = mockResellers.length
  mockResellers = mockResellers.filter((r) => r.id !== id)
  return mockResellers.length < before
}

export async function deleteAllResellers(): Promise<boolean> {
  await delay(100)
  mockResellers = []
  return true
}

// PIX API functions
export async function testConnection(): Promise<boolean> {
  await delay(50)
  return true
}

export async function testAuthentication(): Promise<boolean> {
  await delay(50)
  return true
}

export async function createPixCharge(data: {
  valor: number
  cpf: string
  nome: string
}): Promise<PixCharge | null> {
  await delay(300)
  const id = `c${Math.random().toString(36).slice(2, 8)}`
  const txid = `TX-${Math.floor(Math.random() * 100000)}`
  const result: PixCharge = {
    id,
    txid,
    valor: typeof data.valor === "number" ? data.valor : Number(data.valor),
    cpf: data.cpf,
    nome: data.nome,
    status: "ativa",
    created_at: new Date().toISOString(),
    codigo_pix: `COD-${txid}`,
  }
  mockPixCharges = [result, ...mockPixCharges]
  return result
}

export async function getPixCharge(id: string): Promise<PixCharge | null> {
  await delay(150)
  const item = mockPixCharges.find((c) => c.id === id || c.txid === id) || null
  return item ? { ...item } : null
}

export async function listPixChargesByStatus(status?: "ativa" | "pendente" | "concluida"): Promise<PixCharge[]> {
  await delay(150)
  const src = [...mockPixCharges]
  if (!status) return src
  const normalized = status === "pendente" ? "ativa" : status
  return src.filter((c) => c.status === normalized)
}

// Novas funções para cancelar cobranças
export async function cancelPixCharge(txid: string): Promise<boolean> {
  await delay(100)
  const idx = mockPixCharges.findIndex((c) => c.txid === txid || c.id === txid)
  if (idx < 0) return false
  mockPixCharges[idx] = { ...mockPixCharges[idx], status: "concluida" }
  return true
}

export async function cancelAllActivePixCharges(): Promise<boolean> {
  await delay(150)
  mockPixCharges = mockPixCharges.map((c) => (c.status === "ativa" ? { ...c, status: "concluida" } : c))
  return true
}

// WhatsApp API functions
export async function sendWhatsAppMessage(data: WhatsAppMessage): Promise<boolean> {
  await delay(data.delay || 200)
  return true
}

