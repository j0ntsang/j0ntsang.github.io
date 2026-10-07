declare module "local-echo" {
  export default class LocalEchoController {
    constructor(term: unknown, options?: { historySize?: number });
    read(prompt: unknown, continuationPrompt?: string): Promise<string>;
    abortRead(reason?: string): void;
    print(message: string): void;
    applyPrompts(input: string): unknown;
    printWide(items: string[], padding?: number): void;
    printAndRestartPrompt(callback: () => void): void;
    handleCursorInsert(data: string): void;
    handleData(data: string): void;
    _active: boolean;
    _input: string;
    _cursor: number;
    _activePrompt: { prompt?: string; continuationPrompt?: string } | null;
  }
}
