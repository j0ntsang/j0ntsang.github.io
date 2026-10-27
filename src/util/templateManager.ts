export class TemplateManager {
  static async loadTemplate(url: string): Promise<void> {
    const resolvedUrl = new URL(url, document.baseURI).toString();
    const res = await fetch(resolvedUrl).catch((cause) => {
      throw new Error(`Failed to fetch template ${resolvedUrl}`, { cause });
    });
    if (!res.ok) {
      throw new Error(`Failed to load template ${resolvedUrl}: HTTP ${res.status}`);
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = await res.text();

    const template = tempDiv.querySelector("template");
    if (!template) throw new Error(`No <template> found in ${resolvedUrl}`);
    document.body.appendChild(template);
  }

  static create(
    id: string,
    replacements?: Record<string, string>
  ): DocumentFragment {
    const template = document.getElementById(id);
    if (!(template instanceof HTMLTemplateElement)) {
      throw new Error(`Template "${id}" not found; was it loaded?`);
    }

    const clone = document.importNode(template.content, true);

    if (replacements) {
      Object.entries(replacements).forEach(([selector, text]) => {
        const el = clone.querySelector(selector);
        if (el) el.textContent = text;
      });
    }

    return clone;
  }

  static createRoot(id: string): HTMLElement {
    const root = this.create(id).firstElementChild;
    if (!(root instanceof HTMLElement)) {
      throw new Error(`Template "${id}" has no root element`);
    }
    return root;
  }

  static mount(fragment: Node, container: ParentNode): void {
    container.append(fragment);
  }
}
