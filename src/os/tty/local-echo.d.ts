declare module "local-echo" {
  export default class LocalEchoController {
    constructor(term: unknown, options?: { historySize?: number });
    read(prompt: unknown, continuationPrompt?: string): Promise<string>;
    abortRead(reason?: string): void;
    print(message: string): void;
    applyPrompts(input: string): unknown;
    _active: boolean;
    _activePrompt: { prompt?: string; continuationPrompt?: string } | null;
  }
}
