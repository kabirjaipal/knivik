import React from "react";
import { SchemaService } from "@/lib/seo/application/schema.service";
import { SchemaScript } from "./schema-script";
import { FAQItem } from "@/lib/seo/domain/seo.types";

interface DynamicFaqJsonLdProps {
  customFaqs?: FAQItem[];
}

const defaultFaqs: FAQItem[] = [
  {
    question: "Is Knivik a SaaS tool or an agency?",
    answer: "Knivik is a 100% self-service AI Lead Finder SaaS (Software-as-a-Service) tool, not an agency. You log into the dashboard, add your products, define keywords/competitors, and manage your leads directly inside our software."
  },
  {
    question: "How does the lead finding and filtering process work?",
    answer: "Once you add your product, our background scraping engine continuously scans active discussion streams on Reddit, HackerNews, and X (Twitter). Our advanced AI then filters and scores these posts based on buying intent to deliver only the best, highest-converting leads directly to your dashboard."
  },
  {
    question: "How does the AI find high-quality leads?",
    answer: "Knivik understands the true intent behind social posts. Instead of just matching keywords, it identifies people who are actively looking for solutions, frustrated with competitors, or asking for recommendations, while filtering out irrelevant noise."
  },
  {
    question: "Where does Knivik find these leads?",
    answer: "We monitor major social platforms including Reddit, X (Twitter), and HackerNews. We find high-intent conversations in real-time, giving you the first-mover advantage before your competitors even know they exist."
  },
  {
    question: "How do I reach out without sounding like a salesperson?",
    answer: "Every lead comes with AI-generated 'Reply Angles'—personalized suggestions based on the specific conversation. This helps you join threads naturally, provide genuine value, and build trust without sounding like a bot."
  },
  {
    question: "Can I connect this to my existing workflow?",
    answer: "Absolutely. You can automatically push your leads to Slack, Discord, or connect with 5,000+ other apps via Zapier and Make. This ensures you never miss a lead and can keep your outreach moving."
  },
  {
    question: "Is it easy to get started?",
    answer: "Yes! You can set up your first product in minutes. We offer a free tier so you can see the quality of leads for yourself before committing to a paid plan as your business grows."
  }
];

/**
 * FAQ Schema script injector. Can be loaded inside layout headers
 * or directly inside the FAQ landing component to keep features colocated.
 */
export function DynamicFaqJsonLd({ customFaqs }: DynamicFaqJsonLdProps) {
  const activeFaqs = customFaqs || defaultFaqs;
  const faqSchema = SchemaService.generateFAQSchema(activeFaqs);
  return <SchemaScript schema={faqSchema} />;
}
