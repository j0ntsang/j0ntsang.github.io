import{u as r}from"./index-DSNm40g5.js";import"./xterm-D1D2FVe3.js";import"./main.js";const a=1e3,s=5,n=5,c=i=>new Promise(t=>setTimeout(t,i));async function d(i,t){t.write("\x1B[2J\x1B[H");try{t.write(r(await t.readFile("/etc/motd")).trim()+`

`)}catch{}let e=0;for(;;){const o=Date.now();await t.spawn("/bin/sh",["sh"],{foreground:!0}),t.write(`
`),e=Date.now()-o<a?e+1:0,e>=s&&(t.error(`init: Id "sh" respawning too fast: disabled for ${n} minutes
`),await c(n*6e4))}}export{d as default};
