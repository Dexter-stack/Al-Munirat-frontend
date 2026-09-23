/**
 * Minimal `:param` path compiler — just enough to match the routes used by
 * src/api/**\/*.ts against a concrete request URL, without pulling in a
 * path-matching dependency for what is a temporary, removable layer.
 */
export interface CompiledPath {
  regex: RegExp;
  keys: string[];
}

export function compilePath(path: string): CompiledPath {
  const keys: string[] = [];
  const pattern = path
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        keys.push(segment.slice(1));
        return "([^/]+)";
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return { regex: new RegExp(`^${pattern}/?$`), keys };
}

export function matchPath(compiled: CompiledPath, url: string): Record<string, string> | null {
  const match = compiled.regex.exec(url);
  if (!match) return null;
  const params: Record<string, string> = {};
  compiled.keys.forEach((key, i) => {
    params[key] = decodeURIComponent(match[i + 1]);
  });
  return params;
}
