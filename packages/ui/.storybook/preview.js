"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../src/styles/globals.css");
var preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        backgrounds: {
            default: "light",
            values: [
                {
                    name: "light",
                    value: "#ffffff",
                },
                {
                    name: "dark",
                    value: "#0f0f0f",
                },
                {
                    name: "crypto-dark",
                    value: "#1a1a1a",
                },
            ],
        },
        docs: {
            toc: true,
        },
    },
    globalTypes: {
        theme: {
            description: "Global theme for components",
            defaultValue: "light",
            toolbar: {
                title: "Theme",
                icon: "paintbrush",
                items: ["light", "dark"],
                dynamicTitle: true,
            },
        },
    },
};
exports.default = preview;
