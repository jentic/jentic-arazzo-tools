import { assert } from 'chai';

import { magicNumber } from '../src/index.ts';

describe('dummy test', function () {
  specify('should export magicNumber', function () {
    assert.strictEqual(magicNumber, 42);
  });
});
