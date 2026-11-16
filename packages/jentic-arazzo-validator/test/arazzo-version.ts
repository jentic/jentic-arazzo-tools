import { assert } from 'chai';
import { detectionRegExp as jsonDetectionRegExp } from '@speclynx/apidom-parser-adapter-arazzo-json-1';
import { detectionRegExp as yamlDetectionRegExp } from '@speclynx/apidom-parser-adapter-arazzo-yaml-1';

import {
  applyEdits,
  detectArazzoVersion,
  prepareForLanguageService,
} from '../src/validators/arazzo-version.ts';

// offsets of every occurrence of a substring, in order
const occurrences = (text: string, search: string): number[] => {
  const found: number[] = [];
  for (let i = text.indexOf(search); i !== -1; i = text.indexOf(search, i + 1)) found.push(i);
  return found;
};

describe('arazzo-version', function () {
  const documents = {
    'YAML unquoted': 'arazzo: 1.1.0 # comment\ninfo: {}\n',
    'YAML quoted': "arazzo: '1.1.0'\ninfo: {}\n",
    'JSON minified': '{"arazzo":"1.1.0","info":{"title":"t"},"workflows":[]}',
    'JSON pretty': '{\n  "arazzo": "1.1.0",\n  "info": {}\n}',
    'JSON nested before root':
      '{"x-example":{"arazzo":"1.0.1"},"x-other":{"arazzo":"2.0.0"},"arazzo":"1.1.0","info":{}}',
    'YAML flow nested before root':
      'x-example: {"arazzo": "1.0.1"}\nx-other: {arazzo: 2.0.0}\narazzo: 1.1.0\ninfo: {}\n',
  };

  describe('detectArazzoVersion', function () {
    specify('should locate the root field, ignoring nested arazzo properties', async function () {
      for (const [name, content] of Object.entries(documents)) {
        const detected = await detectArazzoVersion(content);
        assert.isDefined(detected, name);
        assert.equal(detected!.version, '1.1.0', name);
        assert.equal(content.slice(detected!.start, detected!.end), '1.1.0', name);
      }
    });

    specify('should ignore documents with only a nested arazzo property', async function () {
      const content = '{"openapi":"3.1.0","x-arazzo":{"arazzo":"1.0.1"}}';
      assert.isUndefined(await detectArazzoVersion(content));
    });

    specify('should ignore versions older than the supported ones', async function () {
      assert.isUndefined(await detectArazzoVersion('arazzo: 0.9.0\n'));
    });
  });

  describe('applyEdits', function () {
    const content = 'abcdefghij';
    const edits = [
      { start: 1, end: 3, text: 'XYZW' }, // longer
      { start: 5, end: 8, text: 'Q' }, // shorter
    ];

    specify('should apply edits', function () {
      assert.equal(applyEdits(content, edits).content, 'aXYZWdeQij');
    });

    specify('should map offsets outside edits back exactly', function () {
      const { mapOffset } = applyEdits(content, edits);
      // edited offset -> original offset for every character outside the edits
      const expected: Record<number, number> = { 0: 0, 5: 3, 6: 4, 8: 8, 9: 9, 10: 10 };
      for (const [edited, original] of Object.entries(expected)) {
        assert.equal(mapOffset(Number(edited)), original, `offset ${edited}`);
      }
    });

    specify('should clamp offsets inside edits to the replaced text', function () {
      const { mapOffset } = applyEdits(content, edits);
      assert.equal(mapOffset(1), 1);
      assert.equal(mapOffset(2), 2);
      assert.equal(mapOffset(3), 3);
      assert.equal(mapOffset(4), 3);
      assert.equal(mapOffset(7), 5);
    });
  });

  describe('prepareForLanguageService', function () {
    // shorter, equal and longer replacement versions
    for (const target of ['1.0.1', '1.1.0', '1.0.10', '1.100.200']) {
      for (const [name, content] of Object.entries(documents)) {
        specify(`should map ${name} offsets back when targeting ${target}`, async function () {
          const detected = (await detectArazzoVersion(content))!;
          const prepared = (await prepareForLanguageService(content, detected, target))!;
          assert.isDefined(prepared, name);

          // landmarks outside the edits map back onto the same landmarks
          for (const landmark of ['info', 'x-other', '{', '}', '\n']) {
            const edited = occurrences(prepared.content, landmark);
            const original = occurrences(content, landmark);
            assert.lengthOf(edited, original.length, landmark);
            edited.forEach((offset, k) => {
              assert.equal(prepared.mapOffset(offset), original[k], `${landmark} #${k}`);
              assert.equal(
                prepared.mapOffset(offset + landmark.length),
                original[k] + landmark.length,
              );
            });
          }

          // the root version maps back onto the original root version
          const rootStart = prepared.content.lastIndexOf(target);
          assert.equal(prepared.mapOffset(rootStart), detected.start);
          assert.equal(prepared.mapOffset(rootStart + target.length), detected.end);
        });
      }
    }

    specify('should make the root field the one the language service detects', async function () {
      for (const [name, content] of Object.entries(documents)) {
        const detected = (await detectArazzoVersion(content))!;
        const prepared = (await prepareForLanguageService(content, detected, '1.0.1'))!;

        const isJSON = name.startsWith('JSON');
        const match = prepared.content.match(isJSON ? jsonDetectionRegExp : yamlDetectionRegExp);
        assert.isNotNull(match, name);
        const version = match!.groups!.version_json ?? match!.groups!.version_yaml;
        assert.equal(version, '1.0.1', name);
        const versionStart = match!.index! + match![0].indexOf(version);
        assert.equal(prepared.mapOffset(versionStart), detected.start, name);
      }
    });

    specify('should keep the parsed data identical apart from the root version', async function () {
      const content = documents['JSON nested before root'];
      const detected = (await detectArazzoVersion(content))!;
      const prepared = (await prepareForLanguageService(content, detected, '1.1.0'))!;

      assert.notEqual(prepared.content, content);
      assert.deepEqual(JSON.parse(prepared.content), JSON.parse(content));
    });
  });
});
