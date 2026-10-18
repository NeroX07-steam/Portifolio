/* ==========================================================================
   XQRENS / Portfolio v3
   Pequenas interações. HTML legível mesmo com JavaScript desligado.
   ========================================================================== */
(()=>{
  "use strict";
  const run=()=>{
    const menuButton=document.getElementById("menuToggle");
    const menu=document.getElementById("site-nav");
    const links=menu?[...menu.querySelectorAll('a[href^="#"]')]:[];
    const closeMenu=()=>{
      if(!menu||!menuButton)return;
      menu.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded","false");
      menuButton.setAttribute("aria-label","Abrir menu");
    };
    if(menu&&menuButton){
      menuButton.addEventListener("click",()=>{
        const active=menuButton.getAttribute("aria-expanded")==="true";
        menu.classList.toggle("is-open",!active);
        menuButton.setAttribute("aria-expanded",String(!active));
        menuButton.setAttribute("aria-label",active?"Abrir menu":"Fechar menu");
      });
      links.forEach(link=>link.addEventListener("click",closeMenu));
      document.addEventListener("keydown",event=>{
        if(event.key==="Escape"&&menu.classList.contains("is-open")){
          closeMenu();
          menuButton.focus();
        }
      });
      document.addEventListener("pointerdown",event=>{
        if(!menu.classList.contains("is-open"))return;
        if(!menu.contains(event.target)&&!menuButton.contains(event.target))closeMenu();
      });
      window.addEventListener("resize",()=>{
        if(window.innerWidth>900)closeMenu();
      },{passive:true});
    }

    // A aba ativa acompanha o conteúdo visível sem alterar os links.
    const sections=links.map(link=>document.querySelector(link.getAttribute("href"))).filter(Boolean);
    if("IntersectionObserver" in window&&sections.length){
      const observer=new IntersectionObserver(entries=>{
        const intersecting=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
        if(!intersecting.length)return;
        const activeId=intersecting[0].target.id;
        links.forEach(link=>{
          const active=link.getAttribute("href")==="#"+activeId;
          link.classList.toggle("active",active);
          if(active)link.setAttribute("aria-current","location");
          else link.removeAttribute("aria-current");
        });
      },{rootMargin:"-20% 0px -57% 0px",threshold:[0,.05,.2,.5]});
      sections.forEach(section=>observer.observe(section));
    }

    // Catálogo de projetos: 19 cards reais no HTML, com busca local.
    const grid=document.getElementById("projectGrid");
    const query=document.getElementById("projectSearch");
    const counter=document.getElementById("projectCount");
    const more=document.getElementById("showAllProjects");
    const empty=document.getElementById("noProjects");
    const buttons=[...document.querySelectorAll(".filter-btn[data-filter]")];
    if(!grid||!query||!counter||!more)return;

    const cards=[...grid.querySelectorAll(".project-card")];
    const START_VISIBLE=6;
    let category="todos";
    let expanded=false;
    const normalize=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
    const announce=(visible,filtered)=>{
      if(!visible)counter.textContent="Nenhum projeto encontrado";
      else if(filtered)counter.textContent=visible+" projeto"+(visible===1?" encontrado":"s encontrados");
      else if(!expanded)counter.textContent="Mostrando "+Math.min(START_VISIBLE,cards.length)+" de "+cards.length+" projetos";
      else counter.textContent="Mostrando todos os "+cards.length+" projetos";
    };
    function draw(){
      const term=normalize(query.value.trim());
      const filtered=category!=="todos"||Boolean(term);
      let visible=0;
      cards.forEach((card,index)=>{
        const content=(card.dataset.title||"")+" "+(card.querySelector("p")?.textContent||"");
        const matchesTerm=!term||normalize(content).includes(term);
        const matchesCategory=category==="todos"||card.dataset.category===category;
        const matches=matchesTerm&&matchesCategory;
        card.hidden=!matches||(!filtered&&!expanded&&index>=START_VISIBLE);
        if(!card.hidden)visible++;
      });
      buttons.forEach(button=>{
        const active=button.dataset.filter===category;
        button.setAttribute("aria-pressed",String(active));
      });
      more.hidden=filtered;
      if(!filtered){
        more.setAttribute("aria-expanded",String(expanded));
        more.textContent=expanded?"Mostrar menos projetos ↑":"Ver todos os "+cards.length+" trabalhos ↓";
      }
      if(empty)empty.hidden=visible!==0;
      announce(visible,filtered);
    }
    query.addEventListener("input",draw);
    buttons.forEach(button=>button.addEventListener("click",()=>{
      category=button.dataset.filter||"todos";
      draw();
    }));
    more.addEventListener("click",()=>{
      expanded=!expanded;
      draw();
      if(!expanded){
        const start=document.getElementById("projetos");
        const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
        start?.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
      }
    });
    draw();
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});
  else run();
})();
