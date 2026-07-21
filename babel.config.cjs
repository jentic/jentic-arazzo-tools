const path = require('node:path');

module.exports = {
  babelrcRoots: ['packages/*'],
  ignore: ['**/*.d.ts'],
  env: {
    cjs: {
      browserslistEnv: 'isomorphic-production',
      presets: [
        [
          '@babel/preset-env',
          {
            debug: false,
            modules: 'commonjs',
            forceAllTransforms: false,
            ignoreBrowserslistConfig: false,
            exclude: ['transform-function-name'],
          },
        ],
        [
          '@babel/preset-typescript',
          {
            onlyRemoveTypeImports: false,
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            moduleName: '@babel/runtime-corejs3',
            absoluteRuntime: false,
            version: '^8.0.0',
          },
        ],
        process.env.NODE_ENV !== 'test'
          ? [
              path.join(__dirname, './scripts/babel-plugin-add-import-extension.cjs'),
              { extension: 'cjs' },
            ]
          : false,
      ].filter(Boolean),
    },
    es: {
      browserslistEnv: 'isomorphic-production',
      presets: [
        [
          '@babel/preset-env',
          {
            debug: false,
            modules: false,
            forceAllTransforms: false,
            ignoreBrowserslistConfig: false,
            exclude: ['transform-function-name'], // this is here because of https://github.com/babel/babel/discussions/12874
          },
        ],
        [
          '@babel/preset-typescript',
          {
            onlyRemoveTypeImports: false,
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            moduleName: '@babel/runtime-corejs3',
            absoluteRuntime: false,
            version: '^8.0.0',
          },
        ],
        [
          path.join(__dirname, './scripts/babel-plugin-add-import-extension.cjs'),
          { extension: 'mjs' },
        ],
      ],
    },
    browser: {
      browserslistEnv: 'browser-production',
      presets: [
        [
          '@babel/preset-env',
          {
            debug: false,
            modules: 'auto',
            forceAllTransforms: false,
            ignoreBrowserslistConfig: false,
            exclude: ['transform-function-name'], // this is here because of https://github.com/babel/babel/discussions/12874
          },
        ],
        [
          '@babel/preset-typescript',
          {
            onlyRemoveTypeImports: false,
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            moduleName: '@babel/runtime-corejs3',
            absoluteRuntime: false,
            version: '^8.0.0',
          },
        ],
      ],
    },
  },
};
