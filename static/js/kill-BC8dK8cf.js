const I=`usage: kill [-INT|-TERM] <pid>...
`,o={INT:"SIGINT",SIGINT:"SIGINT",2:"SIGINT",TERM:"SIGTERM",SIGTERM:"SIGTERM",15:"SIGTERM"};async function T(n,t){var s;let e=n.slice(1),l="SIGTERM";if((s=e[0])!=null&&s.startsWith("-")){const r=o[e[0].slice(1).toUpperCase()];if(!r)return t.error(`kill: ${e[0].slice(1)}: invalid signal
${I}`),2;l=r,e=e.slice(1)}if(!e.length)return t.error(I),2;let i=0;for(const r of e)(!/^\d+$/.test(r)||!t.kill(Number(r),l))&&(t.error(`kill: (${r}) - No such process
`),i=1);return i}export{T as default};
