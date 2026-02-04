import {
  Resolver,
  File,
  ResolverError,
  type ResolverOptions,
  type FileOptions,
} from '@speclynx/apidom-reference/configuration/empty';

export type { Resolver, ResolverOptions };
export type { File, FileOptions };

/**
 * @public
 */
class MemoryResolver extends Resolver {
  declare arazzoDocument?: string;
  declare openapiDocument?: string;

  constructor() {
    super({ name: 'memory' });
  }

  canRead(file: File): boolean {
    return file.uri.startsWith('memory://') && this.getDocument() !== undefined;
  }

  async read(file: File): Promise<Buffer> {
    try {
      const encoder = new TextEncoder();
      return encoder.encode(this.getDocument()) as unknown as Buffer;
    } catch (error: unknown) {
      throw new ResolverError(`Error opening file "${file.uri}"`, { cause: error });
    }
  }

  private getDocument(): string | undefined {
    return this.arazzoDocument ?? this.openapiDocument;
  }
}

export default MemoryResolver;
