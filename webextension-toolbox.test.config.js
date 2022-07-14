const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  target: "test-dist/[vendor]",
  webpack: (config) => {
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: "manifest.json",
            to: "manifest.json",
            transform(content, path) {
              const manifest = JSON.parse(content.toString());
              manifest.name += " (test)";
              manifest.permissions.push("tabs");
              manifest.host_permissions = ["*://*/*"];
              return JSON.stringify(manifest, null, 2);
            },
            force: true,
          },
        ],
      })
    );

    return config;
  },
};
