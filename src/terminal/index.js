import { Shell } from "./shell.js";

const canvas = document.getElementById("terminal-canvas");
const ctx = canvas.getContext("2d");

let config = {};
let buffer = [];
let input = "";
let cursorVisible = true;
let shell = null;

async function loadConfig() {
  const res = await fetch("config.json");
  config = await res.json();
}

async function loadWelcomeMessage() {
  const path = config.welcomeMessage;
  if (path.endsWith(".txt")) {
    const res = await fetch(path);
    return await res.text();
  }
  if (path.endsWith(".html")) {
    const res = await fetch(path);
    const html = await res.text();
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }
  return "";
}

function print(line) {
  buffer.push(line);
  if (buffer.length > config.scrollbackLimit) {
    buffer = buffer.slice(-config.scrollbackLimit);
  }
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
  const lineHeight = config.fontSize * 1.4;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = getComputedStyle(document.body).font;
  ctx.fillStyle = "#33ff33";
  ctx.textBaseline = "top";

  const maxLines = Math.floor(canvas.height / lineHeight);
  const visible = buffer.slice(-maxLines);
  visible.forEach((line, i) => {
    ctx.fillText(line.slice(0, config.lineWidth), 10, i * lineHeight);
  });

  const cursor = cursorVisible ? "_" : " ";
  ctx.fillText(`$ ${input}${cursor}`, 10, visible.length * lineHeight);
  requestAnimationFrame(render);
}

// Init
(async function main() {
  await loadConfig();
  shell = new Shell();
  const welcome = await loadWelcomeMessage();
  welcome.split("\n").forEach(print);
  document.addEventListener("keydown", handleInput);
  setInterval(() => (cursorVisible = !cursorVisible), 500);
  requestAnimationFrame(render);
})();
