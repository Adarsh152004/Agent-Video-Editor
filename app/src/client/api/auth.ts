const storageKey = 'agent-video-editor-token';

export function clientToken(): string | null {
  const hashQuery = location.hash.includes('?') ? location.hash.slice(location.hash.indexOf('?') + 1) : '';
  const fromUrl = new URLSearchParams(hashQuery).get('t');
  if (fromUrl) {
    sessionStorage.setItem(storageKey, fromUrl);
    history.replaceState(null, '', `${location.pathname}${location.search}#/`);
    return fromUrl;
  }
  return sessionStorage.getItem(storageKey);
}

export function clearClientToken(): void {
  sessionStorage.removeItem(storageKey);
}

export function authHeaders(): Record<string, string> {
  const token = clientToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
