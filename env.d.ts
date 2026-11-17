/// <reference types="vite/client" />

interface ViteTypeOptions {
  // Only the declared variables exist: a typo or a removed one (VITE_BACKEND_URL) fails type-check
  strictImportMetaEnv: unknown
}

// Declare client variables here, in an `interface ImportMetaEnv { readonly VITE_X?: string }`. There
// are none today: the back is always reached on the front's own origin.
