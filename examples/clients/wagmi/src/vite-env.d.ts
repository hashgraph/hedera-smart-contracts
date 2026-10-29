/// <reference types="vite/client" />

import type { Buffer as BufferPolyfill } from 'buffer'

declare global {
  // Polyfilled in main.tsx for libraries that expect Node's Buffer in the browser
  var Buffer: typeof BufferPolyfill
}
