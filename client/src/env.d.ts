/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ZITADEL_AUTHORITY: string
  readonly VITE_ZITADEL_CLIENT_ID: string
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
