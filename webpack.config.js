const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
  entry: "./src/index.js",
  plugins: [
    new CopyPlugin([
      {
        from: "src",
        to: "dist"
      }
    ])
  ]
};
