import type { StorybookConfig } from "@storybook/react-vite";
import { resolve } from "path";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"],

  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },

  viteFinal: async (config) => {
    // Ensure proper alias resolution
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": resolve(__dirname, "../src"),
      };
    }

    // Fix for ES modules and global definitions
    config.define = {
      ...config.define,
      global: "globalThis",
    };

    return config;
  },

  docs: {
    autodocs: "tag",
  },
};

export default config;
