import { RequestBody } from '../../types/arazzo';

export type RequestBodyLanguage = 'json' | 'xml' | 'yaml';

export interface KeyValueRowView {
  key: string;
  value: string;
}

export type RequestBodyPayloadView =
  | { kind: 'code'; text: string; language?: RequestBodyLanguage }
  | { kind: 'form'; fields: KeyValueRowView[] };

export interface RequestBodyView {
  contentType?: string;
  payload?: RequestBodyPayloadView;
  replacements: KeyValueRowView[];
}

const toKeyValueRow = (key: string, value: unknown): KeyValueRowView => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return { key, value: text };
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

type ContentTypeKind = RequestBodyLanguage | 'form' | undefined;

const getContentTypeKind = (contentType?: string): ContentTypeKind => {
  const mediaType = contentType?.split(';')[0].trim().toLowerCase();
  if (!mediaType) return undefined;
  if (mediaType === 'application/x-www-form-urlencoded' || mediaType === 'multipart/form-data') {
    return 'form';
  }
  if (/[/+]json$/.test(mediaType)) return 'json';
  if (/[/+]xml$/.test(mediaType)) return 'xml';
  if (/[/+-]ya?ml$/.test(mediaType)) return 'yaml';
  return undefined;
};

const YAML_PLAIN_SCALAR = /^[A-Za-z_$][\w$./-]*$/;
const YAML_RESERVED = /^(true|false|null|yes|no|on|off|y|n|~)$/i;

const yamlScalar = (value: unknown): string => {
  if (typeof value !== 'string') return JSON.stringify(value) ?? 'null';
  return YAML_PLAIN_SCALAR.test(value) && !YAML_RESERVED.test(value)
    ? value
    : JSON.stringify(value);
};

/**
 * Minimal YAML serializer for already-parsed JSON-compatible payloads, so a YAML
 * requestBody is shown as YAML rather than being re-rendered as JSON.
 */
const toYaml = (value: unknown, indent = 0): string => {
  const pad = '  '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`;
    return value
      .map((item) => {
        if (item !== null && typeof item === 'object') {
          const nested = toYaml(item, indent + 1);
          return `${pad}- ${nested.trimStart()}`;
        }
        return `${pad}- ${yamlScalar(item)}`;
      })
      .join('\n');
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return `${pad}{}`;
    return entries
      .map(([key, item]) => {
        const k = yamlScalar(key);
        if (item !== null && typeof item === 'object') {
          const empty = Array.isArray(item) ? item.length === 0 : Object.keys(item).length === 0;
          if (empty) return `${pad}${k}: ${Array.isArray(item) ? '[]' : '{}'}`;
          return `${pad}${k}:\n${toYaml(item, indent + 1)}`;
        }
        return `${pad}${k}: ${yamlScalar(item)}`;
      })
      .join('\n');
  }
  return `${pad}${yamlScalar(value)}`;
};

const getPayloadView = (
  payload: unknown,
  contentType?: string,
): RequestBodyPayloadView | undefined => {
  if (payload === undefined || payload === null) return undefined;
  const kind = getContentTypeKind(contentType);

  if (kind === 'form') {
    if (isPlainObject(payload)) {
      return {
        kind: 'form',
        fields: Object.entries(payload).map(([key, value]) => toKeyValueRow(key, value)),
      };
    }
    if (typeof payload === 'string') {
      const fields = Array.from(new URLSearchParams(payload).entries()).map(([key, value]) =>
        toKeyValueRow(key, value),
      );
      if (fields.length > 0) return { kind: 'form', fields };
    }
    return {
      kind: 'code',
      text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
    };
  }

  if (typeof payload === 'string') {
    return { kind: 'code', text: payload, language: kind };
  }
  // xml cannot be derived from a parsed object, and json would imply every value is a string
  // literal, so show parsed object payloads as yaml (the contentType conveys the wire format)
  return { kind: 'code', text: toYaml(payload), language: 'yaml' };
};

/**
 * Normalizes a step's requestBody for display, shared by the docs and diagram views.
 * Returns undefined when there is nothing to show.
 */
export function getRequestBodyView(requestBody?: RequestBody): RequestBodyView | undefined {
  if (!requestBody) return undefined;

  const payload = getPayloadView(requestBody.payload, requestBody.contentType);
  const replacements = (requestBody.replacements ?? []).map((r) =>
    toKeyValueRow(r.target, r.value),
  );

  if (!payload && !requestBody.contentType && replacements.length === 0) return undefined;

  return { contentType: requestBody.contentType, payload, replacements };
}
