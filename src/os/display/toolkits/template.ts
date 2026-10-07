// toolkits/template — draw into a surface by cloning an HTML <template>.

import { TemplateManager } from "../../../util/templateManager";
import type { Surface } from "../compositor";

export function mountTemplate(surface: Surface, id: string, replacements?: Record<string, string>) {
  TemplateManager.mount(TemplateManager.create(id, replacements), surface.el);
}
