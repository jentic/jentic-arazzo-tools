const MERMAID_ENTITIES: Record<string, string> = {
  '#': '#35;',
  ';': '#59;',
  '"': '#quot;',
};

/**
 * Escapes characters mermaid treats as syntax in message and node label text
 * (`#` starts an entity, `;` ends a statement, `"` closes a quoted label).
 * Single pass, so the `;` of an inserted entity is never re-escaped.
 */
export function escapeMermaidText(text: string): string {
  return text.replace(/[#;"]/g, (char) => MERMAID_ENTITIES[char]);
}
