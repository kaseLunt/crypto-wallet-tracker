"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
var config_1 = require("vitest/config");
var vitest_plugin_1 = require("@storybook/addon-vitest/vitest-plugin");
var dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : node_path_1.default.dirname((0, node_url_1.fileURLToPath)(import.meta.url));
// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
exports.default = (0, config_1.defineConfig)({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          (0, vitest_plugin_1.storybookTest)({
            configDir: node_path_1.default.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
