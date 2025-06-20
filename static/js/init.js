(function(){"use strict";const f=`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  @supports not selector(::-webkit-scrollbar) {
    html {
      scrollbar-width: thin;
      scrollbar-color: var(--scrollbar-thumb-color) transparent;
    }
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thumb-color);
    border-radius: 0;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: var(--scrollbar-thumb-hover);
  }

  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .container {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    grid-column-gap: 0;
    grid-row-gap: 0;
    grid-template-areas:
    "waybar waybar"
    "master sidebar";
    width: 100%;
    height: 100%;
    padding: 24px;
  }

  @media (min-width: 768px) {
    .container {
      grid-template-columns: minmax(auto, max-content) auto;
      grid-template-rows: auto 1fr;
    }
  }

  .waybar {
    display: flex;
    grid-area: waybar;
    height: 32px;
    margin-bottom: 16px;
    background-color: currentColor;
    border-radius: 4px;
  }

  .waybar--right {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    margin-right: 0;
    margin-left: auto;
  }

  .master {
    grid-area: master;
    padding: 24px 0 8px 24px;
    overflow: hidden;
  }

  .sidebar {
    grid-area: sidebar;
  }

  .window {
    border-width: 1px;
    border-color: transparent;
    border-style: solid;
    border-radius: 0;
  }

  .window:focus-within {
    border-color: currentColor;
    border-radius: 4px;
  }
`;class b extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"});const e=document.createElement("template");e.innerHTML=`
        <style>${f}</style>
        <div class="container">
            <nav class="waybar">
              <div class="waybar--left">
                <slot name="waybar-left"></slot>
              </div>
              <div class="waybar--right">
                <slot name="waybar-right"></slot>
              </div>
            </nav>
            <main class="master window">
              <slot name="master"></slot>
            </main>
            <sidebar class="sidebar">
              <slot name="sidebar"></slot>
            </sidebar>
        </div>
      `,this.shadowRoot.appendChild(e.content.cloneNode(!0))}connectedCallback(){console.log("WindowManager connected")}}customElements.define("window-manager",b);class s{static async loadTemplate(e){try{const t=await fetch(e);if(!t.ok)throw new Error(`Failed to load template: ${e}`);const o=await t.text(),a=document.createElement("div");a.innerHTML=o;const l=a.querySelector("template");l?document.body.appendChild(l):console.error(`No <template> found in ${e}`)}catch(t){console.error("Error loading template:",t)}}static async loadTemplatesBatch(e){await Promise.all(e.map(async t=>{await this.loadTemplate(t)}))}static create(e,t){const o=document.getElementById(e);if(!o)return console.error(`Template with id "${e}" not found.`),null;const a=document.importNode(o.content,!0);return t&&Object.entries(t).forEach(([l,i])=>{const r=a.querySelector(l);r&&(r.textContent=i)}),a}static createRoot(e){const t=this.create(e);return t?t.querySelector("*"):null}static mount(e,t,o="end"){if(!e||!t){console.error("Mount failed: missing fragment or container.");return}o==="start"?t.prepend(e):t.appendChild(e)}}function w(){const n=document.getElementById("fullscreenToggle");if(!n)return;const e=n.querySelector(".fullscreen-toggle-icon");n.addEventListener("click",()=>{const o=document.documentElement;document.fullscreenElement?document.exitFullscreen?document.exitFullscreen():document.webkitExitFullscreen?document.webkitExitFullscreen():document.msExitFullscreen&&document.msExitFullscreen():o.requestFullscreen?o.requestFullscreen():o.webkitRequestFullscreen?o.webkitRequestFullscreen():o.msRequestFullscreen&&o.msRequestFullscreen()});function t(){e&&(e.innerHTML=document.fullscreenElement?"&#x29C9;":"&#x26F6;")}document.addEventListener("fullscreenchange",t),t()}function y(){const n=document.querySelector('input[name="dark_mode"]'),e=document.querySelector('input[name="animation"]'),t=window.matchMedia("(prefers-color-scheme: dark)").matches;function o(){const c=localStorage.getItem("theme");return c==="dark"||c==="light"?c:t?"dark":"light"}function a(c){document.documentElement.classList.remove("dark","light"),document.documentElement.classList.add(c)}function l(){return localStorage.getItem("animation")==="true"}function i(c){document.documentElement.classList.toggle("animation",c)}const r=o();a(r);const m=l();i(m),n&&(n.checked=r==="dark",n.disabled=!1,n.addEventListener("change",c=>{const d=c.target.checked?"dark":"light";a(d),localStorage.setItem("theme",d)})),e&&(e.checked=m,e.disabled=!1,e.addEventListener("change",c=>{const d=c.target.checked;i(d),localStorage.setItem("animation",String(d))}))}async function x(){await s.loadTemplatesBatch(["/templates/fullscreen-toggle.html","/templates/terminal.html","/templates/settings-menu.html"]);const n=document.querySelector("window-manager"),e=document.getElementById("fullscreen"),t=document.getElementById("settings");if(!n||!t||!e)throw new Error("Template Manager failed to find container nodes.");const o=s.createRoot("terminal");o&&o.setAttribute("slot","master");const a=s.create("fullscreen-toggle"),l=s.create("settings-menu");if(!o||!l||!a)throw new Error("Template Manager failed to create a clone");s.mount(a,e),w(),s.mount(l,t),y(),s.mount(o,n)}class v{constructor(){this.env={cwd:"/",files:{"readme.txt":`Welcome to my new portfolio shell!

        This terminal is currently under active development.
        Type 'help' to see available commands.
        Enjoy exploring!`}}}execute(e){const[t,...o]=e.trim().split(/\s+/);switch(t){case"echo":return o.join(" ");case"ls":return Object.keys(this.env.files).join(`
`);case"cat":return this.env.files[o[0]]||`cat: ${o[0]}: No such file`;case"help":return"echo ls cat help";default:return`command not found: ${t}`}}}function u(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function k(){const n=getComputedStyle(document.body);return{fontFamily:n.fontFamily,fontSize:n.fontSize,fontWeight:n.fontWeight,fontStyle:n.fontStyle}}function p({user:n="guest",isAdmin:e=!1}={}){const t=window.location.hostname||"localhost",o=window.location.pathname?`~${window.location.pathname}`:"~";return`${n}@${t}:${o}${e?"#":"$"}`}const g={lineWidth:80};function E(n,e){Object.assign(n.style,{position:"relative",height:"100%"}),n.innerHTML="";const t=document.createElement("pre");t.id="terminal-output",t.setAttribute("role","log"),t.setAttribute("aria-live","polite"),t.setAttribute("aria-atomic","false"),Object.assign(t.style,{color:"var(--text-color)",backgroundColor:"var(--background-color)",maxWidth:`${g.lineWidth}ch`,height:"calc(100% - 1.5em)",boxSizing:"border-box",userSelect:"text",paddingBottom:"1em",paddingRight:"24px",overflowY:"auto",whiteSpace:"normal"});const o=document.createElement("div");Object.assign(o.style,{position:"absolute",bottom:0,left:0,display:"flex",alignItems:"center",width:"calc(100% - 32px)",maxWidth:`${g.lineWidth}ch`,height:"2em",fontFamily:e.fontFamily,fontSize:e.fontSize,fontStyle:e.fontStyle,backgroundColor:"var(--background-color)",color:"var(--text-color)"});const a=document.createElement("span");a.setAttribute("aria-hidden","true"),a.style.userSelect="none",a.style.fontWeight="bold";const l=p("guest");a.textContent=l;const i=document.createElement("div");i.id="input-wrapper",i.style.flex="1";const r=document.createElement("div");r.id="terminal-input",r.contentEditable=!0,r.spellcheck=!1,r.setAttribute("role","textbox"),r.setAttribute("aria-multiline","false"),r.setAttribute("aria-label","Terminal input"),Object.assign(r.style,{caretColor:"var(--text-color)",color:"var(--text-color)",background:"transparent",paddingLeft:"8px",fontWeight:600,userSelect:"text",outline:"none"}),i.appendChild(r),o.appendChild(a),o.appendChild(i),n.appendChild(t),n.appendChild(o)}function S(n,e,t,o,a="<strong>Hello, World</strong>"){function l(i){const r=i.trim();r&&(t.insertAdjacentHTML("beforeend",r),t.insertAdjacentHTML("beforeend","<br>"),t.scrollTop=t.scrollHeight)}l(a),console.log("Terminal connected"),n.addEventListener("click",()=>e.focus()),e.focus(),e.addEventListener("keydown",i=>{if(i.key==="Enter"){i.preventDefault();const r=e.textContent.trim();if(!r){e.textContent="";return}const m=u(r).trim(),c=p("guest");l(`${c} ${m}`),o.execute(r).trim().split(`
`).forEach(d=>{l(u(d))}),e.textContent=""}})}async function T(n){const e=document.getElementById("terminal-container");if(!e){console.error("terminal-container element not found");return}const t=k();E(e,t);const o=e.querySelector("#terminal-output"),a=e.querySelector("#terminal-input"),l=new v;let i="<strong>Hello, World</strong>";try{const r=await fetch(n);r.ok?i=await r.text():console.warn(`Failed to load ${n}, using fallback text.`)}catch(r){console.error("Error loading HTML file:",r)}S(e,a,o,l,i)}document.addEventListener("DOMContentLoaded",async()=>{try{await x(),await T("/templates/motd.html")}catch(n){console.error("Initialization failed",n)}})})();
