import React, { createRef } from 'react';
import { createRoot, Root } from 'react-dom/client';

import { ArazzoUIStandalone as ArazzoUIStandaloneComponent } from './ArazzoUIStandalone';
import type { ArazzoUIRef, ViewerMode } from './types/index';
import type { ArazzoDocument } from './types/arazzo';

export interface ArazzoUIStandaloneConfig {
  dom_id?: string;
  domNode?: HTMLElement;
  document: ArazzoDocument | string;
  initialView?: ViewerMode;
  activeWorkflowId?: string | null;
  selectedNodeId?: string | null;
  onNodeSelect?: (nodeId: string, node: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onEdgeSelect?: (edgeId: string, edge: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onWorkflowSelect?: (workflowId: string) => void;
  onViewChange?: (view: ViewerMode) => void;
}

export interface ArazzoUIStandaloneInstance {
  unmount(): void;
  getRef(): ArazzoUIRef | null;
}

function ArazzoUIStandalone(config: ArazzoUIStandaloneConfig): ArazzoUIStandaloneInstance {
  const { dom_id, domNode, ...props } = config;
  const container = domNode ?? (dom_id ? globalThis.document.querySelector(dom_id) : null);

  if (!container) {
    throw new Error(
      'ArazzoUIStandalone: provide either dom_id (CSS selector) or domNode (HTMLElement)',
    );
  }

  const ref = createRef<ArazzoUIRef>();
  const root: Root = createRoot(container as HTMLElement);

  root.render(React.createElement(ArazzoUIStandaloneComponent, { ...props, ref }));

  return {
    unmount: () => root.unmount(),
    getRef: () => ref.current,
  };
}

export default ArazzoUIStandalone;
