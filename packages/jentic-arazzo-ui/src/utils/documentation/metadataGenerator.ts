import { ArazzoDocument } from '../../types/arazzo';
import { DocumentationMetadata } from '../../types/viewer';

/**
 * Extracts document metadata for documentation header
 */
export function generateMetadata(document: ArazzoDocument): DocumentationMetadata {
  return {
    title: document.info.title,
    version: document.info.version,
    arazzoVersion: document.arazzo,
    summary: document.info.summary,
    description: document.info.description,
    sourceDescriptions: (document.sourceDescriptions || []).map((sd) => ({
      name: sd.name,
      url: sd.url,
      type: sd.type,
    })),
  };
}
