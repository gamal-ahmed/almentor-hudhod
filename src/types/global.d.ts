
interface Window {
  gapi: any;
  google: any;
  Dropbox: any;
}

// Type definitions for Cloud Storage Services
interface DropboxChooseOptions {
  success: (files: DropboxFile[]) => void;
  cancel: () => void;
  linkType: string;
  multiselect: boolean;
  folderselect: boolean;
  extensions?: string[];
}

interface DropboxFile {
  name: string;
  link: string;
  bytes: number;
  icon: string;
  thumbnailLink?: string;
  isDir?: boolean;
}

declare namespace EdgeRuntime {
  function waitUntil(promise: Promise<any>): void;
}
