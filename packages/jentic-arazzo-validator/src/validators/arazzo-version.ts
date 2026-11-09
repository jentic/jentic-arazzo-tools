import { ArazzoTargetSpecs } from '@speclynx/apidom-ls';
import {
  detect as detectArazzoJSON,
  detectionRegExp as arazzoJSONDetectionRegExp,
} from '@speclynx/apidom-parser-adapter-arazzo-json-1';
import {
  detect as detectArazzoYAML,
  detectionRegExp as arazzoYAMLDetectionRegExp,
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

/**
 * Arazzo versions that the bundled rules and JSON Schema validation target, in ascending order.
 *
 * @internal
 */
export const supportedArazzoVersions: readonly string[] = [
  ...new Set(
    ArazzoTargetSpecs.Arazzo.filter(
      ({ namespace, version }) =>
        namespace === 'arazzo' && typeof version === 'string' && /^\d+\.\d+\.\d+$/.test(version),
    ).map(({ version }) => version as string),
  ),
].sort(compareVersions);

/**
 * Latest Arazzo version that the bundled rules and JSON Schema validation target.
 *
 * @internal
 */
export const latestSupportedArazzoVersion: string = supportedArazzoVersions.at(-1)!;

/**
 * Detects an Arazzo document and locates its root `arazzo` version field.
 *
 * Uses the same detection as the language service so that the located version
 * is exactly the one the language service will validate against.
 *
 * @returns detected version info, or `undefined` if content is not an Arazzo document
 * @internal
 */
export async function detectArazzoVersion(
  content: string,
): Promise<DetectedArazzoVersion | undefined> {
  let match: RegExpMatchArray | null = null;

  if (await detectArazzoJSON(content)) {
    match = content.match(arazzoJSONDetectionRegExp);
  } else if (await detectArazzoYAML(content)) {
    match = content.match(arazzoYAMLDetectionRegExp);
  }

  if (match === null || match.index === undefined) return undefined;

  const version = match.groups?.version_json ?? match.groups?.version_yaml;
  if (version === undefined) return undefined;

  // the `arazzo` key contains no digits, so the first occurrence is the value
  const start = match.index + match[0].indexOf(version);

  return { version, start, end: start + version.length };
}

/**
 * Returns `true` if the given Arazzo version is supported by the bundled rules.
 *
 * @internal
 */
export const isSupportedArazzoVersion = (version: string): boolean =>
  supportedArazzoVersions.includes(version);

/**
 * Rewrites the root `arazzo` version field to `targetVersion` without shifting
 * any other character offsets, so diagnostics produced for the rewritten content
 * map 1:1 onto the original content.
 *
 * The replacement value is padded with trailing whitespace placed after any closing quote.
 *
 * @internal
 */
export function replaceArazzoVersion(
  content: string,
  detected: DetectedArazzoVersion,
  targetVersion: string,
): string {
  const { start, end, version } = detected;
  if (targetVersion.length > version.length) {
    throw new RangeError(
      `Cannot replace Arazzo version "${version}" with longer version "${targetVersion}"`,
    );
  }

  const openingChar = content[start - 1];
  const closingChar = content[end];
  const isQuoted = (openingChar === '"' || openingChar === "'") && closingChar === openingChar;
  const valueEnd = isQuoted ? end + 1 : end;
  const padding = ' '.repeat(version.length - targetVersion.length);

  return (
    content.slice(0, start) +
    targetVersion +
    content.slice(end, valueEnd) +
    padding +
    content.slice(valueEnd)
  );
}
