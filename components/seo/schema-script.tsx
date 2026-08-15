import React from "react";

interface SchemaScriptProps {
  schema: Record<string, any>;
  id?: string;
}

/**
 * Escapes script tag characters to prevent HTML tag boundary injection (XSS)
 * within inline JSON-LD script blocks.
 */
function safeJsonStringify(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\//g, "\\u002f")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Presentation component that injects a valid JSON-LD schema block
 * directly into the SSR document for 0ms delay crawler extraction.
 */
export function SchemaScript({ schema, id }: SchemaScriptProps) {
  const scriptId = id || `schema-${schema["@type"] || "ld-json"}`;
  return (
    <script
      id={scriptId}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonStringify(schema),
      }}
    />
  );
}

