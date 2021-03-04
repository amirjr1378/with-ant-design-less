/* eslint-disable */
const withSass = require("@zeit/next-sass");
const withPlugins = require("next-compose-plugins");
const withLess = require("@zeit/next-less");
const withPWA = require("next-pwa");
const lessToJS = require("less-vars-to-js");
const fs = require("fs");
const path = require("path");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");

const themeVariables = lessToJS(
  fs.readFileSync(path.resolve(__dirname, "./assets/antd-custom.less"), "utf8")
);

module.exports = withPlugins(
  [
    [
      withLess,
      {
        lessLoaderOptions: {
          javascriptEnabled: true,
          modifyVars: themeVariables, // make your antd custom effective
        },
      },
    ],
    [
      withSass,
      {
        cssModules: true,
        cssLoaderOptions: {
          localIdentName: "[local]___[hash:base64:5]",
        },
      },
    ],
    [
      withPWA,
      {
        disable: process.env.NODE_ENV === "development",
        dest: "public",
      },
    ],
  ],
  {
    webpack: (config, { isServer }) => {
      config.plugins.push(new CaseSensitivePathsPlugin());
      if (isServer) {
        const antStyles = /antd\/.*?\/style.*?/;
        const origExternals = [...config.externals];
        config.externals = [
          (context, request, callback) => {
            if (request.match(antStyles)) return callback();
            if (typeof origExternals[0] === "function") {
              origExternals[0](context, request, callback);
            } else {
              callback();
            }
          },
          ...(typeof origExternals[0] === "function" ? [] : origExternals),
        ];

        config.module.rules.unshift({
          test: antStyles,
          use: "null-loader",
        });
      }
      return config;
    },

    async rewrites() {
      return [
        {
          source: "/:path.xml",
          destination: "/api/sitemap/:path",
        },
        {
          source: "/sitemap/doctors-n-r/:page/index.xml",
          destination: "/api/sitemap/doctorNotRegistered",
        },
        {
          source: "/sitemap/doctors-r/:page/index.xml",
          destination: "/api/sitemap/doctorRegistered",
        },
        {
          source: "/sitemap/articles/:page/index.xml",
          destination: "/api/sitemap/articles",
        },
        {
          source: "/sitemap/pages/index.xml",
          destination: "/api/sitemap/pages",
        },
        {
          source: "/sitemap/specialties/index.xml",
          destination: "/api/sitemap/specialties",
        },
        {
          source: "/sitemap/articles/index.xml",
          destination: "/api/sitemap/articles",
        },
        {
          source: "/sitemap/health-centers/index.xml",
          destination: "/api/sitemap/health-centers",
        },
      ];
    },
    images: {
      domains: ["api-dev.topdoc.ir", "api-rc.topdoc.ir", "api.doctop.com"],
    },
  }
);
