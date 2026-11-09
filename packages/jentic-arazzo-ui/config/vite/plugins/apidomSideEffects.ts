import type { Plugin } from 'vite';

// @speclynx/apidom-ns-openapi-3-0 < 5.1.0 declares a non-existent `registration.mjs` in its
// package.json `sideEffects`, so bundlers treat `src/refractor/inspect.mjs` as side-effect free
// and drop the statements that attach `fixedFields` to the element classes. That breaks
// @speclynx/apidom-reference (pulled in by @jentic/arazzo-validator via @speclynx/apidom-ls) at
// module load with "Cannot read properties of undefined (reading 'name')".
// Fixed upstream in 5.1.0; this plugin can be removed once the apidom packages are bumped.
const inspectModule = /apidom-ns-openapi-3-0[\\/]src[\\/]refractor[\\/]inspect\.mjs$/;

export function apidomSideEffects(): Plugin {
  return {
    name: 'jentic:apidom-side-effects',
    transform: {
      filter: { id: inspectModule },
      handler(code) {
        return { code, map: null, moduleSideEffects: true };
      },
    },
  };
}
