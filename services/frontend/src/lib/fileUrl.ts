/**
 * Converts a file path (relative or absolute GCS URL) to a full URL.
 * - Absolute URLs (http/https) are returned as-is.
 * - Relative paths are prefixed with the API origin.
 */
const API_ORIGIN =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086").replace(
    /\/api\/v1$/,
    ""
  );

export function fileUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}
