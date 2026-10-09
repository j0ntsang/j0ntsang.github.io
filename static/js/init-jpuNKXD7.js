import{u as r}from"./index-BT9eaOBn.js";import"./xterm-D1D2FVe3.js";import"./main.js";async function o(i,t){t.write("\x1B[2J\x1B[H");try{t.write(r(await t.readFile("/etc/motd")).trim()+`

`)}catch{}for(;;)await t.spawn("/bin/sh",["sh"],{foreground:!0}),t.write(`
`)}export{o as default};
