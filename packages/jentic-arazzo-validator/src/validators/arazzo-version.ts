import { ArazzoTargetSpecs } from '@speclynx/api-languageservice';
import { isArazzoSpecification1Element, mediaTypes } from '@speclynx/apidom-ns-arazzo-1';
import {
  detect as detectArazzoJSON,
  detectionRegExp as arazzoJSONDetectionRegExp,
} from '@speclynx/apidom-parser-adapter-arazzo-json-1';
import {
  detect as detectArazzoYAML,
  detectionRegExp as arazzoYAMLDetectionRegExp,
  parse as parseArazzoYAML,
} from '@speclynx/apidom-parser-adapter-arazzo-yaml-1';

/**
 * Location and value of the root `arazzo` version field detected in document content.
 *
 * @internal
 */
export interface DetectedArazzoVersion {
  version: string;
  /** offset of the first character of the version (excluding quotes) */
  start: number;
  /** offset just past the last character of the version (excluding quotes) */
  end: number;
  /** every string scalar in the document, in source order */
  scalars: readonly SourceScalar[];
}

/**
 * A string scalar (mapping key or value) and its source range, including any
 * quotes or block scalar indicators.
 *
 * @internal
 */
export interface SourceScalar {
  value: string;
  start: number;
  end: number;
  isKey: boolean;
}

interface SourceElement {
  element?: string;
  content?: unknown;
  startOffset?: number;
  endOffset?: number;
}

const collectScalars = (element: unknown, isKey: boolean, scalars: SourceScalar[]): void => {
  if (element === null || typeof element !== 'object') return;
  const { content, startOffset, endOffset } = element as SourceElement;

  if (typeof content === 'string') {
    if (typeof startOffset === 'number' && typeof endOffset === 'number') {
      scalars.push({ value: content, start: startOffset, end: endOffset, isKey });
    }
  } else if (Array.isArray(content)) {
    for (const item of content) collectScalars(item, false, scalars);
  } else if (content !== null && typeof content === 'object' && 'key' in content) {
    // member element: a key/value pair
    const { key, value } = content as { key: unknown; value: unknown };
    collectScalars(key, true, scalars);
    collectScalars(value, false, scalars);
  }
};

/**
 * Replacement of `content.slice(start, end)` with `text`, in original offsets.
 *
 * @internal
 */
export interface TextEdit {
  start: number;
  end: number;
  text: string;
}

/**
 * Content to hand to the language service, and how to map its offsets back.
 *
 * @internal
 */
export interface PreparedContent {
  content: string;
  /** maps an offset in `content` to the corresponding offset in the original content */
  mapOffset: (offset: number) => number;
}

const compareVersions = (a: string, b: string): number => {
  const as = a.split('.').map(Number);
  const bs = b.split('.').map(Number);
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    const diff = (as[i] ?? 0) - (bs[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

// the bundled rules and JSON Schema target Arazzo 1.0.x; target specs use wildcard
// versions (e.g. `1.0.x`), so concrete versions come from the namespace's media types
const supportedTargetSpecs = ArazzoTargetSpecs.Arazzo10X.filter(
  ({ namespace, version }) => namespace === 'arazzo' && typeof version === 'string',
).map(({ version }) => (version as string).split('.'));

const matchesSupportedTargetSpec = (version: string): boolean => {
  const parts = version.split('.');
  return supportedTargetSpecs.some(
    (spec) =>
      spec.length === parts.length && spec.every((part, i) => part === 'x' || part === parts[i]),
  );
};

/**
 * Arazzo versions that the bundled rules and JSON Schema validation target, in ascending order.
 *
 * @internal
 */
export const supportedArazzoVersions: readonly string[] = [
  ...new Set(
    mediaTypes
      .map((mediaType) => /;version=(\d+\.\d+\.\d+)$/.exec(mediaType)?.[1])
      .filter((version): version is string => version !== undefined)
      .filter(matchesSupportedTargetSpec),
  ),
].sort(compareVersions);

/**
 * Latest Arazzo version that the bundled rules and JSON Schema validation target.
 *
 * @internal
 */
export const latestSupportedArazzoVersion: string = supportedArazzoVersions.at(-1)!;

/**
 * Returns `true` if the given Arazzo version is supported by the bundled rules.
 *
 * @internal
 */
export const isSupportedArazzoVersion = (version: string): boolean =>
  supportedArazzoVersions.includes(version);

// same version shape as the parser adapters' detection regexes
const versionRegExp = /^(?:[1-9]\d*|0)\.(?:[1-9]\d*|0)\.(?:[1-9]\d*|0)$/;

/**
 * Detects an Arazzo document and locates its root `arazzo` version field.
 *
 * The field is located through the parsed document structure, so `arazzo`
 * properties nested elsewhere in the document (e.g. in extensions) are ignored.
 * Arazzo 1.x versions and versions newer than {@link latestSupportedArazzoVersion}
 * (e.g. `2.0.0`) are detected; older versions (e.g. `0.9.0`) are not.
 *
 * @returns detected version info, or `undefined` if content is not an Arazzo document
 * @internal
 */
export async function detectArazzoVersion(
  content: string,
): Promise<DetectedArazzoVersion | undefined> {
  let root: unknown;
  try {
    // YAML 1.2 is a superset of JSON, so this handles both formats
    ({ result: root } = await parseArazzoYAML(content, { sourceMap: true }));
  } catch {
    return undefined;
  }
  if (!isArazzoSpecification1Element(root)) return undefined;

  const element = root.get('arazzo') as
    { content?: unknown; startOffset?: number; endOffset?: number } | undefined;
  const version = element?.content;
  if (typeof version !== 'string' || !versionRegExp.test(version)) return undefined;
  if (typeof element?.startOffset !== 'number' || typeof element?.endOffset !== 'number') {
    return undefined;
  }

  // the source range includes any quotes; require the raw text to be the plain version so
  // the language service's detection regexes can match it
  const raw = content.slice(element.startOffset, element.endOffset);
  const quote = raw[0] === '"' || raw[0] === "'" ? raw[0] : '';
  if (raw !== `${quote}${version}${quote}`) return undefined;

  const isArazzo1 = version.startsWith('1.');
  if (!isArazzo1 && compareVersions(version, latestSupportedArazzoVersion) <= 0) return undefined;

  const scalars: SourceScalar[] = [];
  collectScalars(root, false, scalars);
  scalars.sort((a, b) => a.start - b.start);

  const start = element.startOffset + quote.length;
  return { version, start, end: start + version.length, scalars };
}

/**
 * Applies non-overlapping edits to content.
 *
 * @internal
 */
export function applyEdits(content: string, edits: readonly TextEdit[]): PreparedContent {
  const sorted = [...edits].sort((a, b) => a.start - b.start);
  let result = '';
  let cursor = 0;
  // start of each edit's replacement text in the edited content
  const editedStarts: number[] = [];

  for (const edit of sorted) {
    result += content.slice(cursor, edit.start);
    editedStarts.push(result.length);
    result += edit.text;
    cursor = edit.end;
  }
  result += content.slice(cursor);

  const mapOffset = (offset: number): number => {
    // difference between original and edited offsets after the last edit passed
    let shift = 0;
    for (let i = 0; i < sorted.length; i++) {
      const edit = sorted[i];
      const editedStart = editedStarts[i];
      const editedEnd = editedStart + edit.text.length;
      if (offset < editedStart) break;
      if (offset < editedEnd) {
        // inside the replacement: clamp to the replaced original text
        return Math.min(edit.start + (offset - editedStart), edit.end);
      }
      shift = edit.end - editedEnd;
    }
    return offset + shift;
  };

  return { content: result, mapOffset };
}

// equivalent JSON/YAML spelling of the `arazzo` key that the detection regexes don't match
const NEUTRALIZED_KEY = '"\\u0061razzo"';

/**
 * Edit that stops a detection regex match at `matchStart` from matching without
 * changing the parsed document, or `undefined` if no such edit is known.
 *
 * - an `arazzo` mapping key is respelled with a unicode escape;
 * - text inside any other string scalar (e.g. a single-quoted, plain or block
 *   scalar containing JSON) is replaced by the same value as a double-quoted scalar,
 *   whose escaped inner quotes the regexes can't match;
 * - text inside a YAML comment is changed in place, since comments aren't data.
 */
const neutralizeMatch = (
  content: string,
  scalars: readonly SourceScalar[],
  matchStart: number,
): TextEdit | undefined => {
  const scalar = scalars.find(({ start, end }) => start <= matchStart && matchStart < end);

  if (scalar !== undefined) {
    if (scalar.isKey && scalar.value === 'arazzo') {
      return { start: scalar.start, end: scalar.end, text: NEUTRALIZED_KEY };
    }
    // a JSON string literal is a valid YAML double-quoted scalar with the same value
    return { start: scalar.start, end: scalar.end, text: JSON.stringify(scalar.value) };
  }

  // outside every scalar, the only text a match can start in is a YAML comment
  const lineStart = content.lastIndexOf('\n', matchStart - 1) + 1;
  if (!/(?:^|\s)#/.test(content.slice(lineStart, matchStart))) return undefined;
  const keyStart = content.indexOf('arazzo', matchStart);
  return { start: keyStart, end: keyStart + 1, text: 'A' };
};

/**
 * Prepares content for the language service so that it validates the document
 * as `targetVersion`, using the root `arazzo` field.
 *
 * The language service detects the version with a regex and uses the first match,
 * which may be an `arazzo` property nested before the root field, or JSON-looking
 * text in a YAML scalar or comment. Every such earlier match is neutralized without
 * changing the parsed document (see {@link neutralizeMatch}), and the root version
 * is replaced with `targetVersion` if it differs.
 *
 * @returns the prepared content, or `undefined` if the language service wouldn't
 * recognize it as an Arazzo document
 * @internal
 */
export async function prepareForLanguageService(
  content: string,
  detected: DetectedArazzoVersion,
  targetVersion: string,
): Promise<PreparedContent | undefined> {
  const edits: TextEdit[] = [];
  if (detected.version !== targetVersion) {
    edits.push({ start: detected.start, end: detected.end, text: targetVersion });
  }

  // each iteration neutralizes one earlier match, so this ends after one pass over them
  for (;;) {
    const prepared = applyEdits(content, edits);
    let regExp: RegExp;
    if (await detectArazzoJSON(prepared.content)) {
      regExp = arazzoJSONDetectionRegExp;
    } else if (await detectArazzoYAML(prepared.content)) {
      regExp = arazzoYAMLDetectionRegExp;
    } else {
      return undefined;
    }

    const match = prepared.content.match(regExp);
    if (match === null || match.index === undefined) return undefined;

    const version = match.groups?.version_json ?? match.groups?.version_yaml;
    if (version === undefined) return undefined;
    // the `arazzo` key contains no digits, so the first occurrence is the value
    const versionStart = prepared.mapOffset(match.index + match[0].indexOf(version));
    if (versionStart === detected.start) return prepared;
    // a later match can't be found before the root field has been matched
    if (versionStart > detected.start) return undefined;

    // matches before the root field lie outside every edit, so they map back exactly
    const edit = neutralizeMatch(content, detected.scalars, prepared.mapOffset(match.index));
    if (edit === undefined) return undefined;
    edits.push(edit);
  }
}
