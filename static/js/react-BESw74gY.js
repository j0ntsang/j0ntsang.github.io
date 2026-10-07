import{r as e,a,c}from"./main.js";var m=e(),n=a();function u(r,t){const o=c.createRoot(r.el);n.flushSync(()=>o.render(t)),r.onClose(()=>o.unmount())}export{u as m,m as r};
