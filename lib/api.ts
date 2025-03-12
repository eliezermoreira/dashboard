// Base URLs for the APIs
const RESELLER_API_BASE = "https://dash.prime-stream.site/api"
const PIX_API_BASE = "https://efi.prime-stream.site"
const WHATSAPP_API_BASE = "https://evo.prime-stream.site"

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

// Reseller API functions
export async function listResellers(): Promise<Reseller[]> {
  try {
    const response = await fetch(`${RESELLER_API_BASE}/listar-revendas`)
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }
    const data = await response.json()
    // Ensure we return an array even if the API returns something else
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Failed to fetch resellers:", error)
    return []
  }
}

export async function getReseller(id: string): Promise<Reseller | null> {
  // Skip API call for special IDs like "new"
  if (id === "new") {
    console.log("Skipping API call for ID 'new'")
    return null
  }

  try {
    const response = await fetch(`${RESELLER_API_BASE}/buscar-revenda/${id}`)
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch reseller ${id}:`, error)
    return null
  }
}

export async function createReseller(data: Omit<Reseller, "id">): Promise<Reseller | null> {
  try {
    const response = await fetch(`${RESELLER_API_BASE}/criar-revenda`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Failed to create reseller:", error)
    return null
  }
}

export async function updateReseller(id: string, data: Partial<Reseller>): Promise<Reseller | null> {
  try {
    const response = await fetch(`${RESELLER_API_BASE}/atualizar-revenda/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Failed to update reseller ${id}:`, error)
    return null
  }
}

export async function deleteReseller(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${RESELLER_API_BASE}/deletar-revenda/${id}`, {
      method: "DELETE",
    })
    return response.ok
  } catch (error) {
    console.error(`Failed to delete reseller ${id}:`, error)
    return false
  }
}

export async function deleteAllResellers(): Promise<boolean> {
  try {
    const response = await fetch(`${RESELLER_API_BASE}/deletar-todas-revendas`, {
      method: "DELETE",
    })
    return response.ok
  } catch (error) {
    console.error("Failed to delete all resellers:", error)
    return false
  }
}

// PIX API functions
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${PIX_API_BASE}/`)
    return response.ok
  } catch (error) {
    console.error("Failed to test connection:", error)
    return false
  }
}

export async function testAuthentication(): Promise<boolean> {
  try {
    const response = await fetch(`${PIX_API_BASE}/pix/testar-autenticacao`)
    return response.ok
  } catch (error) {
    console.error("Failed to test authentication:", error)
    return false
  }
}

export async function createPixCharge(data: {
  valor: number
  cpf: string
  nome: string
}): Promise<PixCharge | null> {
  try {
    const response = await fetch(`${PIX_API_BASE}/pix/gerar-cobranca`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }
    const result = await response.json()

    // Ensure valor is a number
    if (result && result.valor !== undefined) {
      result.valor = typeof result.valor === "number" ? result.valor : Number(result.valor)
    }

    // Se o resultado não tiver um txid, mas tiver um id, buscar a cobrança completa
    if (result && result.id && !result.txid) {
      try {
        // Aguardar um momento para garantir que a cobrança foi processada
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Buscar a cobrança completa para obter o txid
        const fullCharge = await getPixCharge(result.id)
        if (fullCharge && fullCharge.txid) {
          // Atualizar o resultado com o txid
          result.txid = fullCharge.txid
          result.codigo_pix = fullCharge.codigo_pix
          result.status = fullCharge.status
        }
      } catch (error) {
        console.error("Failed to fetch complete PIX charge:", error)
      }
    }

    return result
  } catch (error) {
    console.error("Failed to create PIX charge:", error)
    return null
  }
}

export async function getPixCharge(id: string): Promise<PixCharge | null> {
  try {
    const response = await fetch(`${PIX_API_BASE}/pix/consultar/${id}`)
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }
    const result = await response.json()

    // Ensure valor is a number
    if (result && result.valor !== undefined) {
      result.valor = typeof result.valor === "number" ? result.valor : Number(result.valor)
    }

    return result
  } catch (error) {
    console.error(`Failed to fetch PIX charge ${id}:`, error)
    return null
  }
}

export async function listPixChargesByStatus(status?: "ativa" | "pendente" | "concluida"): Promise<PixCharge[]> {

  try {

    // Usar os endpoints específicos com base no status

    let url = `${PIX_API_BASE}/pix/cobrancas/todas`;



    if (status === "ativa") {

      url = `${PIX_API_BASE}/pix/cobrancas/ativas`;

    } else if (status === "concluida") {

      url = `${PIX_API_BASE}/pix/cobrancas/concluidas`;

    }



    console.log(`Fetching charges from: ${url}`);



    const response = await fetch(url);



    if (!response.ok) {

      console.error(`API Error: ${response.status} - ${response.statusText}`);

      throw new Error(`Error: ${response.status}`);

    }



    const data = await response.json();

    console.log(`Received data:`, data);



    // Verifique se a resposta contém a estrutura esperada

    if (Array.isArray(data) && data.length > 0 && data[0].cobrancas) {

      const charges = data[0].cobrancas;

      let selectedCharges = [];



      if (status === "ativa") {

        selectedCharges = charges.ativas || [];

      } else if (status === "concluida") {

        selectedCharges = charges.concluidas || [];

      } else {

        // Se não houver status específico, combine as duas listas

        selectedCharges = [...(charges.ativas || []), ...(charges.concluidas || [])];

      }



      console.log(`Received ${selectedCharges.length} charges`);

      return selectedCharges.map((charge) => ({

        ...charge,

        valor: typeof charge.valor === "number" ? charge.valor : Number(charge.valor) || 0,

      }));

    }



    console.warn("API did not return expected structure, returning empty array");

    return [];

  } catch (error) {

    console.error("Failed to fetch PIX charges by status:", error);

    return []; // Return empty array instead of throwing to prevent UI errors

  }

}

// Novas funções para cancelar cobranças
export async function cancelPixCharge(txid: string): Promise<boolean> {
  try {
    console.log(`Canceling charge with txid: ${txid}`) // Log para debug

    const response = await fetch(`${PIX_API_BASE}/pix/cancelar/${txid}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${response.statusText}`)
    }

    return response.ok
  } catch (error) {
    console.error(`Failed to cancel PIX charge with txid ${txid}:`, error)
    return false
  }
}

export async function cancelAllActivePixCharges(): Promise<boolean> {
  try {
    console.log("Canceling all active charges") // Log para debug

    const response = await fetch(`${PIX_API_BASE}/pix/cancelar-todas-ativas`, {
      method: "DELETE",
    })

    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${response.statusText}`)
    }

    return response.ok
  } catch (error) {
    console.error("Failed to cancel all active PIX charges:", error)
    return false
  }
}

// WhatsApp API functions
export async function sendWhatsAppMessage(data: WhatsAppMessage): Promise<boolean> {
  try {
    const response = await fetch(`${WHATSAPP_API_BASE}/message/sendText/prime`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "DDDEC1CE709C-4559-9B3B-00752EF3FA31": "",
      },
      body: JSON.stringify(data),
    })
    return response.ok
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error)
    return false
  }
}

