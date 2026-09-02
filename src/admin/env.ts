/**
 * Runtime configuration for the admin. Read lazily so the public static build
 * never needs these variables.
 */
export interface AdminEnv {
  githubToken: string;
  githubRepo: string; // "owner/name"
  githubBranch: string;
  sessionSecret: string;
}

function read(name: string): string | undefined {
  // Vercel functions expose env vars on process.env; Astro dev also fills import.meta.env from .env
  const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  return fromProcess ?? fromMeta;
}

let cached: AdminEnv | null = null;

export function env(): AdminEnv {
  if (cached) return cached;
  const missing: string[] = [];
  const get = (name: string) => {
    const v = read(name);
    if (!v) missing.push(name);
    return v ?? '';
  };
  const result: AdminEnv = {
    githubToken: get('GITHUB_TOKEN'),
    githubRepo: get('GITHUB_REPO'),
    githubBranch: read('GITHUB_BRANCH') || 'master',
    sessionSecret: get('SESSION_SECRET'),
  };
  if (missing.length > 0) {
    throw new Error(
      `Configuration incomplète : variable(s) ${missing.join(', ')} manquante(s). Demandez à Théo de les renseigner dans Vercel.`,
    );
  }
  cached = result;
  return result;
}
