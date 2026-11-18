import type { StepOperation } from '../types/viewer';

export interface StepOperationLabel {
  /** name of the source description the step targets, when the reference names one */
  sourceName?: string;
  /** operation name (operationId) or path (operationPath) for display */
  label: string;
}

const SOURCE_EXPRESSION = /^\$sourceDescriptions\.([^.]+)\.(.+)$/;
const SOURCE_URL_EXPRESSION = /^\{\$sourceDescriptions\.([^.}]+)\.url\}/;

/**
 * Decodes the path an `operationPath` JSON pointer targets, e.g.
 * `...#/paths/~1pet~1findByStatus/get` → `/pet/findByStatus`.
 */
function pathFromPointer(operationPath: string): string | undefined {
  const hashIdx = operationPath.indexOf('#');
  if (hashIdx < 0) return undefined;
  const tokens = operationPath
    .slice(hashIdx + 1)
    .split('/')
    .slice(1)
    .map((token) => {
      let decoded = token;
      try {
        decoded = decodeURIComponent(token);
      } catch {
        // keep the raw token when it isn't valid percent-encoding
      }
      // ~1 must be replaced before ~0 (RFC 6901)
      return decoded.replace(/~1/g, '/').replace(/~0/g, '~');
    });
  return tokens[0] === 'paths' && tokens[1] ? tokens[1] : undefined;
}

/**
 * Describes the operation an Arazzo step targets, for display. Handles both
 * `operationId` forms (`$sourceDescriptions.{name}.{id}` and `{name}.{id}`) and
 * `operationPath` (`{$sourceDescriptions.{name}.url}#{pointer}`), preferring the
 * resolved operation's path when the parser located it.
 */
export function describeStepOperation(
  step: { operationId?: string; operationPath?: string },
  options: { operation?: StepOperation; sourceNames?: Iterable<string> } = {},
): StepOperationLabel | undefined {
  const { operation, sourceNames } = options;

  if (step.operationId) {
    const id = step.operationId;
    const expression = SOURCE_EXPRESSION.exec(id);
    if (expression) return { sourceName: expression[1], label: expression[2] };
    // `{name}.{id}` only when {name} is a known source - operationIds may contain dots
    const dotIdx = id.indexOf('.');
    if (dotIdx > 0 && sourceNames) {
      const candidate = id.slice(0, dotIdx);
      if (new Set(sourceNames).has(candidate)) {
        return { sourceName: candidate, label: id.slice(dotIdx + 1) };
      }
    }
    return { label: id };
  }

  if (step.operationPath) {
    const sourceName = SOURCE_URL_EXPRESSION.exec(step.operationPath)?.[1];
    const label = operation?.path ?? pathFromPointer(step.operationPath) ?? step.operationPath;
    return { sourceName, label };
  }

  return undefined;
}
