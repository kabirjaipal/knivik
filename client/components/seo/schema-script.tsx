import React from "react";

interface SchemaScriptProps {
  schema: Record<string, any>;
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
 * Safe, light presentation component that injects a schema block
 * directly inside the document. It compiles perfectly in both Server
 * and Client contexts.
 */
export function SchemaScript({ schema }: SchemaScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonStringify(schema),
      }}
    />
  );
}
