import { RequestBody } from '../../types/arazzo';

export interface RequestBodyReplacementView {
  target: string;
  value: string;
  arrow: '←' | '=';
}

export interface RequestBodyView {
  contentType?: string;
  payload?: string;
  isJsonPayload: boolean;
  replacements: RequestBodyReplacementView[];
}

/**
 * Normalizes a step's requestBody for display, shared by the docs and diagram views.
 * Returns undefined when there is nothing to show.
 */
export function getRequestBodyView(requestBody?: RequestBody): RequestBodyView | undefined {
  if (!requestBody) return undefined;

  const hasPayload = requestBody.payload !== undefined && requestBody.payload !== null;
  const isString = typeof requestBody.payload === 'string';
  const replacements = (requestBody.replacements ?? []).map((r) => {
    const value = typeof r.value === 'string' ? r.value : JSON.stringify(r.value);
    return {
      target: r.target,
      value,
      arrow: value.startsWith('$') ? ('←' as const) : ('=' as const),
    };
  });

  if (!hasPayload && !requestBody.contentType && replacements.length === 0) return undefined;

  return {
    contentType: requestBody.contentType,
    payload: hasPayload
      ? isString
        ? (requestBody.payload as string)
        : JSON.stringify(requestBody.payload, null, 2)
      : undefined,
    isJsonPayload: hasPayload && !isString,
    replacements,
  };
}
