/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CAPTION_WORKER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
