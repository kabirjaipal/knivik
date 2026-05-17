import { Metadata } from "next";

export interface RobotRules {
  index: boolean;
  follow: boolean;
  nocache?: boolean;
  googleBot?: {
    index: boolean;
    follow: boolean;
    "max-video-preview": number;
    "max-image-preview": "none" | "standard" | "large";
    "max-snippet": number;
  };
}

export interface OpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface OpenGraphOptions {
  title: string;
  description: string;
  url: string;
  siteName: string;
  locale: string;
  type: "website" | "article" | "profile" | "book";
  images?: OpenGraphImage[];
}

export interface TwitterOptions {
  card: "summary" | "summary_large_image" | "app" | "player";
  title: string;
  description: string;
  images?: string[];
  creator?: string;
}

export interface MetadataOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
  type?: "website" | "article";
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  item: string;
}

export interface ProductPriceOptions {
  price: string;
  priceCurrency: string;
  priceValidUntil?: string;
  availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock" | "https://schema.org/PreOrder";
}
