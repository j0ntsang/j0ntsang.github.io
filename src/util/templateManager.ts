export class TemplateManager {
  static async loadTemplate(url: string): Promise<void> {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load template: ${url}`);
      const html = await res.text();

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      const template = tempDiv.querySelector("template");
      if (template) {
        document.body.appendChild(template);
      } else {
        console.error(`No <template> found in ${url}`);
      }
    } catch (error) {
      console.error("Error loading template:", error);
    }
  }

  static async loadTemplatesBatch(urls: string[]): Promise<void> {
    await Promise.all(
      urls.map(async (url) => {
        await this.loadTemplate(url);
      })
    );
  }

  static create(
    id: string,
    replacements?: Record<string, string>
  ): DocumentFragment | null {
    const template = document.getElementById(id) as HTMLTemplateElement | null;
    if (!template) {
      console.error(`Template with id "${id}" not found.`);
      return null;
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

  static createRoot(id: string): HTMLElement | null {
    const fragment = this.create(id);
    if (!fragment) return null;
    return fragment.querySelector("*") as HTMLElement | null;
  }

  static mount(
    fragment: DocumentFragment | Element | null,
    container: HTMLElement | null,
    position: "start" | "end" = "end"
  ): void {
    if (!fragment || !container) {
      console.error("Mount failed: missing fragment or container.");
      return;
    }

    if (position === "start") {
      container.prepend(fragment);
    } else {
      container.appendChild(fragment);
    }
  }
}
