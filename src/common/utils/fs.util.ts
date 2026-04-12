import fs from 'fs';

export function ensureDir(path: string) {
  fs.mkdirSync(path, { recursive: true });
}
