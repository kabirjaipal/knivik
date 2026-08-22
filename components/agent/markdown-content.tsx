"use client";

import React, { useMemo } from "react";
import { Marked, RendererObject } from "marked";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const customRenderer: RendererObject = {
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    if (depth === 1 || depth === 2) {
      return `<h3 class="text-sm sm:text-base font-bold text-foreground mt-4 mb-2 tracking-tight">${text}</h3>`;
    }
    if (depth === 3) {
      return `<h4 class="text-xs sm:text-sm font-semibold text-foreground mt-3 mb-1.5 tracking-tight">${text}</h4>`;
    }
    return `<h5 class="text-xs font-semibold text-foreground/90 mt-2 mb-1">${text}</h5>`;
  },
  table(token) {
    const headerHtml = token.header
      .map((cell) => `<th class="px-3.5 py-2.5 font-semibold text-foreground bg-muted/40 border-b border-border/40 text-left">${this.parser.parseInline(cell.tokens)}</th>`)
      .join("");
    const bodyHtml = token.rows
      .map((row) => {
        const cellsHtml = row
          .map((cell) => `<td class="px-3.5 py-2 text-foreground/90 leading-relaxed align-middle">${this.parser.parseInline(cell.tokens)}</td>`)
          .join("");
        return `<tr class="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">${cellsHtml}</tr>`;
      })
      .join("");

    return `
      <div class="my-3 overflow-x-auto rounded-xl border border-border/40 bg-card/40 shadow-xs">
        <table class="w-full text-left text-xs border-collapse font-sans">
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>
    `;
  },
  link({ href, tokens }) {
    const text = this.parser.parseInline(tokens);
    const safeHref = href && /^(https?:\/\/|mailto:|\/)/i.test(href.trim()) ? href.trim() : '#';
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors cursor-pointer break-all">${text}</a>`;
  },
  list(token) {
    const tag = token.ordered ? "ol" : "ul";
    const listClass = token.ordered
      ? "list-decimal list-outside ml-4 space-y-1 my-2 text-xs sm:text-sm text-foreground/90 leading-relaxed"
      : "list-disc list-outside ml-4 space-y-1 my-2 text-xs sm:text-sm text-foreground/90 leading-relaxed";
    const body = token.items
      .map((item) => `<li class="pl-0.5">${this.parser.parse(item.tokens)}</li>`)
      .join("");
    return `<${tag} class="${listClass}">${body}</${tag}>`;
  },
  blockquote({ tokens }) {
    const text = this.parser.parse(tokens);
    return `<blockquote class="border-l-2 border-primary/50 pl-3 my-2 text-xs sm:text-sm italic text-muted-foreground bg-muted/20 py-1 rounded-r-md">${text}</blockquote>`;
  },
  codespan({ text }) {
    return `<code class="px-1.5 py-0.5 rounded bg-muted/50 text-primary font-mono text-xs font-medium border border-border/30">${text}</code>`;
  },
  code({ text, lang }) {
    return `
      <div class="my-2.5 rounded-xl border border-border/40 bg-card/70 overflow-hidden text-xs font-mono shadow-xs">
        ${lang ? `<div class="px-3 py-1 bg-muted/40 border-b border-border/30 text-muted-foreground text-xs font-medium">${lang}</div>` : ""}
        <pre class="p-3 overflow-x-auto custom-scrollbar text-foreground/90 leading-relaxed"><code>${text}</code></pre>
      </div>
    `;
  },
  paragraph({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<p class="text-xs sm:text-sm text-foreground/90 leading-relaxed my-1.5">${text}</p>`;
  },
  strong({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<strong class="font-semibold text-foreground">${text}</strong>`;
  },
  em({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<em class="italic text-foreground/90">${text}</em>`;
  },
  html({ text }) {
    // Strip raw HTML tags to completely neutralize XSS script injection
    return text.replace(/<[^>]*>/g, "");
  },
  image() {
    // Neutralize arbitrary image tags to avoid SSRF or tracking pixel injection
    return "";
  },
  hr() {
    return `<hr class="my-3 border-border/40" />`;
  },
};

const markedInstance = new Marked({
  gfm: true,
  breaks: true,
  renderer: customRenderer,
});

/**
 * Fast, standard-compliant Markdown & GFM Table Renderer using 'marked'
 */
export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  const html = useMemo(() => {
    if (!content) return "";
    try {
      return markedInstance.parse(content) as string;
    } catch (_) {
      return content;
    }
  }, [content]);

  return (
    <div
      className={`space-y-1 text-xs sm:text-sm font-sans leading-normal ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
