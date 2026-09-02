import { env } from './env';

export class GithubError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export class GithubAuthError extends GithubError {
  constructor(status: number) {
    super('Le jeton GitHub est invalide ou expiré : demandez à Théo de le renouveler dans Vercel.', status);
  }
}

export type FileChange = { path: string; content: Buffer | string } | { path: string; delete: true };

const API = 'https://api.github.com';

async function gh<T>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T }> {
  const { githubToken } = env();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${githubToken}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 || res.status === 403) throw new GithubAuthError(res.status);
  const text = await res.text();
  const data = (text ? JSON.parse(text) : null) as T;
  if (!res.ok && res.status !== 404) {
    const msg = (data as { message?: string } | null)?.message ?? res.statusText;
    throw new GithubError(`GitHub : ${msg}`, res.status);
  }
  return { status: res.status, data };
}

const clean = (p: string) => p.replace(/^\/+/, '');

/** File contents at the configured branch, or null when it does not exist. */
export async function getFile(path: string): Promise<Buffer | null> {
  const { githubRepo, githubBranch } = env();
  const { status, data } = await gh<{ content?: string; encoding?: string }>(
    'GET',
    `/repos/${githubRepo}/contents/${clean(path)}?ref=${encodeURIComponent(githubBranch)}`,
  );
  if (status === 404 || !data?.content) return null;
  return Buffer.from(data.content.replace(/\n/g, ''), 'base64');
}

export async function getText(path: string): Promise<string | null> {
  const buf = await getFile(path);
  return buf ? buf.toString('utf8') : null;
}

export interface DirEntry {
  name: string;
  path: string;
  type: 'file' | 'dir';
}

export async function listDir(path: string): Promise<DirEntry[]> {
  const { githubRepo, githubBranch } = env();
  const { status, data } = await gh<DirEntry[] | { message: string }>(
    'GET',
    `/repos/${githubRepo}/contents/${clean(path)}?ref=${encodeURIComponent(githubBranch)}`,
  );
  if (status === 404 || !Array.isArray(data)) return [];
  return data.map((e) => ({ name: e.name, path: e.path, type: e.type }));
}

/**
 * One commit for any number of file additions/updates/deletions (Git Data API):
 * blobs → tree (based on the branch head) → commit → move the branch ref.
 */
export async function commitFiles(message: string, changes: FileChange[]): Promise<string> {
  if (changes.length === 0) throw new Error('Rien à enregistrer.');
  const { githubRepo, githubBranch } = env();
  const base = `/repos/${githubRepo}/git`;

  const ref = await gh<{ object: { sha: string } }>('GET', `${base}/ref/heads/${encodeURIComponent(githubBranch)}`);
  if (ref.status === 404) throw new GithubError(`La branche ${githubBranch} n’existe pas.`, 404);
  const headSha = ref.data.object.sha;
  const head = await gh<{ tree: { sha: string } }>('GET', `${base}/commits/${headSha}`);

  const tree: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string | null }> = [];
  for (const change of changes) {
    const path = clean(change.path);
    if ('delete' in change) {
      tree.push({ path, mode: '100644', type: 'blob', sha: null });
      continue;
    }
    const buf = typeof change.content === 'string' ? Buffer.from(change.content, 'utf8') : change.content;
    const blob = await gh<{ sha: string }>('POST', `${base}/blobs`, { content: buf.toString('base64'), encoding: 'base64' });
    tree.push({ path, mode: '100644', type: 'blob', sha: blob.data.sha });
  }

  const newTree = await gh<{ sha: string }>('POST', `${base}/trees`, { base_tree: head.data.tree.sha, tree });
  const commit = await gh<{ sha: string }>('POST', `${base}/commits`, {
    message,
    tree: newTree.data.sha,
    parents: [headSha],
    author: { name: 'Admin du site', email: 'admin@site-dominique-stipa.local' },
  });
  await gh('PATCH', `${base}/refs/heads/${encodeURIComponent(githubBranch)}`, { sha: commit.data.sha, force: false });
  return commit.data.sha;
}
