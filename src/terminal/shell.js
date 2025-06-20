export class Shell {
  constructor() {
    this.env = {
      cwd: "/",
      files: {
        "readme.txt": `Welcome to my new portfolio shell!

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
      case "help":
        return "echo ls cat help";
      default:
        return `command not found: ${command}`;
    }
  }
}
