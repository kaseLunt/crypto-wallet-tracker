"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var a11yAddonAnnotations = require("@storybook/addon-a11y/preview");
var react_vite_1 = require("@storybook/react-vite");
var projectAnnotations = require("./preview");
// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
(0, react_vite_1.setProjectAnnotations)([a11yAddonAnnotations, projectAnnotations]);
