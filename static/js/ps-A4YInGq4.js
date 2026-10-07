import{p as i}from"./index-C90AZ0Ix.js";import"./xterm-D1D2FVe3.js";import"./main.js";async function $(d,t){var o;t.write(`${i("PID",6)}${i("PPID",6)}CMD
`);for(const a of await t.readdir("/proc")){const r=await t.readFile(`/proc/${a}/status`),p=await t.readFile(`/proc/${a}/cmdline`),c=((o=r.match(/^PPid:\t(\d+)/m))==null?void 0:o[1])??"?";t.write(`${i(a,6)}${i(c,6)}${p.split("\0").join(" ")}
`)}}export{$ as default};
