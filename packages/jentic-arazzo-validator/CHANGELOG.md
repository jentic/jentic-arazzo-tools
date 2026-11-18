# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.34](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.33...v1.0.0-alpha.34) (2026-11-18)

### Bug Fixes

- **validator:** ignore step workflowId refs in uniqueness check ([feb550c](https://github.com/jentic/jentic-arazzo-tools/commit/feb550c7907ae3548106c2f46bdc59262e399c52)), closes [#360](https://github.com/jentic/jentic-arazzo-tools/issues/360)
- **validator:** keep scalar values when hiding earlier arazzo matches ([ec8f710](https://github.com/jentic/jentic-arazzo-tools/commit/ec8f710fc2def3eddb94a1bed446f2fedd147705))
- **validator:** map related information back to original positions ([2dabb8d](https://github.com/jentic/jentic-arazzo-tools/commit/2dabb8d141ed59fef67e5cceb0db6d862603f859))
- **validator:** pin apidom-ls to 2.11.6 so fresh installs validate ([4550d2d](https://github.com/jentic/jentic-arazzo-tools/commit/4550d2ddb395b4c2cbe42e25e348134e22b41ece)), closes [#351](https://github.com/jentic/jentic-arazzo-tools/issues/351)
- **validator:** print MarkupContent messages as text in JSON output ([f619947](https://github.com/jentic/jentic-arazzo-tools/commit/f6199473666f2f497a8b3a4fbfd0439adebdac11))
- **validator:** remap positions instead of padding version rewrite ([b23f340](https://github.com/jentic/jentic-arazzo-tools/commit/b23f3406a4568c87165d62659123366477e3226c))
- **validator:** report and validate unsupported Arazzo versions ([f83a695](https://github.com/jentic/jentic-arazzo-tools/commit/f83a69557c25cd533351a927c36bad1bad1e1093))
- **validator:** restore expression type rules, guard fresh installs ([9d8e7d6](https://github.com/jentic/jentic-arazzo-tools/commit/9d8e7d62505f45f83b9ba37879b78e609590f314))
- **validator:** treat future major Arazzo versions as unsupported ([01eb576](https://github.com/jentic/jentic-arazzo-tools/commit/01eb57678429c548354efd4e59b6b010258455ed))
- **validator:** use the root arazzo field, not nested ones ([195fe7b](https://github.com/jentic/jentic-arazzo-tools/commit/195fe7b6ef5c4842d1ff5869d86489db98f937f1))
- **validator:** validate Arazzo documents on fresh installs ([c00553f](https://github.com/jentic/jentic-arazzo-tools/commit/c00553f3be201f7c8d222789141df49566ae65e0)), closes [#351](https://github.com/jentic/jentic-arazzo-tools/issues/351)

### Features

- **validator:** add option to ignore unsupported Arazzo versions ([069cfc6](https://github.com/jentic/jentic-arazzo-tools/commit/069cfc6eb77b27b249e02a3a5fe55287684ca7ce))

### Performance Improvements

- **validator:** neutralize earlier arazzo matches in one pass ([1ef091c](https://github.com/jentic/jentic-arazzo-tools/commit/1ef091c3a94d883e26f40cb9284bdeb422e7c06e))

### BREAKING CHANGES

- **validator:** public types now come from ApiDOM 7 and
  @speclynx/api-languageservice 3. The validator's re-exported Diagnostic
  is from vscode-languageserver-types 3.18.5, where `message` is
  `string | MarkupContent`. LanguageServiceContext is the
  api-languageservice 3 type, whose JSON Schema validation providers no
  longer accept a schema of their own. Elements returned by the parser,
  resolver and runner are ApiDOM 7 elements, subject to its breaking
  changes. Documents declaring Arazzo 1.1 used to pass without being
  checked. They are now validated and rejected, as rule 9020102 only
  allows 1.0.x.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

# [1.0.0-alpha.33](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.32...v1.0.0-alpha.33) (2026-11-09)

**Note:** Version bump only for package @jentic/arazzo-validator

# [1.0.0-alpha.32](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.31...v1.0.0-alpha.32) (2026-07-21)

### Bug Fixes

- **validator:** bump @speclynx/apidom-ls to 2.11.6 ([#282](https://github.com/jentic/jentic-arazzo-tools/issues/282)) ([ec63fe6](https://github.com/jentic/jentic-arazzo-tools/commit/ec63fe6bfa3698663e5ad4087f6abdfe813294f2))

# [1.0.0-alpha.31](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.30...v1.0.0-alpha.31) (2026-05-19)

**Note:** Version bump only for package @jentic/arazzo-validator

# [1.0.0-alpha.30](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.29...v1.0.0-alpha.30) (2026-04-04)

### Bug Fixes

- **validator:** anchor contentType MIME regex and support parameters ([b912017](https://github.com/jentic/jentic-arazzo-tools/commit/b91201731f0e2d8e96986a20b03806a8980aedbc))
- **validator:** detect non-Arazzo documents ([#194](https://github.com/jentic/jentic-arazzo-tools/issues/194)) ([0152fec](https://github.com/jentic/jentic-arazzo-tools/commit/0152fec747c9f3bd5cf0fc300bbf24eb95430a62))
- **validator:** make script tag lint rule case-insensitive ([5f1e7f8](https://github.com/jentic/jentic-arazzo-tools/commit/5f1e7f8056572318a21b99a7061e7377d2f5eb09))

### Features

- **validator:** add comprehensive Arazzo specification lint rules ([4697c5c](https://github.com/jentic/jentic-arazzo-tools/commit/4697c5c3ccc94ab10032d22c69c4c457ec4cde50))
- **validator:** show full range in CLI formatters ([#193](https://github.com/jentic/jentic-arazzo-tools/issues/193)) ([d7a3145](https://github.com/jentic/jentic-arazzo-tools/commit/d7a314530d94fd6f56b4c83b7c738d44c30703f2))

# [1.0.0-alpha.29](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.28...v1.0.0-alpha.29) (2026-03-19)

**Note:** Version bump only for package @jentic/arazzo-validator

# [1.0.0-alpha.28](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.27...v1.0.0-alpha.28) (2026-03-19)

**Note:** Version bump only for package @jentic/arazzo-validator

# [1.0.0-alpha.27](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.26...v1.0.0-alpha.27) (2026-03-12)

### Bug Fixes

- **release:** override minimatch 10.2.3 to fix glob pattern regression in lerna publish ([#143](https://github.com/jentic/jentic-arazzo-tools/issues/143)) ([829f1cf](https://github.com/jentic/jentic-arazzo-tools/commit/829f1cf3d4376b407e4ef2391e155f8e60e1a7d4)), closes [lerna/lerna#4305](https://github.com/lerna/lerna/issues/4305) [isaacs/minimatch#284](https://github.com/isaacs/minimatch/issues/284)

# [1.0.0-alpha.26](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.25...v1.0.0-alpha.26) (2026-03-11)

### Bug Fixes

- **parser:** add consistent naming for exported options ([#134](https://github.com/jentic/jentic-arazzo-tools/issues/134)) ([cfa2a54](https://github.com/jentic/jentic-arazzo-tools/commit/cfa2a54fad0189da7d26ca4c76b63bfcc3c60eec))

# [1.0.0-alpha.25](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.24...v1.0.0-alpha.25) (2026-03-11)

### Bug Fixes

- **release:** fix issue in lerna not publishing _.cjs|_.mjs files ([8982184](https://github.com/jentic/jentic-arazzo-tools/commit/8982184ddae167b6f2a772114f9a9321f3b67d14))

# [1.0.0-alpha.24](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.23...v1.0.0-alpha.24) (2026-03-11)

**Note:** Version bump only for package @jentic/arazzo-validator

# [1.0.0-alpha.23](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.22...v1.0.0-alpha.23) (2026-03-11)

**Note:** Version bump only for package @jentic/arazzo-validator

# [1.0.0-alpha.22](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.21...v1.0.0-alpha.22) (2026-03-10)

### Performance Improvements

- address memory issues with SpecLynx data model ([#124](https://github.com/jentic/jentic-arazzo-tools/issues/124)) ([90ee10d](https://github.com/jentic/jentic-arazzo-tools/commit/90ee10d52dbe7314d7dc2e48e0e656fd74a97cff))

# [1.0.0-alpha.21](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.20...v1.0.0-alpha.21) (2026-02-24)

### Bug Fixes

- **parser:** parse YAML document larger than 32768 lines ([#111](https://github.com/jentic/jentic-arazzo-tools/issues/111)) ([b155660](https://github.com/jentic/jentic-arazzo-tools/commit/b155660a608f4f5a0614cb5b3496bcd28a27a447))

# [1.0.0-alpha.20](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.19...v1.0.0-alpha.20) (2026-02-24)

**Note:** Version bump only for package @jentic/arazzo-validator

# [1.0.0-alpha.19](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.18...v1.0.0-alpha.19) (2026-02-23)

### Features

- **arazzo-ui:** add CLI for opening any URL from command cli ([#103](https://github.com/jentic/jentic-arazzo-tools/issues/103)) ([6923e7b](https://github.com/jentic/jentic-arazzo-tools/commit/6923e7bdcb62e86266789e18ef6af5dc27459110)), closes [#96](https://github.com/jentic/jentic-arazzo-tools/issues/96)

# [1.0.0-alpha.18](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2026-02-20)

**Note:** Version bump only for package @jentic/arazzo-validator

# [1.0.0-alpha.17](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) (2026-02-20)

**Note:** Version bump only for package @jentic/arazzo-validator

# [1.0.0-alpha.16](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2026-02-20)

### Bug Fixes

- **security:** fix security vulnerability in minimatch ([#89](https://github.com/jentic/jentic-arazzo-tools/issues/89)) ([7e16a0f](https://github.com/jentic/jentic-arazzo-tools/commit/7e16a0ff16aa4e87d09e149dd1bd6cfcf7f23e23))

# [1.0.0-alpha.15](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.14...v1.0.0-alpha.15) (2026-02-20)

**Note:** Version bump only for package @jentic/arazzo-validator

# [1.0.0-alpha.14](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) (2026-02-20)

**Note:** Version bump only for package @jentic/arazzo-validator

# [1.0.0-alpha.13](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.12...v1.0.0-alpha.13) (2026-02-11)

### Features

- **validator:** add CLI support ([#65](https://github.com/jentic/jentic-arazzo-tools/issues/65)) ([3a86804](https://github.com/jentic/jentic-arazzo-tools/commit/3a86804b5d2839580c8a147caf5a7db3b3065547))

# [1.0.0-alpha.12](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.11...v1.0.0-alpha.12) (2026-02-11)

### Features

- **validator:** export TextDocument, Diagnostics and other symbols ([#64](https://github.com/jentic/jentic-arazzo-tools/issues/64)) ([4b2bf84](https://github.com/jentic/jentic-arazzo-tools/commit/4b2bf84d97a21f15041bd4304305a8992403f724))

# [1.0.0-alpha.11](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.10...v1.0.0-alpha.11) (2026-02-10)

### Features

- add initial validator implementation ([#60](https://github.com/jentic/jentic-arazzo-tools/issues/60)) ([4e9a73d](https://github.com/jentic/jentic-arazzo-tools/commit/4e9a73dd5ca2b2b48ebc32de6b02c93524fabccf))
