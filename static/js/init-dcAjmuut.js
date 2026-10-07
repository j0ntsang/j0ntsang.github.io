import{u as i,t as r}from"./index-C90AZ0Ix.js";import"./xterm-D1D2FVe3.js";import"./main.js";async function w(a,t){t.write("\x1B[2J\x1B[H");try{t.write(i(await t.readFile("/etc/motd")).trim()+`

`)}catch{}for(;;)t.write(r("sh")),await t.spawn("/bin/sh",["sh"],{foreground:!0}),t.write(`
`)}export{w as default};
