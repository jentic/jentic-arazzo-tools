import { assert } from 'chai';

import { createTextDocument } from '../src/index.ts';
import {
  createVersionPositionMapper,
  detectArazzoVersion,
  replaceArazzoVersion,
} from '../src/validators/arazzo-version.ts';

describe('arazzo-version', function () {
  const documents = {
    'YAML unquoted': 'arazzo: 1.1.0 # comment\ninfo: {}\n',
    'YAML quoted': "arazzo: '1.1.0'\ninfo: {}\n",
    'JSON minified': '{"arazzo":"1.1.0","info":{"title":"t"},"workflows":[]}',
    'JSON pretty': '{\n  "arazzo": "1.1.0",\n  "info": {}\n}',
  };

  describe('replaceArazzoVersion', function () {
    specify('should replace only the version, keeping quotes', async function () {
      const content = "arazzo: '1.1.0'\ninfo:\n  version: '1.1.0'\n";
      const detected = await detectArazzoVersion(content);
      assert.equal(
        replaceArazzoVersion(content, detected!, '1.0.10'),
        "arazzo: '1.0.10'\ninfo:\n  version: '1.1.0'\n",
      );
    });
  });

  describe('createVersionPositionMapper', function () {
    // shorter, equal and longer replacement versions
    for (const target of ['1.0', '1.0.1', '1.0.10', '10.20.30']) {
      for (const [name, content] of Object.entries(documents)) {
        specify(
          `should map ${name} positions back when replacing with ${target}`,
          async function () {
            const detected = (await detectArazzoVersion(content))!;
            const original = createTextDocument('memory://a', content);
            const rewritten = createTextDocument(
              'memory://a',
              replaceArazzoVersion(content, detected, target),
            );
            const mapPosition = createVersionPositionMapper(original, detected, target);
            const delta = target.length - detected.version.length;

            // every character outside the replaced value maps back to the same character
            for (let offset = 0; offset <= content.length; offset++) {
              if (offset > detected.start && offset < detected.end) continue;
              const rewrittenOffset = offset >= detected.end ? offset + delta : offset;
              assert.deepEqual(
                mapPosition(rewritten.positionAt(rewrittenOffset)),
                original.positionAt(offset),
                `offset ${offset}`,
              );
            }

            // positions inside the replaced value stay within the original version
            const versionStart = original.positionAt(detected.start);
            const versionEnd = original.positionAt(detected.end);
            for (let offset = detected.start; offset <= detected.start + target.length; offset++) {
              const mapped = mapPosition(rewritten.positionAt(offset));
              assert.equal(mapped.line, versionStart.line);
              assert.isAtLeast(mapped.character, versionStart.character);
              assert.isAtMost(mapped.character, versionEnd.character);
            }
          },
        );
      }
    }
  });
});
