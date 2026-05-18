"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Star, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"

type FeedbackCategory = "UI/UX" | "Scraping" | "AI Accuracy" | "Pricing" | "Other"

export function FeedbackWidget() {
  const { user } = useAuth()

  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [comment, setComment] = useState("")
  const [category, setCategory] = useState<FeedbackCategory>("Other")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Hide feedback widget if user is not logged in or is an administrator
  if (!user || user.role === "admin") {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error("Please select a rating before submitting.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          category,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback")
      }

      toast.success("Thank you! Your feedback has been recorded.")
      setRating(0)
      setComment("")
      setCategory("Other")
      setIsOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 font-medium group"
          aria-label="Give feedback"
        >
          <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap">
            Feedback
          </span>
        </button>
      </div>

      {/* Slide-in Feedback Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 z-50"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="fixed bottom-24 right-6 w-[90vw] sm:w-[400px] bg-card text-card-foreground border border-border rounded-2xl shadow-2xl p-6 z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <div>
                  <h3 className="font-semibold text-lg">Send Feedback</h3>
                  <p className="text-xs text-muted-foreground">Help us improve Knivik for you</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-muted rounded-full transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Feedback Category
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(["UI/UX", "Scraping", "AI Accuracy", "Pricing", "Other"] as FeedbackCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-all duration-200 ${
                          category === cat
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating selection (Stars) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="p-1 hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted border-none fill-muted/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment box */}
                <div className="space-y-1.5">
                  <label htmlFor="feedback-comment" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Share your experience
                  </label>
                  <textarea
                    id="feedback-comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like? What can we do better?"
                    className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary resize-none placeholder:text-muted-foreground transition-all duration-200"
                    maxLength={1000}
                  />
                  <div className="text-right text-[10px] text-muted-foreground">
                    {comment.length}/1000 characters
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
