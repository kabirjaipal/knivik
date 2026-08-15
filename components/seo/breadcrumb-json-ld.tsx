import React from "react";
import { SchemaService, BreadcrumbItem } from "@/lib/seo";
import { SchemaScript } from "./schema-script";

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb Schema script injector. Highly optimal for subpages
 * like pricing, dynamic landing pages, contact hubs, or terms.
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = SchemaService.generateBreadcrumbsSchema(items);
  return <SchemaScript schema={schema} />;
}
