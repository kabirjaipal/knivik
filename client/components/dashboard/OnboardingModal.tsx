"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Rocket, 
  Target, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  X,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/Textarea"
import { PROJECT_NAME } from "@/lib/constants"

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateProduct = async () => {
    if (!name || !description) return
    
    setLoading(true)
    setError(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
        credentials: 'include'
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Failed to create product")
      
      setStep(3) // Success step
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm shadow-2xl"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-muted">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            <div className="p-8 space-y-6">
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">Welcome to {PROJECT_NAME}!</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Let's get your first product set up so we can start scanning for high-intent leads.
                    </p>
                  </div>
                  <Button onClick={() => setStep(2)} className="w-full h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">What are you building?</h2>
                    <p className="text-sm text-muted-foreground">Our AI will use this to generate a target strategy for you.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input 
                        id="name" 
                        placeholder="e.g. Acme Analytics" 
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        className="h-11 bg-background/50 border-border/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desc">One-sentence description</Label>
                      <Textarea 
                        id="desc" 
                        placeholder="e.g. A privacy-focused alternative to Google Analytics for SaaS founders." 
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                        className="min-h-[100px] bg-background/50 border-border/60"
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                  <Button disabled={loading || !name || !description} onClick={handleCreateProduct} className="w-full h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate My Strategy
                  </Button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center space-y-6 py-4"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                    <CheckCircle2 className="h-10 w-10 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">You're all set!</h2>
                    <p className="text-muted-foreground">
                      We've created your first product and the {PROJECT_NAME} engine is now scanning social platforms for your first leads.
                    </p>
                  </div>
                  <Button onClick={onComplete} className="w-full h-12 text-base font-bold shadow-lg shadow-success/20 bg-success hover:bg-success/90">
                    Enter Dashboard
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
