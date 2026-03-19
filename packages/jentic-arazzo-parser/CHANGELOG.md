# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.29](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.28...v1.0.0-alpha.29) (2026-03-19)

### Bug Fixes

- **parser:** avoid dumping entire source document to error ([#176](https://github.com/jentic/jentic-arazzo-tools/issues/176)) ([2e51fde](https://github.com/jentic/jentic-arazzo-tools/commit/2e51fdea7d0d7aa9be0d54ae1df30eee2117fb76))

### Features

- **ui:** open local files via CLI in browser ([#177](https://github.com/jentic/jentic-arazzo-tools/issues/177)) ([ef440d3](https://github.com/jentic/jentic-arazzo-tools/commit/ef440d36fdff0f1a1bab2453e57ae1b957f9ccc5)), closes [#144](https://github.com/jentic/jentic-arazzo-tools/issues/144)

# [1.0.0-alpha.28](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.27...v1.0.0-alpha.28) (2026-03-19)

**Note:** Version bump only for package @jentic/arazzo-parser

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

**Note:** Version bump only for package @jentic/arazzo-parser

# [1.0.0-alpha.23](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.22...v1.0.0-alpha.23) (2026-03-11)

### Features

- **parser:** share configuration between parsers ([#126](https://github.com/jentic/jentic-arazzo-tools/issues/126)) ([9e5c00f](https://github.com/jentic/jentic-arazzo-tools/commit/9e5c00fcb72afcf1d383ad2707969ebd63aa0774))

# [1.0.0-alpha.22](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.21...v1.0.0-alpha.22) (2026-03-10)

### Performance Improvements

- address memory issues with SpecLynx data model ([#124](https://github.com/jentic/jentic-arazzo-tools/issues/124)) ([90ee10d](https://github.com/jentic/jentic-arazzo-tools/commit/90ee10d52dbe7314d7dc2e48e0e656fd74a97cff))

# [1.0.0-alpha.21](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.20...v1.0.0-alpha.21) (2026-02-24)

### Bug Fixes

- **parser:** parse YAML document larger than 32768 lines ([#111](https://github.com/jentic/jentic-arazzo-tools/issues/111)) ([b155660](https://github.com/jentic/jentic-arazzo-tools/commit/b155660a608f4f5a0614cb5b3496bcd28a27a447))

# [1.0.0-alpha.20](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.19...v1.0.0-alpha.20) (2026-02-24)

### Bug Fixes

- loosen parsing constraints to parse URIs without extensions ([#108](https://github.com/jentic/jentic-arazzo-tools/issues/108)) ([3720140](https://github.com/jentic/jentic-arazzo-tools/commit/372014060b7feae9a98e220277c2a5888132bad2))

# [1.0.0-alpha.19](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.18...v1.0.0-alpha.19) (2026-02-23)

### Features

- **arazzo-ui:** add CLI for opening any URL from command cli ([#103](https://github.com/jentic/jentic-arazzo-tools/issues/103)) ([6923e7b](https://github.com/jentic/jentic-arazzo-tools/commit/6923e7bdcb62e86266789e18ef6af5dc27459110)), closes [#96](https://github.com/jentic/jentic-arazzo-tools/issues/96)

# [1.0.0-alpha.18](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2026-02-20)

### Features

- **parser:** add support for lossless roundtrips ([#91](https://github.com/jentic/jentic-arazzo-tools/issues/91)) ([2cffe4f](https://github.com/jentic/jentic-arazzo-tools/commit/2cffe4f142c4a541126a3f5f2e3634195c906f75))

# [1.0.0-alpha.17](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) (2026-02-20)

### Bug Fixes

- **deps:** use caret ranges for @speclynx/\* dependencies ([#90](https://github.com/jentic/jentic-arazzo-tools/issues/90)) ([2be9f0b](https://github.com/jentic/jentic-arazzo-tools/commit/2be9f0b06a38ee28d3b2ee344ff9a764d2ed3de4))

# [1.0.0-alpha.16](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2026-02-20)

### Bug Fixes

- **security:** fix security vulnerability in minimatch ([#89](https://github.com/jentic/jentic-arazzo-tools/issues/89)) ([7e16a0f](https://github.com/jentic/jentic-arazzo-tools/commit/7e16a0ff16aa4e87d09e149dd1bd6cfcf7f23e23))

# [1.0.0-alpha.15](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.14...v1.0.0-alpha.15) (2026-02-20)

**Note:** Version bump only for package @jentic/arazzo-parser

# [1.0.0-alpha.14](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) (2026-02-20)

**Note:** Version bump only for package @jentic/arazzo-parser

# [1.0.0-alpha.13](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.12...v1.0.0-alpha.13) (2026-02-11)

**Note:** Version bump only for package @jentic/arazzo-parser

# [1.0.0-alpha.12](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.11...v1.0.0-alpha.12) (2026-02-11)

**Note:** Version bump only for package @jentic/arazzo-parser

# [1.0.0-alpha.11](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.10...v1.0.0-alpha.11) (2026-02-10)

### Features

- add initial validator implementation ([#60](https://github.com/jentic/jentic-arazzo-tools/issues/60)) ([4e9a73d](https://github.com/jentic/jentic-arazzo-tools/commit/4e9a73dd5ca2b2b48ebc32de6b02c93524fabccf))

# [1.0.0-alpha.10](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.9...v1.0.0-alpha.10) (2026-02-08)

### Bug Fixes

- **parser:** add doc for accessing parse result via SourceDescription ([c23699b](https://github.com/jentic/jentic-arazzo-tools/commit/c23699bc6cf77cafbd77a9df5dd5fb355f771696))

# [1.0.0-alpha.9](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.8...v1.0.0-alpha.9) (2026-02-05)

### Features

- **resolver:** add dereferencing support for Arazzo Source Descriptions ([#43](https://github.com/jentic/jentic-arazzo-tools/issues/43)) ([091610b](https://github.com/jentic/jentic-arazzo-tools/commit/091610be81b32540845c7f1cb60dd68348ee282b))

# [1.0.0-alpha.8](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.7...v1.0.0-alpha.8) (2026-02-05)

**Note:** Version bump only for package @jentic/arazzo-parser

# [1.0.0-alpha.7](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.6...v1.0.0-alpha.7) (2026-02-04)

### Features

- **parser:** add support for parsing OpenAPI Documents ([#35](https://github.com/jentic/jentic-arazzo-tools/issues/35)) ([4c2615e](https://github.com/jentic/jentic-arazzo-tools/commit/4c2615e07c3b74ea7fe74b91b977c8c7123a2188))

# [1.0.0-alpha.6](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) (2026-02-04)

### Features

- **parser:** add support for parsing entire Arazzo Description ([#34](https://github.com/jentic/jentic-arazzo-tools/issues/34)) ([44b2bda](https://github.com/jentic/jentic-arazzo-tools/commit/44b2bda1c7449e1db8145af1dea457f2e09a465b))

# [1.0.0-alpha.5](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2026-01-31)

**Note:** Version bump only for package @jentic/arazzo-parser

# [1.0.0-alpha.4](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2026-01-31)

### Features

- **parser:** add unified options interface & retrievalURI meta ([#16](https://github.com/jentic/jentic-arazzo-tools/issues/16)) ([2d6c3b3](https://github.com/jentic/jentic-arazzo-tools/commit/2d6c3b37f3246bc5ad775c30b508607119c9eb50))
- **resolver:** add dereferencing support for Arazzo Document fragments ([#21](https://github.com/jentic/jentic-arazzo-tools/issues/21)) ([868dc43](https://github.com/jentic/jentic-arazzo-tools/commit/868dc434b51f6247ca102fae7422a85a0e545d09))
- **resolver:** add dereferencing support for entry Arazzo Document ([#15](https://github.com/jentic/jentic-arazzo-tools/issues/15)) ([cf016ed](https://github.com/jentic/jentic-arazzo-tools/commit/cf016ed9130f08aac87bbb94b0e45e80c27f8fc3))

# [1.0.0-alpha.3](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.2...v1.0.0-alpha.3) (2026-01-29)

### Features

- **parser:** add package keywords ([#10](https://github.com/jentic/jentic-arazzo-tools/issues/10)) ([0e71b1b](https://github.com/jentic/jentic-arazzo-tools/commit/0e71b1b77a1222a427214f7f9c281cbc1da13278))

# [1.0.0-alpha.2](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2026-01-28)

**Note:** Version bump only for package @jentic/arazzo-parser

# 1.0.0-alpha.1 (2026-01-28)

### Bug Fixes

- **parser:** trhow error on pojo + sourceMap option combo ([#4](https://github.com/jentic/jentic-arazzo-tools/issues/4)) ([b3c4527](https://github.com/jentic/jentic-arazzo-tools/commit/b3c45271397daa297213308b048efbcaf85524f1)), closes [#3](https://github.com/jentic/jentic-arazzo-tools/issues/3)

### Features

- implement semantic Arazzo Document parser ([#1](https://github.com/jentic/jentic-arazzo-tools/issues/1)) ([ce65056](https://github.com/jentic/jentic-arazzo-tools/commit/ce650568b1926f65bea1831d91e0fcbd9c44e383))
- setup lerna monorepo ([15a7363](https://github.com/jentic/jentic-arazzo-tools/commit/15a7363e93c630f8cbe7393cfd808186e6fdf852))
