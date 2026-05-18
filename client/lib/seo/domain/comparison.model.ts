export interface CompetitorDetail {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  rating: number; // Out of 5
  pricing: string; // e.g., "Starts at $99/mo"
  platforms: string[]; // e.g., ["Reddit", "HackerNews"]
  pros: string[];
  limitations: string[];
}

export interface ComparisonFeature {
  name: string;
  category: "AI & Intent Analysis" | "Monitoring Speed & Scope" | "Outreach & Automation" | "ROI & Accessibility";
  knivikHas: boolean;
  competitorHas: boolean;
  description: string;
}

export interface ComparisonData {
  competitor: CompetitorDetail;
  keyDifferences: string[];
  features: ComparisonFeature[];
  verdict: string;
  faq: { question: string; answer: string; }[];
}
