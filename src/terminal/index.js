import { Shell } from "./shell.js";
export async function startTerminal() {
  console.log("starting terminal...");
  const canvas = document.getElementById("terminal-canvas");
  if (!canvas) {
    console.error("terminal-canvas element not found");
    return;
  }
  const ctx = canvas.getContext("2d");

  // Resize canvas to match display resolution
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any previous scaling
    ctx.scale(dpr, dpr);
  }

  resizeCanvas();
  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  // rest of your setup (styles, shell, etc.)
  const bodyStyle = getComputedStyle(document.body);
  const bgColor = bodyStyle.backgroundColor || "#000000";
  const fontColor = bodyStyle.color || "#33ff33";
  const fontFamily = bodyStyle.fontFamily || "monospace";
  const fontSize = parseInt(bodyStyle.fontSize) || 16;

  let buffer = [];
  let input = "";
  let cursorVisible = true;
  let shell = new Shell();

  function print(line) {
    buffer.push(line);
  }

  function handleInput(e) {
    if (e.key === "Backspace") {
      input = input.slice(0, -1);
    } else if (e.key === "Enter") {
      print(`$ ${input}`);
      const out = shell.execute(input);
      out.split("\n").forEach(print);
      input = "";
    } else if (e.key.length === 1) {
      input += e.key;
    }
  }

  function render() {
    const lineHeight = fontSize * 1.4;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fontColor;
    ctx.textBaseline = "top";

    const maxLines = Math.floor(canvas.height / lineHeight);
    const visible = buffer.slice(-maxLines);
    visible.forEach((line, i) => {
      ctx.fillText(line, 10, i * lineHeight);
    });

    const cursor = cursorVisible ? "_" : " ";
    ctx.fillText(`$ ${input}${cursor}`, 10, visible.length * lineHeight);

    requestAnimationFrame(render);
  }

  print("hello, world");

  document.addEventListener("keydown", handleInput);
  setInterval(() => (cursorVisible = !cursorVisible), 500);
  requestAnimationFrame(render);
}
