import React, { useId, useRef } from 'react';
import { ControlButton } from 'reactflow';
import './DiagramNavigationHelp.css';

export function DiagramNavigationHelp({ isMac }: { isMac: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <ControlButton
        title="Diagram navigation"
        aria-label="Diagram navigation"
        aria-haspopup="dialog"
        onClick={(event) => {
          event.currentTarget.focus({ preventScroll: true });
          dialog.current?.showModal();
        }}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="10" cy="6.5" r="1.1" fill="currentColor" />
          <path d="M10 9v5" stroke="currentColor" strokeWidth="2" />
        </svg>
      </ControlButton>
      <dialog ref={dialog} aria-labelledby={titleId} className="arazzo-navigation-help">
        <h2 id={titleId}>Diagram navigation</h2>
        <dl>
          <dt>Pan</dt>
          <dd>Scroll, swipe with two fingers, or drag the canvas background.</dd>
          <dt>Zoom</dt>
          <dd>
            Hold <kbd>{isMac ? '⌘ Cmd' : 'Ctrl'}</kbd> and scroll, pinch on a trackpad, or use the +
            and − buttons.
          </dd>
          <dt>Zoom in or out by double-clicking</dt>
          <dd>
            Double-click the canvas background to zoom in. Hold <kbd>Shift</kbd> and double-click to
            zoom out.
          </dd>
          <dt>Fit to view</dt>
          <dd>
            Press <kbd>F</kbd> while pointing at the diagram or when it has keyboard focus. You can
            also use the Fit View button.
          </dd>
        </dl>
        <form method="dialog">
          <button type="submit">Close</button>
        </form>
      </dialog>
    </>
  );
}
