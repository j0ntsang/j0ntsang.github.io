import{C as t,p as i}from"./index-BT9eaOBn.js";import"./xterm-D1D2FVe3.js";import"./main.js";async function h(c,e){var r,a;e.write(`  ${i("cd",12)}${t.dim}Change directory (shell builtin)${t.reset}
`),e.write(`  ${i("exit",12)}${t.dim}Exit the shell; init starts a new one (builtin)${t.reset}
`);for(const n of["/usr/bin","/bin"])for(const $ of await e.readdir(n)){const o=await e.readFile(`${n}/${$}`),s=((r=o.match(/^#summary:\s*(.*)$/m))==null?void 0:r[1])??"",m=(a=o.match(/^#usage:\s*(.*)$/m))==null?void 0:a[1];e.write(`  ${t.cyan}${i($,12)}${t.reset}${t.dim}${s}${m?` — ${m}`:""}${t.reset}
`)}}export{h as default};
