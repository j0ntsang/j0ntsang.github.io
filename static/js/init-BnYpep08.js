import{u as i}from"./index-CNQXKcrr.js";import"./xterm-D1D2FVe3.js";import"./main.js";async function o(r,t){t.write("\x1B[2J\x1B[H");try{t.write(i(await t.readFile("/etc/motd")).trim()+`

`)}catch{}for(await t.spawn("/usr/bin/sysinfo",["sysinfo","start"]);;)await t.spawn("/bin/sh",["sh"],{foreground:!0}),t.write(`
`)}export{o as default};
