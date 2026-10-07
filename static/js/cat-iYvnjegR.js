async function n(r,e){let a=0;for(const c of r.slice(1))try{const t=await e.readFile(c);e.write(t.endsWith(`
`)?t:t+`
`)}catch(t){e.error(`cat: ${t.message}
`),a=1}return a}export{n as default};
