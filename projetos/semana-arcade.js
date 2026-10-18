/* ==============================================================
   XQRENS · SEMANA VIVA | Leituras semanais + Roleta de JJS
   Sem backend, sem login e sem APIs privadas.
   Fuso da semana: America/Sao_Paulo (segunda 00:00).
   ============================================================== */
(()=>{
  "use strict";
  function whenReady(fn){
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn,{once:true});
    else fn();
  }
  whenReady(()=>{
    const $=(selector,root=document)=>root.querySelector(selector);
    const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
    const msDay=86400000,msWeek=msDay*7,TWO_PI=Math.PI*2;
    const reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
    const FUSO="America/Sao_Paulo";
    const weekFmt=new Intl.DateTimeFormat("en-US",{timeZone:FUSO,year:"numeric",month:"2-digit",day:"2-digit"});
    const dateFmt=new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"});
    const dateSmall=new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short",timeZone:"UTC"});
    const store={
      read(key,fallback=null){try{return JSON.parse(localStorage.getItem("xqrens:semana:v1:"+key))??fallback}catch{return fallback}},
      write(key,value){try{localStorage.setItem("xqrens:semana:v1:"+key,JSON.stringify(value));return true}catch{return false}}
    };
    function zoneWeek(){
      const values={};
      weekFmt.formatToParts(new Date()).forEach(p=>{if(p.type!=="literal")values[p.type]=Number(p.value);});
      const utc=Date.UTC(values.year,values.month-1,values.day);
      const weekday=new Date(utc).getUTCDay();
      const monday=utc-((weekday+6)%7)*msDay;
      const untilSunday=monday+6*msDay;
      const mondayISO=new Date(monday).toISOString().slice(0,10);
      const anchor=Date.UTC(2026,9,12);
      return {monday,untilSunday,key:mondayISO,weekIndex:Math.max(0,Math.floor((monday-anchor)/msWeek))};
    }
    function weekLabel(week){
      return dateSmall.format(new Date(week.monday)).toUpperCase()+" → "+
        dateFmt.format(new Date(week.untilSunday)).toUpperCase();
    }
    function notify(message){
      const node=$("#ink-toast");
      if(node){
        node.textContent=message;
        node.classList.add("is-visible");
        clearTimeout(notify.timer);
        notify.timer=setTimeout(()=>node.classList.remove("is-visible"),3300);
      }
    }
    function setText(id,value){const node=$(id);if(node)node.textContent=String(value);}
    function tag(name,classes,textContent){
      const node=document.createElement(name);
      if(classes)node.className=classes;
      if(textContent!=null)node.textContent=textContent;
      return node;
    }
    const currWeek=zoneWeek();
    const storedReading=store.read("lidos",[]);
    const seen=new Set(Array.isArray(storedReading)?storedReading.filter(id=>typeof id==="string"):[]);
    const catalog=window.XQ_MANGAS_SEMANA;
    const books=Array.isArray(catalog?.itens)?catalog.itens.filter(book=>(
      typeof book.titulo==="string"&&typeof book.id==="string"&&typeof book.descricao==="string"
    )):[];
    const groups=Math.floor(books.length/3);
    function mondayKeyForWeek(weekIndex){
      return new Date(Date.UTC(2026,9,12)+weekIndex*msWeek).toISOString().slice(0,10);
    }
    function booksForWeek(weekIndex){
      const key=mondayKeyForWeek(weekIndex);
      const edition=catalog?.edicoes?.[key];
      if(Array.isArray(edition)&&edition.length===3){
        const resolved=edition.map(id=>books.find(item=>item.id===id));
        if(resolved.every(Boolean)&&new Set(resolved.map(x=>x.id)).size===3)return resolved;
      }
      if(!groups)return [];
      const index=weekIndex%groups;
      return books.slice(index*3,index*3+3);
    }
    const weekBooks=booksForWeek(currWeek.weekIndex);
    const readingGrid=$("#xq-weekly-manga-grid");

    function drawWeeklyBooks(){
      if(!readingGrid)return;
      setText("#xq-weekly-date",weekLabel(currWeek));
      setText(".xq-weekly-books .xq-weekly-eyebrow","CLUBE DE LEITURA / SEMANA "+String(currWeek.weekIndex+1).padStart(2,"0"));
      const nextDate=new Date(currWeek.monday+msWeek);
      setText("#xq-weekly-next","PRÓXIMA TROCA: "+dateFmt.format(nextDate).toUpperCase()+" · 00H BRASÍLIA");
      if(weekBooks.length!==3){
        readingGrid.replaceChildren(tag("p","xq-weekly-disclaimer","O catálogo semanal está sendo atualizado. Volte em instantes."));
        return;
      }
      const icons=["✳","◌","✿","♡","☾","∴","﹡"];
      const cards=weekBooks.map((book,index)=>{
        const card=tag("article","xq-weekly-manga-card");
        card.append(
          tag("span","xq-weekly-num",String(index+1).padStart(2,"0")+" / 03"),
          tag("span","xq-weekly-illustration",icons[(index+currWeek.weekIndex)%icons.length]),
          tag("span","xq-weekly-tag",book.tema||"HISTÓRIA PARA PENSAR"),
          tag("h3","",book.titulo),
          tag("span","xq-weekly-author","POR "+(book.autor||"AUTORIA NÃO INFORMADA")),
          tag("p","",book.descricao)
        );
        card.querySelector(".xq-weekly-illustration")?.setAttribute("aria-hidden","true");
        if(book.aviso)card.append(tag("span","xq-weekly-alert","ATENÇÃO / "+book.aviso));
        const actions=tag("div","xq-weekly-card-bottom");
        const link=tag("a","","CONHECER OBRA / EDIÇÃO LEGAL ↗");
        let checked;
        try{
          const url=new URL(book.link);
          const hosts=["sevenseasentertainment.com","www.viz.com","editorajbc.com.br","www.google.com","www.kodansha.us","kodansha.us"];
          checked=url.protocol==="https:"&&hosts.includes(url.hostname)?url.href:null;
        }catch{checked=null;}
        link.href=checked||("https://books.google.com/books?q="+encodeURIComponent(book.titulo));
        link.target="_blank";link.rel="noopener noreferrer";
        const button=tag("button","xq-weekly-read");
        button.type="button";
        button.setAttribute("aria-label","Marcar leitura de "+book.titulo);
        const sync=()=>{
          const done=seen.has(book.id);
          button.setAttribute("aria-pressed",String(done));
          button.textContent=done?"✓ MARCADO COMO LIDO":"◌ MARCAR COMO LIDO";
        };
        button.addEventListener("click",()=>{
          if(seen.has(book.id))seen.delete(book.id);
          else seen.add(book.id);
          if(!store.write("lidos",[...seen]))notify("O navegador não permitiu salvar o progresso.");
          sync();updateProgress();
        });
        sync();
        actions.append(link,button);
        card.append(actions);
        return card;
      });
      readingGrid.replaceChildren(...cards);
      updateProgress();
      const previous=$("#xq-weekly-history-list");
      if(previous){
        previous.replaceChildren();
        if(currWeek.weekIndex===0){
          previous.append(tag("p","","As escolhas anteriores aparecerão aqui a partir da próxima segunda-feira."));
        }else{
          const first=Math.max(0,currWeek.weekIndex-5);
          for(let w=currWeek.weekIndex-1;w>=first;w--){
            const names=booksForWeek(w).map(b=>b.titulo);
            const row=tag("div","xq-weekly-history-row");
            row.append(tag("span","","SEMANA "+String(w+1).padStart(2,"0")),tag("p","",names.join(" · ")));
            previous.append(row);
          }
        }
      }
      if(currWeek.weekIndex>=groups&&!catalog?.edicoes?.[currWeek.key]){
        setText("#xq-weekly-next","CATÁLOGO EM RODÍZIO · NOVOS TÍTULOS PODEM ENTRAR NAS PRÓXIMAS SEMANAS");
      }
    }
    function updateProgress(){
      const count=weekBooks.filter(book=>seen.has(book.id)).length;
      setText("#xq-weekly-readcount",count+" DE 3 MARCADOS COMO LIDOS");
    }
    drawWeeklyBooks();

    /* ROSTER PÚBLICO DE JJS, conferido em outubro de 2026.
       Sem Mahoraga (invocação), sem Register (Early Access) nem personagens especiais/admin.
       Sky Assassin ficou público na versão 1.83. */
    const ROSTER=[
      ["honored","Honored One","Satoru Gojo","Completo"],
      ["vessel","Vessel","Yuji Itadori","Completo"],
      ["gambler","Restless Gambler","Kinji Hakari","Completo"],
      ["shadows","Ten Shadows","Megumi Fushiguro","Completo"],
      ["perfection","Perfection","Mahito","Completo"],
      ["blood","Blood Manipulator","Choso","Completo"],
      ["switcher","Switcher","Aoi Todo","Completo"],
      ["attorney","Defense Attorney","Hiromi Higuruma","Completo"],
      ["partners","Cursed Partners","Yuta Okkotsu","Completo"],
      ["puppet","Puppet Master","Kokichi Muta","Completo"],
      ["hei","Head of the Hei","Naoya Zenin","Completo"],
      ["salaryman","Salaryman","Kento Nanami","Completo"],
      ["plants","Disaster Plants","Hanami","Completo"],
      ["cannon","True Cannon","Ryu Ishigori","Completo"],
      ["locust","Locust Guy","Ko-Guy","Somente base"],
      ["star","Star Rage","Yuki Tsukumo","Somente base"],
      ["mangaka","Aspiring Mangaka","Charles Bernard","Somente base"],
      ["coward","Lucky Coward","Haruta Shigemo","Somente base"],
      ["crow","Crow Charmer","Mei Mei","Somente base"],
      ["death","Black Death","Kurourushi","Somente base"],
      ["sky","Sky Assassin","Takako Uro","Somente base"]
    ].map(([id,name,character,type])=>({id,name,character,type}));
    const gameSection=$("#roleta-jjs");
    const canvas=$("#xq-jjs-wheel"),ctx=canvas?.getContext?.("2d")??null;
    const spinBtn=$("#xq-jjs-spin");
    const storageKey="jjs-progress:"+currWeek.key;
    const storedCount=store.read(storageKey,0);
    let spun=Math.min(3,Math.max(0,Number.isInteger(storedCount)?storedCount:0));
    let spinning=false,rotation=0;

    function hashSeed(value){
      let hash=2166136261;
      for(let i=0;i<value.length;i++){
        hash^=value.charCodeAt(i);
        hash=Math.imul(hash,16777619);
      }
      return hash>>>0;
    }
    function random(seed){
      let value=seed>>>0;
      return ()=>{
        value=(value+0x6D2B79F5)|0;
        let t=Math.imul(value^(value>>>15),1|value);
        t=(t+Math.imul(t^(t>>>7),61|t))^t;
        return ((t^(t>>>14))>>>0)/4294967296;
      };
    }
    function shuffledRoster(key){
      const result=ROSTER.slice();
      const rand=random(hashSeed("XQRENS.JJS.2026."+key));
      for(let i=result.length-1;i>0;i--){
        const j=Math.floor(rand()*(i+1));
        [result[i],result[j]]=[result[j],result[i]];
      }
      return result;
    }
    const weeklyWinners=shuffledRoster(currWeek.key).slice(0,3);
    function selected(){return weeklyWinners.slice(0,spun);}
    function remain(){
      const used=new Set(selected().map(x=>x.id));
      return ROSTER.filter(x=>!used.has(x.id));
    }
    function screenText(){
      setText("#xq-jjs-week",weekLabel(currWeek));
      setText("#xq-jjs-round",String(spun).padStart(2,"0")+" / 03");
      setText("#xq-jjs-remaining",remain().length+" NOMES RESTANTES NA ROLETA");
      const picked=$("#xq-jjs-picks");
      if(picked){
        const saved=selected();
        const rows=Array.from({length:3},(_,i)=>{
          const item=saved[i];
          const li=tag("li",item?"is-picked":"");
          const content=tag("div");
          li.append(tag("span","",String(i+1).padStart(2,"0")));
          content.append(
            tag("strong","",item?item.name:"???"),
            tag("small","",item?(item.character.toUpperCase()+" · DEFINIDO PRA SEMANA"):"AGUARDANDO SORTEIO")
          );
          li.append(content);
          return li;
        });
        picked.replaceChildren(...rows);
      }
      if(spinBtn){
        spinBtn.disabled=spinning||spun>=3;
        spinBtn.innerHTML=spun>=3?"TRIO DEFINIDO / ATÉ SEGUNDA <span aria-hidden='true'>✓</span>":
          spinning?"SORTEANDO... <span aria-hidden='true'>◌</span>":
          "GIRAR "+String(spun+1)+" / 3 <span aria-hidden='true'>↗</span>";
      }
      if(spun===3){
        setText("#xq-jjs-result","SEM REROLL: "+weeklyWinners.map(x=>x.name).join(" + ")+". TROCA NA SEGUNDA.");
      }else if(spun){
        setText("#xq-jjs-result",spinning?"GIRANDO...":"SAIU "+weeklyWinners[spun-1].name.toUpperCase()+". FALTAM "+(3-spun)+" GIRO(S).");
      }else{
        setText("#xq-jjs-result","3 GIROS DISPONÍVEIS. SÓ VALEM OS PRIMEIROS 3.");
      }
    }
    const rosterList=$("#xq-jjs-roster-list");
    if(rosterList){
      rosterList.replaceChildren(...ROSTER.map(entry=>{
        const card=tag("div","xq-jjs-roster-item");
        card.append(tag("b","",entry.type.toUpperCase()),
          tag("strong","",entry.name),
          tag("small","",entry.character));
        return card;
      }));
    }
    function fitCanvas(){
      if(!canvas||!ctx)return;
      const ratio=Math.min(2,window.devicePixelRatio||1);
      const logical=640;
      const size=Math.round(logical*ratio);
      if(canvas.width!==size||canvas.height!==size){
        canvas.width=size;canvas.height=size;
      }
      ctx.setTransform(ratio,0,0,ratio,0,0);
    }
    const WHEEL_PALETTE=["#d8b5a7","#9ca8a1","#bbb2b2","#d2c4b0","#a5a4b0","#d3a498","#c7c7b6"];
    function drawWheel(pool,angle=0){
      if(!ctx)return;
      fitCanvas();
      ctx.clearRect(0,0,640,640);
      const cx=320,cy=320,rad=304;
      ctx.save();ctx.translate(cx,cy);
      // Moldura discreta e segmentos radiais.
      ctx.beginPath();ctx.arc(0,0,316,0,TWO_PI);
      ctx.fillStyle="#282930";ctx.fill();
      ctx.beginPath();ctx.arc(0,0,rad+4,0,TWO_PI);
      ctx.strokeStyle="#e5d9c8";ctx.lineWidth=6;ctx.stroke();
      const count=pool.length;
      if(!count){ctx.restore();return;}
      const arc=TWO_PI/count;
      for(let i=0;i<count;i++){
        const start=-Math.PI/2+angle+i*arc,end=start+arc,mid=start+arc/2;
        ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,rad,start,end,false);ctx.closePath();
        ctx.fillStyle=WHEEL_PALETTE[i%WHEEL_PALETTE.length];ctx.fill();
        ctx.strokeStyle="#23252b";ctx.lineWidth=1.9;ctx.stroke();
        const name=pool[i].name;
        ctx.save();ctx.rotate(mid);ctx.translate(rad*.60,0);
        ctx.rotate(Math.PI/2);
        ctx.fillStyle="#25242a";ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.font="600 "+(count>17?12:count>10?14:17)+"px DM Sans, sans-serif";
        ctx.fillText(name,0,0,Math.min(195,rad*.61));
        ctx.restore();
      }
      ctx.beginPath();ctx.arc(0,0,67,0,TWO_PI);
      ctx.fillStyle="#18191f";ctx.fill();
      ctx.restore();
    }
    function finishSpin(){
      spinning=false;
      spun=Math.min(3,spun+1);
      store.write(storageKey,spun);
      screenText();
      drawWheel(remain(),0);
      rotation=0;
      if(spun===3)notify("Trio da semana definido. Sem reroll!");
      else notify("Saiu "+weeklyWinners[spun-1].name+". Faltam "+(3-spun)+" giros.");
    }
    function startSpin(){
      if(spinning||spun>=3)return;
      const pool=remain(),winner=weeklyWinners[spun];
      const winIndex=pool.findIndex(entry=>entry.id===winner.id);
      if(winIndex<0)return;
      spinning=true;screenText();
      if(reduced||!ctx||!("requestAnimationFrame" in window)){
        finishSpin();return;
      }
      const arc=TWO_PI/pool.length;
      const target=(-((winIndex+.5)*arc)%TWO_PI+TWO_PI)%TWO_PI;
      const initial=((rotation%TWO_PI)+TWO_PI)%TWO_PI;
      const correction=(target-initial+TWO_PI)%TWO_PI;
      const end=rotation+(6+spun)*TWO_PI+correction;
      const initialRotation=rotation;
      const start=performance.now(),duration=3100+spun*200;
      function animate(now){
        const fraction=Math.max(0,Math.min(1,(now-start)/duration));
        const ease=1-Math.pow(1-fraction,5);
        rotation=initialRotation+(end-initialRotation)*ease;
        drawWheel(pool,rotation);
        if(fraction<1)requestAnimationFrame(animate);
        else finishSpin();
      }
      requestAnimationFrame(animate);
    }
    spinBtn?.addEventListener("click",startSpin);
    screenText();drawWheel(remain());
    // Se o navegador redimensionar, redesenhar a roleta sem criar novos sorteios.
    let resizeQueued=false;
    window.addEventListener("resize",()=>{
      if(resizeQueued)return;resizeQueued=true;
      requestAnimationFrame(()=>{if(!spinning)drawWheel(remain(),rotation);resizeQueued=false;});
    },{passive:true});

    // Uma semana é definida pelo calendário de Brasília, não pelo horário da Vercel.
    setInterval(()=>{
      const latest=zoneWeek();
      if(latest.key!==currWeek.key&&!spinning){
        window.location.reload();
      }
    },60000);
  });
})();
