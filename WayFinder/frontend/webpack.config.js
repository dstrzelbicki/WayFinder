const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
require("dotenv").config();

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "./static/frontend"),
    filename: "main.js",
    publicPath: "/",
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
           filename: 'images/[name][ext]'
        }
      },
    ],
  },
  resolve: {
    extensions: ['', '*', '.js', '.jsx', '.css'],
    modules: [
      'node_modules'
    ]
  },
  optimization: {
    minimize: true,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "static"),
    },
    compress: true,
    hot: true,
    historyApiFallback: true,
    port: 3000,
  },
  plugins: [
    new webpack.EnvironmentPlugin(),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("development"),
        "REACT_APP_BASE_URL": JSON.stringify(process.env.REACT_APP_BASE_URL),
        "REACT_APP_GEOAPIFY_API_KEY": JSON.stringify(process.env.REACT_APP_GEOAPIFY_API_KEY),
        "REACT_APP_TOMTOM_API_KEY": JSON.stringify(process.env.REACT_APP_TOMTOM_API_KEY),
      },
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "public", "index.html"),
      cspPlugin: {
        enabled: true,
        policy: {
          'default-src': "'self'",
          'script-src': [
            "'self'",
            'https://ajax.googleapis.com',
          ],
          'style-src': [
            "'self'",
            'https://fonts.googleapis.com',
          ],
          'font-src': "'self' https://fonts.gstatic.com",
          'img-src': "'self' data:",
          'connect-src': "'self' 'http://127.0.0.1:8000'",
          'frame-ancestors': "'none'",
        },
        hashEnabled: {
          'style-src': true,
          'script-src': true,
        },
        nonceEnabled: {
          'style-src': false,
          'script-src': false,
        },
      },
    }),
  ],
};