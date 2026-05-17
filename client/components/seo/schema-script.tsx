import React from "react";

interface SchemaScriptProps {
  schema: Record<string, any>;
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
        __html: JSON.stringify(schema),
      }}
    />
  );
}
