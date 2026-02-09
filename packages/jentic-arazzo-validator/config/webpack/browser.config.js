import path from 'node:path';
import { nonMinimizeTrait, minimizeTrait } from './traits.config.js';

const browser = {
  mode: 'production',
  entry: ['./src/index.ts'],
  target: 'web',
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  output: {
    path: path.resolve('./dist'),
    filename: 'jentic-arazzo-validator.browser.js',
    libraryTarget: 'umd',
    library: 'jenticArazzoValidator',
  },
  resolve: {
    extensions: ['.ts', '.mjs', '.js', '.json'],
    fallback: {
      fs: false,
      path: false,
      module: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: 'javascript/auto',
        use: 'null-loader',
      },
      {
        test: /\.(ts|js)?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: true,
            rootMode: 'upward',
          },
        },
      },
    ],
  },
  ...nonMinimizeTrait,
};

const browserMin = {
  mode: 'production',
  entry: ['./src/index.ts'],
  target: 'web',
  output: {
    path: path.resolve('./dist'),
    filename: 'jentic-arazzo-validator.browser.min.js',
    libraryTarget: 'umd',
    library: 'jenticArazzoValidator',
  },
  resolve: {
    extensions: ['.ts', '.mjs', '.js', '.json'],
    fallback: {
      fs: false,
      path: false,
      module: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: 'javascript/auto',
        use: 'null-loader',
      },
      {
        test: /\.(ts|js)?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: true,
            rootMode: 'upward',
          },
        },
      },
    ],
  },
  ...minimizeTrait,
};

export default [browser, browserMin];
