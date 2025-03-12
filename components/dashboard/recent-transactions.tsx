"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function RecentTransactions() {
  const [loading] = useState(false)
  const router = useRouter()

  // Normally we would fetch recent transactions here
  // But since we don't have an endpoint for that, we'll just show a placeholder

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <p className="mb-4">Dados de transações PIX não disponíveis.</p>
        <Button onClick={() => router.push("/pix")}>Ir para Sistema PIX</Button>
      </div>
    </div>
  )
}

