import { assert } from 'chai';

import { magicConstant } from '../src/index.ts';

describe('magicConstant', function () {
  specify('should equal 42', function () {
    assert.strictEqual(magicConstant, 42);
  });
});
