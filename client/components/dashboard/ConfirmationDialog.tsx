"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Trash2, Info, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: React.ReactNode
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  variant?: "danger" | "warning" | "info" | "success"
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = "danger",
}: ConfirmationDialogProps) {
  
  const variantConfig = {
    danger: {
      icon: Trash2,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      btn: "bg-red-500 hover:bg-red-600 shadow-red-500/20",
      glow: "from-red-500/20 to-transparent"
    },
    warning: {
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
      glow: "from-amber-500/20 to-transparent"
    },
    info: {
      icon: Info,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      btn: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20",
      glow: "from-blue-500/20 to-transparent"
    },
    success: {
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      btn: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20",
      glow: "from-emerald-500/20 to-transparent"
    }
  }[variant];

  const Icon = variantConfig.icon;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2.5">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 border", variantConfig.bg, variantConfig.border)}>
              <Icon className={cn("w-3.5 h-3.5", variantConfig.color)} />
            </div>
            <span>{title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            variant={variant === "danger" ? "destructive" : "default"}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
