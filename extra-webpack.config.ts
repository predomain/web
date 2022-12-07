import { Configuration, ProvidePlugin } from 'webpack';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';

export default {
  plugins: [
    new NodePolyfillPlugin({}),
    new ProvidePlugin({
      global: ['global'],
    }),
  ],
} as Configuration;
