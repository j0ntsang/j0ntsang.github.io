// fs/path — turns what a user typed ("~/october/../x") into an absolute path.

export function resolvePath(input: string, cwd: string, home: string): string {
  let path = input;
  if (path === "~" || path.startsWith("~/")) path = home + path.slice(1);
  if (!path.startsWith("/")) path = `${cwd}/${path}`;

  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return "/" + parts.join("/");
}

export const dirname = (p: string) => p.slice(0, p.lastIndexOf("/")) || "/";
export const basename = (p: string) => p.slice(p.lastIndexOf("/") + 1);

/** Display form: /home/guest/x → ~/x */
export const tildify = (p: string, home: string) =>
  p === home ? "~" : p.startsWith(home + "/") ? "~" + p.slice(home.length) : p;
