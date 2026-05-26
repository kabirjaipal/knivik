import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type LeadCardData } from "@/components/dashboard/LeadCard"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportLeadsToCSV(leads: LeadCardData[], filename = "leads.csv"): boolean {
  if (!leads.length) return false

  const headers = [
    "Product Name",
    "Platform",
    "Intent Level",
    "Intent Score",
    "Title",
    "URL",
    "Author",
    "Created At",
    "Status",
    "Detected By",
    "Notes",
    "Qualification Reasoning",
    "AI Reply Draft"
  ]

  const csvRows = [
    headers.join(","),
    ...leads.map((lead) => {
      const replyText = lead.replies?.length ? lead.replies[0].generatedText : ""
      const row = [
        lead.product?.name || "Unknown",
        lead.platform,
        lead.intentLevel,
        lead.intentScore,
        lead.title || "Found Conversation Thread",
        lead.url,
        lead.authorUsername || "",
        new Date(lead.postedAt || lead.createdAt).toISOString(),
        lead.status,
        lead.detectedBy,
        lead.notes || "",
        lead.metadata?.qualificationReasoning || "",
        replyText
      ]
      return row.map((val) => {
        const stringVal = String(val ?? "").replace(/"/g, '""')
        return `"${stringVal}"`
      }).join(",")
    })
  ]

  const csvContent = csvRows.join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  return true
}
