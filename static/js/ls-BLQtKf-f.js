import{C as o}from"./index-BT9eaOBn.js";import"./xterm-D1D2FVe3.js";import"./main.js";async function d(n,t){const a=n.slice(1).length?n.slice(1):["."];let c=0;for(const e of a){const l=await t.stat(e);if(!l){t.error(`ls: ${e}: No such file or directory
`),c=1;continue}if(a.length>1&&t.write(`${e}:
`),l.type==="file"){t.write(`${e}
`);continue}const s=t.resolve(e),$=await t.readdir(e),f=await Promise.all($.map(async r=>{const i=await t.stat(s==="/"?`/${r}`:`${s}/${r}`);return(i==null?void 0:i.type)==="dir"?`${o.blue}${o.bold}${r}/${o.reset}`:r}));f.length&&t.write(f.join("  ")+`
`)}return c}export{d as default};
