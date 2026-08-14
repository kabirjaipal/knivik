import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type LeadCardData } from "@/components/dashboard/LeadCard"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportLeadsToCSV(leads: LeadCardData[], filename = "leads.csv", isPro = false): boolean {
  if (!leads.length) return false

  const leadsToExport = leads

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
    "Qualification Reasoning"
  ]

  if (isPro) {
    headers.push("AI Reply Draft")
  }

  const csvRows = [
    headers.join(","),
    ...leadsToExport.map((lead) => {
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
        lead.metadata?.qualificationReasoning || ""
      ]
      if (isPro) {
        row.push(replyText)
      }
      return row.map((val) => {
        const stringVal = String(val ?? "").replace(/"/g, '""')
        return `"${stringVal}"`
      }).join(",")
    })
  ]

  const csvContent = csvRows.join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  return true
}

/**
 * Calculates the estimated reading time of HTML content.
 * Follows the standard reading speed of 200 words per minute (WPM)
 * and adjusts for embedded images (Medium style).
 */
export function calculateReadTime(content: string): string {
  if (!content || !content.trim()) {
    return "0 min read";
  }

  // 1. Strip HTML tags and extract text content to count words
  const cleanText = content.replace(/<[^>]*>/g, " ");
  const words = cleanText.trim().split(/\s+/).filter((w) => w.length > 0).length;

  // Average reading speed: 200 words per minute
  const WORDS_PER_MINUTE = 200;
  let totalSeconds = (words / WORDS_PER_MINUTE) * 60;

  // 2. Account for images (if any)
  // Medium's algorithm: 12s for 1st image, 11s for 2nd, 10s for 3rd, ..., down to 3s for 10th+
  const imageCount = (content.match(/<img[^>]*>/g) || []).length;
  let imageSeconds = 0;
  let currentImageSec = 12;
  for (let i = 0; i < imageCount; i++) {
    imageSeconds += currentImageSec;
    if (currentImageSec > 3) {
      currentImageSec--;
    }
  }
  totalSeconds += imageSeconds;

  const minutes = Math.max(1, Math.ceil(totalSeconds / 60));
  return `${minutes} min read`;
}

/**
 * Compresses an image file client-side to WebP format with 0.82 quality.
 * Returns a Base64 data URL.
 */
export function compressImage(file: File, maxWidth = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if it exceeds maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Export to WebP with 0.82 quality
        const dataUrl = canvas.toDataURL("image/webp", 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}


