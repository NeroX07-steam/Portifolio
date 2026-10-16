/* XQRENS / Motion director
   Experiência editorial inspirada em cortes, zooms e transições de vídeos curtos.
   Animação apenas quando não houver preferência por movimento reduzido. */
(() => {
"use strict";
const start=()=>{
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch=matchMedia("(pointer: coarse)").matches;
const items=[...document.querySelectorAll("#xq-manga-grid .xq-manga-panel")];
const filterButtons=[...document.querySelectorAll("[data-xq-order]")];
const initial=items.slice();
const shelf=document.querySelector("#xq-manga-grid");
const reorder=mode=>{
if(!shelf)return;
const ordered=initial.slice();
if(mode!=="default")ordered.sort((a,b)=>a.dataset.title.localeCompare(b.dataset.title,"pt-BR")*(mode==="za"?-1:1));
ordered.forEach(node=>shelf.appendChild(node));
filterButtons.forEach(btn=>btn.classList.toggle("is-active",btn.dataset.xqOrder===mode));
};
filterButtons.forEach(btn=>btn.addEventListener("click",()=>reorder(btn.dataset.xqOrder)));
if(reduced)return;
const sections=[...document.querySelectorAll(".xq-manga-world,.ink-love-letter")];
const introObserver=new IntersectionObserver(entries=>{
 entries.forEach(({target,isIntersecting})=>{
  if(!isIntersecting)return;
  target.classList.add("xq-on-screen");
  introObserver.unobserve(target);
 });
},{threshold:.15});
sections.forEach(s=>introObserver.observe(s));
const titleElements=[...document.querySelectorAll(".xq-manga-title h2")];
titleElements.forEach(title=>{
 let fragment=document.createDocumentFragment();
 const words=title.textContent.trim().split(/\s+/);
 words.forEach((word,i)=>{
  const span=document.createElement("span");
  span.className="xq-motion-word";
  span.textContent=word;
  span.style.setProperty("--word-index",String(i));
  fragment.appendChild(span);
  if(i<words.length-1)fragment.appendChild(document.createTextNode(" "));
 });
 title.replaceChildren(fragment);
 title.classList.add("xq-motion-title");
});
const animateObserver=new IntersectionObserver(entries=>{
 for(const e of entries){
   if(!e.isIntersecting)continue;
   e.target.classList.add("xq-motion-playing");
   animateObserver.unobserve(e.target);
 }
},{threshold:.2});
titleElements.forEach(el=>animateObserver.observe(el));
/* Manga tiles pop in with a controlled stagger. */
const tileObserver=new IntersectionObserver(entries=>{
 for(const entry of entries){
  if(!entry.isIntersecting)continue;
  const el=entry.target;
  el.classList.add("xq-tile-in");
  tileObserver.unobserve(el);
 }
},{threshold:.08,rootMargin:"0px 0px -40px 0px"});
items.forEach((el,i)=>{
 el.style.setProperty("--tile-index",String(i%5));
 el.classList.add("xq-tile-ready");
 tileObserver.observe(el);
});
/* Decorative camera zoom on the love portrait, bounded and viewport-aware. */
const love=document.querySelector(".julya-photo img");
let raf=0;
if(love&&!touch){
const update=()=>{
const r=love.getBoundingClientRect();
const pos=(innerHeight/2-(r.top+r.height/2))/Math.max(innerHeight,1);
love.style.setProperty("--xq-love-offset",Math.max(-10,Math.min(10,pos*12)).toFixed(2)+"px");
raf=0;
};
addEventListener("scroll",()=>{
 if(raf)return;
 raf=requestAnimationFrame(update);
},{passive:true});
update();
}
/* Card tilt uses pointer position, resets on pointer exit. */
if(!touch){
 items.forEach(el=>{
 el.addEventListener("pointermove",e=>{
  const r=el.getBoundingClientRect();
  const x=(e.clientX-r.left)/r.width-.5;
  const y=(e.clientY-r.top)/r.height-.5;
  el.style.setProperty("--xq-rotate-y",(x*7).toFixed(2)+"deg");
  el.style.setProperty("--xq-rotate-x",(-y*6).toFixed(2)+"deg");
 },{passive:true});
 el.addEventListener("pointerleave",()=>{
  el.style.setProperty("--xq-rotate-x","0deg");
  el.style.setProperty("--xq-rotate-y","0deg");
 });
 });
}
/* Interactive lyric-style progress indicator based on scroll. */
const marker=document.createElement("div");
marker.className="xq-motion-progress";
marker.setAttribute("aria-hidden","true");
const fill=document.createElement("span");
marker.appendChild(fill);document.body.appendChild(marker);
let frame=false;
const paint=()=>{
 const h=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 fill.style.transform="scaleX("+Math.min(1,Math.max(0,scrollY/h))+")";
 frame=false;
};
addEventListener("scroll",()=>{
 if(!frame){frame=true;requestAnimationFrame(paint);}
},{passive:true});
paint();
};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
