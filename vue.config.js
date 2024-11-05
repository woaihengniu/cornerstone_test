const { defineConfig } = require('@vue/cli-service');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const version = new Date().getTime();
module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: true,
  chainWebpack: (config) => {
    config.module
      .rule('wasm')
      .test(/\.wasm$/)
      .type('javascript/auto')
      .use('wasm-loader')
      .loader('wasm-loader')
      .options({})
      .end();
    //remove VUE_PROD_HYDRATION_MISMATCH_DETAILS__ warning
    config.plugin('define').tap((definitions) => {
      Object.assign(definitions[0], {
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      });
      return definitions;
    });
  },
  configureWebpack: {
    devtool: 'source-map',
    experiments: {
      asyncWebAssembly: true,
    },
    output: {
      filename: `js/[name].[hash:8].js?v=${version}`,
      chunkFilename: `js/[name].[hash:8].js?v=${version}`,
    },
    plugins: [
      new NodePolyfillPlugin(),
      new CompressionWebpackPlugin({
        filename: '[path].gz[base]',
        algorithm: 'gzip',
        test: /\.js$|\.css$|\.html$/,
        threshold: 10240,
        minRatio: 0.8,
      }),
    ],
    optimization: {
      runtimeChunk: {
        name: 'runtime',
      },
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 20000,
        maxSize: 250000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
        },
      },
    },
  },
});
