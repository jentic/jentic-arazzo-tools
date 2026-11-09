# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.33](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.32...v1.0.0-alpha.33) (2026-11-09)

### Bug Fixes

- escape HTML in step header title ([67e1ab5](https://github.com/jentic/jentic-arazzo-tools/commit/67e1ab529d7724850c744c8a54f4bf6ef7c110ec))
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

**Note:** Version bump only for package @jentic/arazzo-ui

# [1.0.0-alpha.31](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.30...v1.0.0-alpha.31) (2026-05-19)

**Note:** Version bump only for package @jentic/arazzo-ui

# [1.0.0-alpha.30](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.29...v1.0.0-alpha.30) (2026-04-04)

**Note:** Version bump only for package @jentic/arazzo-ui

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

**Note:** Version bump only for package @jentic/arazzo-ui

# [1.0.0-alpha.26](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.25...v1.0.0-alpha.26) (2026-03-11)

**Note:** Version bump only for package @jentic/arazzo-ui

# [1.0.0-alpha.25](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.24...v1.0.0-alpha.25) (2026-03-11)

**Note:** Version bump only for package @jentic/arazzo-ui

# [1.0.0-alpha.24](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.23...v1.0.0-alpha.24) (2026-03-11)

**Note:** Version bump only for package @jentic/arazzo-ui

# [1.0.0-alpha.23](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.22...v1.0.0-alpha.23) (2026-03-11)

**Note:** Version bump only for package @jentic/arazzo-ui

# [1.0.0-alpha.22](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.21...v1.0.0-alpha.22) (2026-03-10)

### Performance Improvements

- address memory issues with SpecLynx data model ([#124](https://github.com/jentic/jentic-arazzo-tools/issues/124)) ([90ee10d](https://github.com/jentic/jentic-arazzo-tools/commit/90ee10d52dbe7314d7dc2e48e0e656fd74a97cff))

# [1.0.0-alpha.21](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.20...v1.0.0-alpha.21) (2026-02-24)

### Bug Fixes

- **parser:** parse YAML document larger than 32768 lines ([#111](https://github.com/jentic/jentic-arazzo-tools/issues/111)) ([b155660](https://github.com/jentic/jentic-arazzo-tools/commit/b155660a608f4f5a0614cb5b3496bcd28a27a447))

# [1.0.0-alpha.20](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.19...v1.0.0-alpha.20) (2026-02-24)

**Note:** Version bump only for package @jentic/arazzo-ui

# [1.0.0-alpha.19](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.18...v1.0.0-alpha.19) (2026-02-23)

### Bug Fixes

- **arazzo-ui:** fix demo URL ([418982e](https://github.com/jentic/jentic-arazzo-tools/commit/418982e231e83e509e2e0705d9a2029ea639b6ae))

### Features

- **arazoo-ui:** align with Arazzo logo color scheme ([#101](https://github.com/jentic/jentic-arazzo-tools/issues/101)) ([850fdca](https://github.com/jentic/jentic-arazzo-tools/commit/850fdca3d067c28b79b6590ed1cbf449b7d510a1))
- **arazzo-ui:** add CLI for opening any URL from command cli ([#103](https://github.com/jentic/jentic-arazzo-tools/issues/103)) ([6923e7b](https://github.com/jentic/jentic-arazzo-tools/commit/6923e7bdcb62e86266789e18ef6af5dc27459110)), closes [#96](https://github.com/jentic/jentic-arazzo-tools/issues/96)
- **arazzo-ui:** add support for document url query param ([2a1aed6](https://github.com/jentic/jentic-arazzo-tools/commit/2a1aed6cb1f07bcbe9a0cd7fd9d2e04cc27cf599))
- **arazzo-ui:** provide Arazzo favicon ([019b45d](https://github.com/jentic/jentic-arazzo-tools/commit/019b45d42a8746b23e7328d5d03ce9328e82fb70))

# [1.0.0-alpha.18](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2026-02-20)

**Note:** Version bump only for package @jentic/arazzo-ui

# [1.0.0-alpha.17](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) (2026-02-20)

### Bug Fixes

- **deps:** use caret ranges for @speclynx/\* dependencies ([#90](https://github.com/jentic/jentic-arazzo-tools/issues/90)) ([2be9f0b](https://github.com/jentic/jentic-arazzo-tools/commit/2be9f0b06a38ee28d3b2ee344ff9a764d2ed3de4))

# [1.0.0-alpha.16](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2026-02-20)

### Bug Fixes

- **security:** fix security vulnerability in minimatch ([#89](https://github.com/jentic/jentic-arazzo-tools/issues/89)) ([7e16a0f](https://github.com/jentic/jentic-arazzo-tools/commit/7e16a0ff16aa4e87d09e149dd1bd6cfcf7f23e23))

# [1.0.0-alpha.15](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.14...v1.0.0-alpha.15) (2026-02-20)

**Note:** Version bump only for package @jentic/arazzo-ui

# [1.0.0-alpha.14](https://github.com/jentic/jentic-arazzo-tools/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) (2026-02-20)

### Features

- add jentic-arazzo-ui package ([#83](https://github.com/jentic/jentic-arazzo-tools/issues/83)) ([08812b0](https://github.com/jentic/jentic-arazzo-tools/commit/08812b05670c534a28773dbf5e1939f5e55f2b20))
