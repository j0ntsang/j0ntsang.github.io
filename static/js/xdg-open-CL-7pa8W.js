import{C as n}from"./index-BaEHzNSm.js";import"./xterm-D1D2FVe3.js";import"./main.js";async function u(o,e){var t;const i=await e.readFile(e.exe),r=o[1]??((t=i.match(/^#url:\s*(\S+)/m))==null?void 0:t[1]);if(!r)return e.error(`usage: xdg-open <url>
`),1;e.write(`${n.dim}Opening ${r}…${n.reset}
`),e.openUrl(r)}export{u as default};
