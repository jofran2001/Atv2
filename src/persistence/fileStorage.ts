import * as fs from 'fs';
import * as path from 'path';

// Use process.cwd() to resolve data directory reliably when running via ts-node or compiled
const DATA_DIR = path.resolve(process.cwd(), 'data');

export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function saveToFile(fileName: string, content: string) {
  ensureDataDir();
  const p = path.join(DATA_DIR, fileName);
  fs.writeFileSync(p, content, { encoding: 'utf8' });
}

export function appendToFile(fileName: string, content: string) {
  ensureDataDir();
  const p = path.join(DATA_DIR, fileName);
  fs.appendFileSync(p, content + '\n', { encoding: 'utf8' });
}

export function loadFile(fileName: string): string | null {
  const p = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, { encoding: 'utf8' });
}

export function listDataFiles(): string[] {
  ensureDataDir();
  return fs.readdirSync(DATA_DIR);
}
