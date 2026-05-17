import React from "react";
import { SchemaService } from "@/lib/seo/application/schema.service";
import { SchemaScript } from "./schema-script";
import { BreadcrumbItem } from "@/lib/seo/domain/seo.types";

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
