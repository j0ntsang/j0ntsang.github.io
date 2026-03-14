export const CLEAR_SENTINEL = "\x1b[CLEAR]";

export class Shell {
  constructor() {
    this.env = {
      cwd: "/",
      files: {
        "readme.txt": `Welcome to my portfolio shell!

This terminal is currently under active development.
Type 'help' to see available commands.
Enjoy exploring!`,
      },
    };
  }

  execute(input) {
    const [command, ...args] = input.trim().split(/\s+/);
    switch (command) {
      case "echo":
        return args.join(" ");
      case "ls":
        return Object.keys(this.env.files).join("\n");
      case "cat":
        return this.env.files[args[0]] || `cat: ${args[0]}: No such file`;
      case "clear":
        return CLEAR_SENTINEL;
      case "help":
        return [
          "Available commands:",
          "  echo <text>   Print text to the terminal",
          "  ls            List files in the current directory",
          "  cat <file>    Print the contents of a file",
          "  clear         Clear the terminal screen",
          "  help          Show this help message",
        ].join("\n");
      default:
        return `command not found: ${command}`;
    }
  }
}
