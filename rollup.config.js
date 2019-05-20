import cleanup from 'rollup-plugin-cleanup';

const isProduction = process.env.PRODUCTION;

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'umd',
    name: 'ApmPlayer'
  },
  plugins: [
    isProduction && cleanup() // Only use cleanup() in production
  ]
};
