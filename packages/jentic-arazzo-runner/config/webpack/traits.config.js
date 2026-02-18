import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';

export const nonMinimizeTrait = {
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  optimization: {
    minimize: false,
    usedExports: false,
    concatenateModules: false,
  },
};

export const minimizeTrait = {
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          compress: true,
          format: {
            comments: false,
          },
        },
      }),
    ],
  },
};
