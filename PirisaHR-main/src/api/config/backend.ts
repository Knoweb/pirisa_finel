export const BACKEND_ORIGIN =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api";

export function backendUrl(path: string) {
  // Ensure the base is /api if not specified
  const base = BACKEND_ORIGIN;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  // If absolute URL is provided in env, use it. Otherwise, combine.
  if (base.startsWith("http")) {
    return `${base}${normalizedPath}`;
  }
  
  // Path-based routing: /api/login etc.
  return `${base}${normalizedPath}`;
}

