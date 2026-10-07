// toolkits/react — draw into a surface with React (one root per window).

import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";

import type { Surface } from "../compositor";

export function mountReact(surface: Surface, element: ReactElement) {
  const root = createRoot(surface.el);
  root.render(element);
  surface.onClose(() => root.unmount());
}
