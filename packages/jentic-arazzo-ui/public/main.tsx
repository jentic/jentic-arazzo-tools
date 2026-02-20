import React from 'react';
import { createRoot } from 'react-dom/client';
import { ArazzoUIStandalone } from '../src/ArazzoUIStandalone';

const documentURL = new URL('./petstore-order-workflow.arazzo.yaml', document.baseURI).toString();

const root = createRoot(document.getElementById('root')!);
root.render(<ArazzoUIStandalone document={documentURL} />);
