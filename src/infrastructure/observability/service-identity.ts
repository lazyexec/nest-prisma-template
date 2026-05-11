import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Resolves `service.name` and `service.version` for OTel resource attributes
 * and Pino's `service` field — without depending on Nest's ConfigService,
 * which doesn't exist yet at process boot when tracing.bootstrap.ts runs.
 *
 *   serviceName    ← APP_NAME env var, falls back to 'nest-prisma-template'
 *   serviceVersion ← SERVICE_VERSION env var (e.g. a git SHA or release tag),
 *                    falls back to the `version` field in package.json,
 *                    falls back to '0.0.0' if package.json can't be read.
 *
 * The SERVICE_VERSION override exists so CI/CD can stamp builds with a SHA
 * without bumping package.json on every release.
 */

const FALLBACK_NAME = 'nest-prisma-template';
const FALLBACK_VERSION = '0.0.0';

const readPackageVersion = (): string => {
  try {
    const raw = readFileSync(resolve(process.cwd(), 'package.json'), 'utf8');
    const parsed = JSON.parse(raw) as { version?: unknown };
    return typeof parsed.version === 'string' && parsed.version.length > 0
      ? parsed.version
      : FALLBACK_VERSION;
  } catch {
    return FALLBACK_VERSION;
  }
};

export const serviceName: string =
  process.env.APP_NAME?.trim() || FALLBACK_NAME;

export const serviceVersion: string =
  process.env.SERVICE_VERSION?.trim() || readPackageVersion();
