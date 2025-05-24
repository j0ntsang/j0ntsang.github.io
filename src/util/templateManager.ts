// templateManager.ts

export class TemplateManager {
  /**
   * Loads an HTML template from a URL and appends it to document.body
   * @param url URL of the HTML template file
   */
  static async loadTemplate(url: string): Promise<void> {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load template: ${url}`);
      const html = await res.text();

      const container = document.createElement("div");
      container.innerHTML = html;

      const template = container.querySelector("template");
      if (template) {
        document.body.appendChild(template);
      } else {
        console.error(`No <template> found in ${url}`);
      }
    } catch (error) {
      console.error("Error loading template:", error);
    }
  }

  /**
   * Creates a cloned instance of the template by ID,
   * optionally replacing text content of selectors within.
   * @param id The template element ID
   * @param replacements Optional object mapping selectors to replacement strings
   * @returns DocumentFragment or null if not found
   */
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

  /**
   * Mounts a DocumentFragment or Element into a container element
   * @param fragment The DocumentFragment or Element to append
   * @param container The HTMLElement container to append into
   */
  static mount(
    fragment: DocumentFragment | Element | null,
    container: HTMLElement | null
  ): void {
    if (!fragment) {
      console.error("Nothing to mount: fragment is null");
      return;
    }
    if (!container) {
      console.error("Mount failed: container is null");
      return;
    }
    container.appendChild(fragment);
  }
}
