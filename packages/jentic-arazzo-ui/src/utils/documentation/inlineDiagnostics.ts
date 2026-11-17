import { escapeHtml } from '../escapeHtml';
import type { DiagnosticPath, DiagnosticSeverityName, DocumentDiagnostic } from '../validation';

const severityOrder: DiagnosticSeverityName[] = ['error', 'warning', 'info', 'hint'];

// hints and info (e.g. "summary is recommended") would clutter the docs; they stay in the
// Validation section only
const inlineSeverities = new Set<DiagnosticSeverityName>(['error', 'warning']);

function isUnder(path: DiagnosticPath, prefix: DiagnosticPath): boolean {
  return path.length >= prefix.length && prefix.every((p, i) => path[i] === p);
}

function inlineMessage(diagnostic: DocumentDiagnostic): string {
  // the array index is implied by where the note is shown
  return diagnostic.message.replace(/^"\d+" property /, '');
}

/**
 * Picks the diagnostics worth showing inline for one document element.
 *
 * Semantic (apilint) diagnostics are preferred because JSON Schema `oneOf` failures add
 * noise such as `must have required property "reference"` for every invalid parameter;
 * the full list is still shown in the Validation section.
 */
function pickInline(diagnostics: DocumentDiagnostic[]): DocumentDiagnostic[] {
  const semantic = diagnostics.filter((d) => d.code !== 'json-schema');
  const chosen = semantic.length > 0 ? semantic : diagnostics;
  const seen = new Set<string>();
  return chosen.filter((d) => {
    const key = `${d.severity}:${inlineMessage(d)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Hands out diagnostics to the parts of the docs that render them.
 *
 * Each diagnostic is claimed once, so callers take the most specific paths first
 * (a parameter, then the parameters list, then the step, then the workflow) and
 * anything left over surfaces at the nearest enclosing element.
 */
export class DiagnosticNotes {
  private remaining: DocumentDiagnostic[];

  // every note handed out, for summary badges
  readonly shown: DocumentDiagnostic[] = [];

  constructor(diagnostics: DocumentDiagnostic[] = []) {
    this.remaining = diagnostics.filter((d) => d.path && inlineSeverities.has(d.severity));
  }

  take(prefix: DiagnosticPath): DocumentDiagnostic[] {
    const claimed: DocumentDiagnostic[] = [];
    const rest: DocumentDiagnostic[] = [];
    for (const d of this.remaining) {
      (isUnder(d.path!, prefix) ? claimed : rest).push(d);
    }
    this.remaining = rest;
    const notes = pickInline(claimed);
    this.shown.push(...notes);
    return notes;
  }

  /**
   * Takes notes for each item of a list first, then for the list itself.
   */
  takeList(listPath: DiagnosticPath, keys: (string | number)[]): ListNotes {
    const items = new Map(keys.map((key) => [key, this.take([...listPath, key])]));
    const list = this.take(listPath);
    return { list, items, all: [...list, ...[...items.values()].flat()] };
  }
}

export interface ListNotes {
  list: DocumentDiagnostic[];
  items: Map<string | number, DocumentDiagnostic[]>;
  all: DocumentDiagnostic[];
}

export const emptyListNotes: ListNotes = { list: [], items: new Map(), all: [] };

export function worstSeverity(diagnostics: DocumentDiagnostic[]): DiagnosticSeverityName {
  return severityOrder.find((s) => diagnostics.some((d) => d.severity === s)) ?? 'hint';
}

export function renderNotes(notes: DocumentDiagnostic[] | undefined): string {
  if (!notes || notes.length === 0) return '';
  const rows = notes
    .map(
      (d) =>
        `<div class="step-diagnostic step-diagnostic-${d.severity}"><span class="step-diagnostic-severity">${d.severity}</span><span class="step-diagnostic-message">${escapeHtml(inlineMessage(d))}</span></div>`,
    )
    .join('');
  return `<div class="step-diagnostics">${rows}</div>`;
}

export function renderIssuesBadge(notes: DocumentDiagnostic[]): string {
  if (notes.length === 0) return '';
  const count = notes.length;
  const label = `${count} validation ${count === 1 ? 'issue' : 'issues'}`;
  return ` <span class="step-detail-issues step-detail-issues-${worstSeverity(notes)}" title="${label}">⚠ ${count}</span>`;
}
