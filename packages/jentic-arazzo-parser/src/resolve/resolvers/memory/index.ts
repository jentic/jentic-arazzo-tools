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

  constructor() {
    super({ name: 'memory' });
  }

  canRead(file: File): boolean {
    return file.uri.startsWith('memory://') && typeof this.arazzoDocument === 'string';
  }

  async read(file: File): Promise<Buffer> {
    try {
      const encoder = new TextEncoder();
      return encoder.encode(this.arazzoDocument) as unknown as Buffer;
    } catch (error: unknown) {
      throw new ResolverError(`Error opening file "${file.uri}"`, { cause: error });
    }
  }
}

export default MemoryResolver;
