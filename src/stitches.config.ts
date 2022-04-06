import { createCss, StitchesCss } from '@stitches/react';

export const stitchesConfig = createCss({
  theme: {
    colors: {
      pageBackground: 'rgb(240,240,240)',
      backgroundContrast: 'rgb(216,216,216)',
      highContrast: 'rgb(0,0,0)',
      lowContrast: 'rgb(128,128,128)',
      formElementsBackground: 'rgb(250,250,250)',
      red: 'hsl(0,100%,50%)',
      orange: 'hsl(30,100%,50%)',
      yellow: 'hsl(51,100%,40%)',
      green: 'hsl(120,100%,33%)', // same as rgb(0,168,0)
      blue: 'hsl(240,100%,50%)',
      purple: 'hsl(270,100%,60%)',
    },
    fonts: {
      mono: 'monospace',
    },
  },
});

export type CSS = StitchesCss<typeof stitchesConfig>;

export const {
  styled,
  theme,
  keyframes,
  global: createGlobalCss,
} = stitchesConfig;

export const darkThemeClass = theme({
  colors: {
    pageBackground: 'rgb(32,32,32)',
    backgroundContrast: 'rgb(64,64,64)',
    highContrast: 'rgb(192,192,192)',
    lowContrast: 'rgb(136,136,136)',
    formElementsBackground: 'rgb(20,20,20)',
    red: 'hsl(0,100%,50%)',
    orange: 'hsl(30,90%,50%)',
    yellow: 'hsl(60,88%,50%)',
    green: 'hsl(120,85%,42%)',
    blue: 'hsl(210,100%,60%)',
    purple: 'hsl(270,85%,60%)',
  },
});

export const globalCss = createGlobalCss({
  // unset all styles on interactive elements
  'button, input, select, textarea, a, area': {
    all: 'unset',
  },
  // box-sizing
  '*, *::before, *::after': {
    boxSizing: 'border-box',
  },
  html: {
    fontSize: '18px',
  },
  // set base styles for the app
  body: {
    padding: 0,
    margin: 0,
    lineHeight: '1.8rem',
    letterSpacing: '.3px',
    color: '$highContrast',
    fontFamily: 'Barlow, sans-serif',
    // use word-break instead of "overflow-wrap: anywhere" because of Safari support
    wordBreak: 'break-word',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    textSizeAdjust: 'none',
  },
  code: {
    fontFamily: '$mono',
  },
  // pass down height: 100% to the #root div
  'body, html': {
    height: '100%',
    backgroundColor: '$pageBackground',
  },
  '#root': {
    minHeight: '100%',
    backgroundColor: 'inherit',
  },
});
