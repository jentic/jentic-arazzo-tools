import React from 'react';
import { createRoot } from 'react-dom/client';
import { ArazzoUIStandalone } from '../src/ArazzoUIStandalone';

// set by scripts/dev.mjs from `npm run dev -- --ignore-unsupported-version`
declare const __ARAZZO_UI_IGNORE_UNSUPPORTED_VERSION__: boolean | undefined;

const ignoreUnsupportedVersion =
  typeof __ARAZZO_UI_IGNORE_UNSUPPORTED_VERSION__ !== 'undefined' &&
  __ARAZZO_UI_IGNORE_UNSUPPORTED_VERSION__;

const documentURL = new URL('./petstore-order-workflow.arazzo.yaml', document.baseURI).toString();

const root = createRoot(document.getElementById('root')!);
root.render(
  <ArazzoUIStandalone document={documentURL} ignoreUnsupportedVersion={ignoreUnsupportedVersion} />,
);
