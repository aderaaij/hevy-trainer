"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SyncButtonProps {
  onSync?: () => void
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function SyncButton({ 
  onSync, 
  variant = "outline", 
  size = "icon" 
}: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    
    try {
      const response = await fetch('/api/sync/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ syncType: 'incremental' })
      })

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      // Call parent callback if provided
      onSync?.()
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw 
              className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} 
            />
            {size !== "icon" && (
              <span className="ml-2">
                {isSyncing ? 'Syncing...' : 'Sync'}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Sync latest workouts from Hevy</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}