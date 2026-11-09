# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.33](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.32...v1.0.0-alpha.33) (2026-11-09)

### Bug Fixes

- Correctly decode URI fragment in evaluateFragment ([369a206](https://github.com/jentic/jentic-arazzo-tools/commit/369a2062aa1364d07098eece85a7ffd9261de327))
- escape HTML in step header title ([67e1ab5](https://github.com/jentic/jentic-arazzo-tools/commit/67e1ab529d7724850c744c8a54f4bf6ef7c110ec))
- **parser:** match literal-URL operationPath to its source ([e9867f1](https://github.com/jentic/jentic-arazzo-tools/commit/e9867f118302fbfb3cc3a34ae9aa048f9735b7fd))
- **parser:** resolve operationPath pointers against the source ([13d52b3](https://github.com/jentic/jentic-arazzo-tools/commit/13d52b3f461f422a5f86a11b3973817a2172d9c0))
- **parser:** resolve operationPath that targets a path item ([9d54607](https://github.com/jentic/jentic-arazzo-tools/commit/9d54607eefb93b665582de1ebc6242c937d1dfde))
- refactor condition to check sourceDescription type ([5604305](https://github.com/jentic/jentic-arazzo-tools/commit/5604305dd7c31ac4459997124667a3cf9609e252))
- **resolver:** follow only path item $ref chains ([c467e32](https://github.com/jentic/jentic-arazzo-tools/commit/c467e321e95fa00055f983f4b79ec00285a0890f))
- **resolver:** resolve $refs in components.pathItems ([c9472d4](https://github.com/jentic/jentic-arazzo-tools/commit/c9472d49db22a31c8a0c85b05d59ee348bbc1eb1))
- **ui:** account for request body section in node layout ([fa97919](https://github.com/jentic/jentic-arazzo-tools/commit/fa97919d6ee4ef867fe541df15c3201fbacad64f))
- **ui:** display explicit null request body payload ([72df1bb](https://github.com/jentic/jentic-arazzo-tools/commit/72df1bbd64667fb94fe6d50ebe20c5e5e5c30957))
- **ui:** label workflow-referencing steps as Workflow, not Operation ([8fb2bf7](https://github.com/jentic/jentic-arazzo-tools/commit/8fb2bf7eaa7734e4b192a5ba4cb30b3b51290f11))
- **ui:** make petstore sample workflow valid Arazzo ([66afeac](https://github.com/jentic/jentic-arazzo-tools/commit/66afeac732800128bdf17d5eaff35761a81aa49b))
- **ui:** only parse url-encoded strings as form fields ([a2f00e7](https://github.com/jentic/jentic-arazzo-tools/commit/a2f00e7ac63653dd1cbfe5831795fced3d0cdfab))
- **ui:** Remove context and type from successCriteria ([4f7a78d](https://github.com/jentic/jentic-arazzo-tools/commit/4f7a78d2e9dbfe53f21e5c65934a8fc7dc455bce))
- **ui:** render parameters of steps invoking workflows ([7106aa9](https://github.com/jentic/jentic-arazzo-tools/commit/7106aa9759c0a29ce4ded3a5a60532998629cee2))
- **ui:** show bottom border on request body tables ([f0c39d1](https://github.com/jentic/jentic-arazzo-tools/commit/f0c39d18a2949f3f61885abbb291666cafb54d87))
- **ui:** show whole-payload runtime expressions as code in forms ([37b0c89](https://github.com/jentic/jentic-arazzo-tools/commit/37b0c8949159a7cab0e171ec0564c8f4fb68a6da))
- **ui:** style workflow name like operation refs in step description ([025a004](https://github.com/jentic/jentic-arazzo-tools/commit/025a004f3b1e70835b70f29aa51ef425079f1134))
- **ui:** trap focus in request body dialog ([5cebe94](https://github.com/jentic/jentic-arazzo-tools/commit/5cebe94f97166a75d592e98ec3cd476c7c39badd))
- **ui:** use a single color for operation and workflow references ([c41185e](https://github.com/jentic/jentic-arazzo-tools/commit/c41185e0ed450ffc4fb5d72441dd119d484c7a60))

### Features

- **parser:** resolve step HTTP methods with typed OpenAPI APIs ([0795f96](https://github.com/jentic/jentic-arazzo-tools/commit/0795f96d6ca93203d2766b5ee6315502ef6bf989))
- **parser:** type _operation on attachStepOperations result ([ae5a101](https://github.com/jentic/jentic-arazzo-tools/commit/ae5a101d1a32961b0c830b8c8e00bac508d73f64))
- **resolver:** resolve path item refs of source descriptions ([8fca2e7](https://github.com/jentic/jentic-arazzo-tools/commit/8fca2e7b69fa3fb8c7aa79af7f46a8ae81b62e6f))
- **ui:** Add requestBody dialog to diagram view ([a6abe2f](https://github.com/jentic/jentic-arazzo-tools/commit/a6abe2f7b496e2b163044f19c3a0ee4e3d871e64))
- **ui:** Add requestBody to docs view ([5f33e04](https://github.com/jentic/jentic-arazzo-tools/commit/5f33e04f279c0955c06334174f59932cff7c841e))
- **ui:** display requestBody payloads (except forms) as YAML ([3f331d2](https://github.com/jentic/jentic-arazzo-tools/commit/3f331d2288b1a0b71fd2a107f39426eac7f15b43))
- **ui:** Move StepOperation stuff out of arrazo type def ([67cfbe7](https://github.com/jentic/jentic-arazzo-tools/commit/67cfbe7ba8a189171c1063d72ede40a29475ca4d))
- **ui:** render requestBody by content type ([ff75c17](https://github.com/jentic/jentic-arazzo-tools/commit/ff75c17560586ac7eac55f47b1741748d341819a))
- **ui:** Revert unnecessary formatting changes ([7d48e7e](https://github.com/jentic/jentic-arazzo-tools/commit/7d48e7e555280b2092450ff36a8fae1cf48e7683))
- **ui:** show Arazzo logo instead of method badge for workflow steps ([9393386](https://github.com/jentic/jentic-arazzo-tools/commit/939338650c8ffb68a469ed86005ecad248f183f7))
- **ui:** show form requestBody fields and replacements as tables ([52c7bcd](https://github.com/jentic/jentic-arazzo-tools/commit/52c7bcd8dec76576a96a124f3acfa0e7c9b29df6))
- **ui:** show HTTP method of each step's operation ([9671a14](https://github.com/jentic/jentic-arazzo-tools/commit/9671a148440b78f9b51bd1de8915cb3926792919))
- **ui:** Use existing logic in parser for OpenAPI doc parsing ([4b7bf5e](https://github.com/jentic/jentic-arazzo-tools/commit/4b7bf5e4cedfb536b9ba05a83bd4ee1fd699b19b))
- **ui:** Use generic helper to render HTTP method badge ([6ab8cd6](https://github.com/jentic/jentic-arazzo-tools/commit/6ab8cd616c0b202a9584cbe62e956a6171c01b25))
- **ui:** Use sourceDescription.type to check for OpenAPI doc ([f5d4e3f](https://github.com/jentic/jentic-arazzo-tools/commit/f5d4e3f900b94ec586c1f649b762e9f5a1e7c27c))

# [1.0.0-alpha.32](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.31...v1.0.0-alpha.32) (2026-07-21)

### Bug Fixes

- **validator:** bump @speclynx/apidom-ls to 2.11.6 ([#282](https://github.com/jentic/jentic-arazzo-tools/issues/282)) ([ec63fe6](https://github.com/jentic/jentic-arazzo-tools/commit/ec63fe6bfa3698663e5ad4087f6abdfe813294f2))

### Features

- **runner:** add jsonpath criterion evaluator ([#264](https://github.com/jentic/jentic-arazzo-tools/issues/264)) ([8f1fb9f](https://github.com/jentic/jentic-arazzo-tools/commit/8f1fb9f55a07fe83d673557304654f36bd55eb81))
- **runner:** add output and request body resolvers ([#272](https://github.com/jentic/jentic-arazzo-tools/issues/272)) ([666381b](https://github.com/jentic/jentic-arazzo-tools/commit/666381bf8c61c0f53c6f62465bfd884d81a694fa))
- **runner:** add xpath criterion evaluator ([#269](https://github.com/jentic/jentic-arazzo-tools/issues/269)) ([dff9c6a](https://github.com/jentic/jentic-arazzo-tools/commit/dff9c6a17f767685c5a86f0601da1e92d8af2946))

# [1.0.0-alpha.31](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.30...v1.0.0-alpha.31) (2026-05-19)

### Bug Fixes

- **release:** use GitHub App token instead of GITHUB_TOKEN ([#221](https://github.com/jentic/jentic-arazzo-tools/issues/221)) ([ae64b36](https://github.com/jentic/jentic-arazzo-tools/commit/ae64b363ed19fb8372bb32d707229584e105bbd8))

# [1.0.0-alpha.30](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.29...v1.0.0-alpha.30) (2026-04-04)

### Bug Fixes

- **deps:** update lodash to non-vulnerable version ([#191](https://github.com/jentic/jentic-arazzo-tools/issues/191)) ([bfe8e16](https://github.com/jentic/jentic-arazzo-tools/commit/bfe8e16ebe7eab7b563809cdd18f8e1a90310dc7))
- **security:** upgrade lodash and lodash-es to 4.18.x via overrides ([a39e33f](https://github.com/jentic/jentic-arazzo-tools/commit/a39e33f81f8810e78af0c9989955feb6c3f3b50c)), closes [#48](https://github.com/jentic/jentic-arazzo-tools/issues/48) [#49](https://github.com/jentic/jentic-arazzo-tools/issues/49)
- **validator:** anchor contentType MIME regex and support parameters ([b912017](https://github.com/jentic/jentic-arazzo-tools/commit/b91201731f0e2d8e96986a20b03806a8980aedbc))
- **validator:** detect non-Arazzo documents ([#194](https://github.com/jentic/jentic-arazzo-tools/issues/194)) ([0152fec](https://github.com/jentic/jentic-arazzo-tools/commit/0152fec747c9f3bd5cf0fc300bbf24eb95430a62))
- **validator:** make script tag lint rule case-insensitive ([5f1e7f8](https://github.com/jentic/jentic-arazzo-tools/commit/5f1e7f8056572318a21b99a7061e7377d2f5eb09))

### Features

- **validator:** add comprehensive Arazzo specification lint rules ([4697c5c](https://github.com/jentic/jentic-arazzo-tools/commit/4697c5c3ccc94ab10032d22c69c4c457ec4cde50))
- **validator:** show full range in CLI formatters ([#193](https://github.com/jentic/jentic-arazzo-tools/issues/193)) ([d7a3145](https://github.com/jentic/jentic-arazzo-tools/commit/d7a314530d94fd6f56b4c83b7c738d44c30703f2))

# [1.0.0-alpha.29](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.28...v1.0.0-alpha.29) (2026-03-19)

### Bug Fixes

- **parser:** avoid dumping entire source document to error ([#176](https://github.com/jentic/jentic-arazzo-tools/issues/176)) ([2e51fde](https://github.com/jentic/jentic-arazzo-tools/commit/2e51fdea7d0d7aa9be0d54ae1df30eee2117fb76))
- **ui:** fix file upload UX accessibility ([#175](https://github.com/jentic/jentic-arazzo-tools/issues/175)) ([704f07e](https://github.com/jentic/jentic-arazzo-tools/commit/704f07e27b4848bd95277944a93e01e205cb9786))

### Features

- **ui:** open local files via CLI in browser ([#177](https://github.com/jentic/jentic-arazzo-tools/issues/177)) ([ef440d3](https://github.com/jentic/jentic-arazzo-tools/commit/ef440d36fdff0f1a1bab2453e57ae1b957f9ccc5)), closes [#144](https://github.com/jentic/jentic-arazzo-tools/issues/144)

# [1.0.0-alpha.28](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.27...v1.0.0-alpha.28) (2026-03-19)

### Features

- **ui:** add support for locale file upload ([#174](https://github.com/jentic/jentic-arazzo-tools/issues/174)) ([2166e3f](https://github.com/jentic/jentic-arazzo-tools/commit/2166e3f42beae19c630b5f1614420ddfd7ced1ee)), closes [#110](https://github.com/jentic/jentic-arazzo-tools/issues/110)

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

### Bug Fixes

- **release:** fix issue in lerna not publishing _.cjs|_.mjs files ([50ac50c](https://github.com/jentic/jentic-arazzo-tools/commit/50ac50ce946997d09701543f4f80a6d0de1269c4))

# [1.0.0-alpha.23](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.22...v1.0.0-alpha.23) (2026-03-11)

### Features

- **parser:** share configuration between parsers ([#126](https://github.com/jentic/jentic-arazzo-tools/issues/126)) ([9e5c00f](https://github.com/jentic/jentic-arazzo-tools/commit/9e5c00fcb72afcf1d383ad2707969ebd63aa0774))
- **resolver:** reuse configuration from parser ([#130](https://github.com/jentic/jentic-arazzo-tools/issues/130)) ([e135be7](https://github.com/jentic/jentic-arazzo-tools/commit/e135be78133ad3957a31716dabd540333d57c0a4))

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

### Bug Fixes

- **arazzo-ui:** fix demo URL ([418982e](https://github.com/jentic/jentic-arazzo-tools/commit/418982e231e83e509e2e0705d9a2029ea639b6ae))

### Features

- **arazoo-ui:** align with Arazzo logo color scheme ([#101](https://github.com/jentic/jentic-arazzo-tools/issues/101)) ([850fdca](https://github.com/jentic/jentic-arazzo-tools/commit/850fdca3d067c28b79b6590ed1cbf449b7d510a1))
- **arazzo-ui:** add CLI for opening any URL from command cli ([#103](https://github.com/jentic/jentic-arazzo-tools/issues/103)) ([6923e7b](https://github.com/jentic/jentic-arazzo-tools/commit/6923e7bdcb62e86266789e18ef6af5dc27459110)), closes [#96](https://github.com/jentic/jentic-arazzo-tools/issues/96)
- **arazzo-ui:** add support for document url query param ([2a1aed6](https://github.com/jentic/jentic-arazzo-tools/commit/2a1aed6cb1f07bcbe9a0cd7fd9d2e04cc27cf599))
- **arazzo-ui:** provide Arazzo favicon ([019b45d](https://github.com/jentic/jentic-arazzo-tools/commit/019b45d42a8746b23e7328d5d03ce9328e82fb70))

# [1.0.0-alpha.18](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2026-02-20)

### Features

- **parser:** add support for lossless roundtrips ([#91](https://github.com/jentic/jentic-arazzo-tools/issues/91)) ([2cffe4f](https://github.com/jentic/jentic-arazzo-tools/commit/2cffe4f142c4a541126a3f5f2e3634195c906f75))

# [1.0.0-alpha.17](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) (2026-02-20)

### Bug Fixes

- **deps:** pin inter-package @jentic/\* dependency versions ([d3d16f4](https://github.com/jentic/jentic-arazzo-tools/commit/d3d16f4186127601fd2406075f08ed8fcf8253bb))
- **deps:** use caret ranges for @speclynx/\* dependencies ([#90](https://github.com/jentic/jentic-arazzo-tools/issues/90)) ([2be9f0b](https://github.com/jentic/jentic-arazzo-tools/commit/2be9f0b06a38ee28d3b2ee344ff9a764d2ed3de4))

# [1.0.0-alpha.16](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2026-02-20)

### Bug Fixes

- **security:** fix security vulnerability in minimatch ([#89](https://github.com/jentic/jentic-arazzo-tools/issues/89)) ([7e16a0f](https://github.com/jentic/jentic-arazzo-tools/commit/7e16a0ff16aa4e87d09e149dd1bd6cfcf7f23e23))

# [1.0.0-alpha.15](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.14...v1.0.0-alpha.15) (2026-02-20)

### Bug Fixes

- **release:** fix failed ArazzoUI release ([fc37841](https://github.com/jentic/jentic-arazzo-tools/commit/fc378416584650fd6c7c32e7a3eab78e978508de))

# [1.0.0-alpha.14](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) (2026-02-20)

### Features

- add jentic-arazzo-ui package ([#83](https://github.com/jentic/jentic-arazzo-tools/issues/83)) ([08812b0](https://github.com/jentic/jentic-arazzo-tools/commit/08812b05670c534a28773dbf5e1939f5e55f2b20))

# [1.0.0-alpha.13](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.12...v1.0.0-alpha.13) (2026-02-11)

### Features

- **validator:** add CLI support ([#65](https://github.com/jentic/jentic-arazzo-tools/issues/65)) ([3a86804](https://github.com/jentic/jentic-arazzo-tools/commit/3a86804b5d2839580c8a147caf5a7db3b3065547))

# [1.0.0-alpha.12](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.11...v1.0.0-alpha.12) (2026-02-11)

### Features

- **validator:** export TextDocument, Diagnostics and other symbols ([#64](https://github.com/jentic/jentic-arazzo-tools/issues/64)) ([4b2bf84](https://github.com/jentic/jentic-arazzo-tools/commit/4b2bf84d97a21f15041bd4304305a8992403f724))

# [1.0.0-alpha.11](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.10...v1.0.0-alpha.11) (2026-02-10)

### Features

- add initial validator implementation ([#60](https://github.com/jentic/jentic-arazzo-tools/issues/60)) ([4e9a73d](https://github.com/jentic/jentic-arazzo-tools/commit/4e9a73dd5ca2b2b48ebc32de6b02c93524fabccf))

# [1.0.0-alpha.10](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.9...v1.0.0-alpha.10) (2026-02-08)

### Bug Fixes

- **parser:** add doc for accessing parse result via SourceDescription ([c23699b](https://github.com/jentic/jentic-arazzo-tools/commit/c23699bc6cf77cafbd77a9df5dd5fb355f771696))
- **resolver:** add doc for accessing parse result via SourceDescription ([13d43e4](https://github.com/jentic/jentic-arazzo-tools/commit/13d43e45ed3bb02d5771b3adc7a6fb1e5571a393))

# [1.0.0-alpha.9](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.8...v1.0.0-alpha.9) (2026-02-05)

### Features

- **resolver:** add dereferencing support for Arazzo Source Descriptions ([#43](https://github.com/jentic/jentic-arazzo-tools/issues/43)) ([091610b](https://github.com/jentic/jentic-arazzo-tools/commit/091610be81b32540845c7f1cb60dd68348ee282b))

# [1.0.0-alpha.8](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.7...v1.0.0-alpha.8) (2026-02-05)

### Features

- **resolver:** add dereferencing support for OpenAPI Documents & fragments ([#42](https://github.com/jentic/jentic-arazzo-tools/issues/42)) ([7687c9e](https://github.com/jentic/jentic-arazzo-tools/commit/7687c9eecc50aab508e67ba5d639b31e25154eff))
- **resolver:** improve API consistency and validation ([#36](https://github.com/jentic/jentic-arazzo-tools/issues/36)) ([aa095cb](https://github.com/jentic/jentic-arazzo-tools/commit/aa095cb19a1543cd675bfa94a6de1651d21a58b5))

# [1.0.0-alpha.7](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.6...v1.0.0-alpha.7) (2026-02-04)

### Features

- **parser:** add support for parsing OpenAPI Documents ([#35](https://github.com/jentic/jentic-arazzo-tools/issues/35)) ([4c2615e](https://github.com/jentic/jentic-arazzo-tools/commit/4c2615e07c3b74ea7fe74b91b977c8c7123a2188))

# [1.0.0-alpha.6](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) (2026-02-04)

### Features

- **parser:** add support for parsing entire Arazzo Description ([#34](https://github.com/jentic/jentic-arazzo-tools/issues/34)) ([44b2bda](https://github.com/jentic/jentic-arazzo-tools/commit/44b2bda1c7449e1db8145af1dea457f2e09a465b))

# [1.0.0-alpha.5](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2026-01-31)

### Bug Fixes

- **resolver:** provide documentation in README ([74cabc1](https://github.com/jentic/jentic-arazzo-tools/commit/74cabc102c56eb3cc2640500a513449a64ca52ad))

# [1.0.0-alpha.4](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2026-01-31)

### Features

- **parser:** add unified options interface & retrievalURI meta ([#16](https://github.com/jentic/jentic-arazzo-tools/issues/16)) ([2d6c3b3](https://github.com/jentic/jentic-arazzo-tools/commit/2d6c3b37f3246bc5ad775c30b508607119c9eb50))
- **resolver:** add dereferencing support for Arazzo Document fragments ([#21](https://github.com/jentic/jentic-arazzo-tools/issues/21)) ([868dc43](https://github.com/jentic/jentic-arazzo-tools/commit/868dc434b51f6247ca102fae7422a85a0e545d09))
- **resolver:** add dereferencing support for entry Arazzo Document ([#15](https://github.com/jentic/jentic-arazzo-tools/issues/15)) ([cf016ed](https://github.com/jentic/jentic-arazzo-tools/commit/cf016ed9130f08aac87bbb94b0e45e80c27f8fc3))

# [1.0.0-alpha.3](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.2...v1.0.0-alpha.3) (2026-01-29)

### Features

- **parser:** add package keywords ([#10](https://github.com/jentic/jentic-arazzo-tools/issues/10)) ([0e71b1b](https://github.com/jentic/jentic-arazzo-tools/commit/0e71b1b77a1222a427214f7f9c281cbc1da13278))

# [1.0.0-alpha.2](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2026-01-28)

### Bug Fixes

- **release:** mark GitHub release as latest ([#7](https://github.com/jentic/jentic-arazzo-tools/issues/7)) ([a6d0574](https://github.com/jentic/jentic-arazzo-tools/commit/a6d057421eaf570a9230ad192d16c8b84886b6b5))

# 1.0.0-alpha.1 (2026-01-28)

### Bug Fixes

- **parser:** trhow error on pojo + sourceMap option combo ([#4](https://github.com/jentic/jentic-arazzo-tools/issues/4)) ([b3c4527](https://github.com/jentic/jentic-arazzo-tools/commit/b3c45271397daa297213308b048efbcaf85524f1)), closes [#3](https://github.com/jentic/jentic-arazzo-tools/issues/3)

### Features

- implement semantic Arazzo Document parser ([#1](https://github.com/jentic/jentic-arazzo-tools/issues/1)) ([ce65056](https://github.com/jentic/jentic-arazzo-tools/commit/ce650568b1926f65bea1831d91e0fcbd9c44e383))
- setup lerna monorepo ([15a7363](https://github.com/jentic/jentic-arazzo-tools/commit/15a7363e93c630f8cbe7393cfd808186e6fdf852))
