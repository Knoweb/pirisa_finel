export const BACKEND_ORIGIN =
  (import.meta.env.VITE_BACKEND_ORIGIN as string | undefined) ?? "";

export function backendUrl(path: string) {
  if (!BACKEND_ORIGIN) return path;
  if (!path) return BACKEND_ORIGIN;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_ORIGIN}${normalized}`;
}

