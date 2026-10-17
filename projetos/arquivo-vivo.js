/* =========================================================================
   XQRENS / ARQUIVO VIVO 2.0
   Interações independentes do script legado. Sem API keys.
   Dados pessoais editados nesta página ficam SOMENTE neste navegador.
   ========================================================================= */
(() => {
  "use strict";
  const ready = handler => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", handler, { once:true });
    else handler();
  };
  ready(() => {
    const $ = (selector,root=document) => root.querySelector(selector);
    const $$ = (selector,root=document) => [...root.querySelectorAll(selector)];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const prefix="xqrens:arquivo-vivo:v2:";
    const local={
      get(key) { try {return localStorage.getItem(prefix+key);} catch {return null;} },
      set(key,value) {try {localStorage.setItem(prefix+key,value);return true;}catch {return false;} },
      remove(key) {try {localStorage.removeItem(prefix+key);return true;}catch {return false;} }
    };
    function toast(message) {
      const node=$("#ink-toast");
      if (!node) {console.info("XQRENS:",message);return;}
      node.textContent=String(message);
      node.classList.add("is-visible");
      clearTimeout(toast.timer);
      toast.timer=setTimeout(()=>node.classList.remove("is-visible"),3100);
    }
    function text(node,value){if(node)node.textContent=String(value);}
    function safeTask(fn,label) {
      try{fn();}catch(error){console.error("Arquivo Vivo / "+label,error);}
    }
    /* VISUAL: progressive reveal, IntersectionObserver with fallback */
    safeTask(()=>{
      const elements=$$(".xq2-edition .xq2-reveal");
      if(reduceMotion||!("IntersectionObserver" in window)){
        elements.forEach(node=>node.classList.add("xq2-in"));return;
      }
      const observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting)return;
          entry.target.classList.add("xq2-in");
          observer.unobserve(entry.target);
        });
      },{threshold:.045,rootMargin:"0px 0px -35px 0px"});
      elements.forEach(node=>observer.observe(node));
    },"revelações");
    /* 02: QUATRO CARTAS • nada é salvo ou enviado */
    safeTask(()=>{
      const letters={
        escuta:["CARTA 01 / PRA JULYA","Obrigado por me escutar.","Entre tantas conversas, tem uma coisa que eu nunca quero tratar como pequena: poder ser eu mesmo perto de você. Isso vale muito para mim."],
        gostos:["CARTA 02 / PRA JULYA","O nosso universo particular.","Nossas referências, nossos gostos e até as coisas estranhas que a gente entende do mesmo jeito me lembram que eu encontrei companhia de verdade."],
        gestos:["CARTA 03 / PRA JULYA","Nem sempre sei demonstrar.","Às vezes as palavras demoram e os gestos saem diferentes do que eu queria. Mesmo assim, o meu carinho por você é real e eu quero aprender a demonstrar melhor."],
        futuro:["CARTA 04 / PRA JULYA","Cuidar do que a gente tem.","Não preciso adivinhar cada página que vem pela frente. Só quero continuar prestando atenção em você, nas coisas pequenas e no nosso jeito de estar juntos."]
      };
      const label=$("#xq2-letter-number"),title=$("#xq2-letter-heading"),body=$("#xq2-letter-body");
      $$(".xq2-letter-trigger").forEach(button=>button.addEventListener("click",()=>{
        const data=letters[button.dataset.letter];
        if(!data)return;
        text(label,data[0]);text(title,data[1]);text(body,data[2]);
        $$(".xq2-letter-trigger").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
        if(!reduceMotion&&title?.animate)title.animate(
          [{opacity:.25,transform:"translateY(9px)"},{opacity:1,transform:"translateY(0)"}],
          {duration:460,easing:"ease-out"});
      }));
    },"cartas");

    /* 03: TOFU WORLD • contagem local, não é um jogo de verdade */
    safeTask(()=>{
      const count=$("#xq2-tofu-count"),response=$("#xq2-tofu-response");
      let pets=Math.min(9999,Math.max(0,Number(local.get("tofu-pets"))||0));
      text(count,pets);
      const reactions={
        carinho:["Tofu recebeu um carinho virtual. ♡","Tofu está sendo tratado como realeza. ♡","Mais um carinho registrado no arquivo da família."],
        brincar:["Tofu aceitou o convite para brincar. ✳","Brincadeira aprovada pelo conselho do Tofu.","Aparentemente, o Tofu tem uma agenda lotada de diversão."],
        foto:["Uma foto digna de um álbum de família. ◌","O Tofu continua fotogênico, sem nenhum esforço.","Foto contemplada. Dia produtivo."]
      };
      let sequence=0;
      $$("[data-pet-action]").forEach(button=>button.addEventListener("click",()=>{
        const action=button.dataset.petAction;
        const options=reactions[action];
        if(!options)return;
        text(response,options[sequence++%options.length]);
        if(action==="carinho"||action==="brincar"){
          pets=Math.min(9999,pets+1);text(count,pets);
          if(!local.set("tofu-pets",String(pets)))toast("Não foi possível salvar carinhos neste dispositivo.");
        }
        if(action==="foto"){
          const image=$(".xq2-tofu-photo img");
          if(!reduceMotion&&image?.animate)image.animate(
            [{transform:"scale(1)"},{transform:"scale(1.045)"},{transform:"scale(1)"}],
            {duration:750,easing:"ease-in-out"});
        }
      }));
      $("#xq2-tofu-reset")?.addEventListener("click",()=>{
        if(!confirm("Zerar os carinhos virtuais?"))return;
        pets=0;text(count,"0");local.remove("tofu-pets");
        text(response,"Um novo dia para encher o Tofu de carinho.");
      });
    },"Tofu World");

    /* 04: SALA DE MÚSICA • destaque manual, nunca anuncia reprodução ao vivo */
    safeTask(()=>{
      const form=$("#xq2-track-form"),title=$("#xq2-track-title"),artist=$("#xq2-track-artist");
      const trackName=$("#xq2-track-summary"),trackArtist=$("#xq2-track-artist-view");
      const vinyl=$("#xq2-vinyl-panel");
      const key="track";
      const parse=()=>{
        try{const a=JSON.parse(local.get(key)||"null");
          if(!a||typeof a.title!=="string"||typeof a.artist!=="string")return null;
          return {title:a.title.slice(0,90),artist:a.artist.slice(0,80)};
        }catch{return null;}
      };
      function draw(saved){
        text(trackName,saved?.title||"Nenhuma faixa escolhida.");
        text(trackArtist,saved?.artist?("ARTISTA / "+saved.artist+" · ESCOLHIDA MANUALMENTE"):
          "Esse destaque só existe neste navegador. Não mostra reprodução em tempo real.");
        // O destaque musical NÃO representa uma reprodução em tempo real.
        const old=$("#xq2-track-search-link");
        old?.remove();
        if(saved){
          const link=document.createElement("a");
          link.id="xq2-track-search-link";
          link.className="xq2-action";
          link.textContent="BUSCAR FAIXA NO SPOTIFY ↗";
          link.href="https://open.spotify.com/search/"+encodeURIComponent(saved.title+" "+saved.artist);
          link.target="_blank";link.rel="noopener noreferrer";
          trackArtist?.after(link);
        }
      }
      $("#xq2-vinyl-toggle")?.addEventListener("click",event=>{
        if(reduceMotion){toast("Movimento reduzido está ativo. O vinil fica parado.");return;}
        const isSpinning=vinyl?.classList.toggle("xq2-music-playing");
        event.currentTarget.setAttribute("aria-pressed",String(Boolean(isSpinning)));
        event.currentTarget.textContent=isSpinning?"PARAR O DISCO ■":"GIRAR O DISCO ♫";
      });
      const saved=parse();
      if(saved){title.value=saved.title;artist.value=saved.artist;}
      draw(saved);
      form?.addEventListener("submit",event=>{
        event.preventDefault();
        const selected={title:title.value.trim().slice(0,90),artist:artist.value.trim().slice(0,80)};
        if(!selected.title||!selected.artist){toast("Preencha nome da faixa e artista.");return;}
        if(!local.set(key,JSON.stringify(selected))){toast("O navegador bloqueou o armazenamento.");return;}
        draw(selected);toast("Destaque musical guardado somente neste dispositivo.");
      });
      $("#xq2-track-clear")?.addEventListener("click",()=>{
        local.remove(key);form?.reset();draw(null);toast("Destaque musical removido deste dispositivo.");
      });
    },"sala de música");

    /* SPOTIFY PLAYER OFICIAL + PLAYER LOCAL
       Spotify only loads after explicit user interaction.
       Never accepts arbitrary iframe URLs or uploads personal audio.
    */
    safeTask(()=>{
      const form=$("#xq2-spotify-form"),input=$("#xq2-spotify-url");
      const container=$("#xq2-spotify-embed"),status=$("#xq2-spotify-feedback");
      const clearBtn=$("#xq2-spotify-clear"),key="spotify-embed-link";
      if(!form||!input||!container||!status)return;

      const allowedTypes=new Set(["track","playlist","album","episode","show"]);
      function parseSpotify(inputString){
        const raw=String(inputString||"").trim();
        let type="",id="";
        const uri=/^spotify:(track|playlist|album|episode|show):([A-Za-z0-9]{22})$/i.exec(raw);
        if(uri){
          type=uri[1].toLowerCase();
          id=uri[2];
        }else{
          let url;
          try{url=new URL(raw);}catch{return null;}
          if(url.protocol!=="https:"||url.hostname!=="open.spotify.com"||url.port)return null;
          const parts=url.pathname.split("/").filter(Boolean);
          if(/^intl-[a-z]{2,3}$/i.test(parts[0]||""))parts.shift();
          if(parts[0]==="embed")parts.shift();
          if(parts.length!==2)return null;
          type=parts[0].toLowerCase();
          id=parts[1];
        }
        if(!allowedTypes.has(type)||!/^[A-Za-z0-9]{22}$/.test(id))return null;
        return {
          url:"https://open.spotify.com/"+type+"/"+id,
          embed:"https://open.spotify.com/embed/"+type+"/"+id,
          type
        };
      }
      function message(value,error=false){
        text(status,value);
        status.classList.toggle("is-error",Boolean(error));
      }
      function clearPlayer(){
        // Removing the iframe releases Spotify playback when changing tracks.
        container.replaceChildren();
        container.hidden=true;
      }
      function mount(data){
        clearPlayer();
        const frame=document.createElement("iframe");
        frame.src=data.embed;
        frame.title="Player incorporado do Spotify";
        frame.loading="lazy";
        frame.allow="autoplay; encrypted-media; fullscreen; picture-in-picture";
        frame.referrerPolicy="strict-origin-when-cross-origin";
        frame.setAttribute("allowfullscreen","");
        frame.setAttribute("height","352");
        frame.setAttribute("width","100%");
        container.append(frame);
        container.hidden=false;
        message("Player do Spotify carregado. Clique em reproduzir dentro dele.");
      }
      const previouslySaved=local.get(key);
      if(previouslySaved && parseSpotify(previouslySaved)){
        input.value=previouslySaved;
        message("Link anterior recuperado deste navegador. Clique em ABRIR PLAYER para carregar.");
      }
      form.addEventListener("submit",event=>{
        event.preventDefault();
        const data=parseSpotify(input.value);
        if(!data){
          clearPlayer();
          message("Link inválido. Copie a URL de uma faixa, playlist, álbum ou episódio em open.spotify.com.",true);
          input.focus();
          return;
        }
        input.value=data.url;
        mount(data);
        local.set(key,data.url);
      });
      clearBtn?.addEventListener("click",()=>{
        clearPlayer();
        input.value="";
        local.remove(key);
        message("Player removido. Cole outro link para ouvir.");
      });
    },"spotify embed");

    safeTask(()=>{
      const input=$("#xq2-local-audio"),player=$("#xq2-local-audio-player");
      const panel=$("#xq2-local-player"),name=$("#xq2-local-name");
      const status=$("#xq2-local-feedback"),clear=$("#xq2-local-clear");
      if(!input||!player||!panel)return;
      let activeUrl=null;
      const formats=new Set(["audio/mpeg","audio/mp3","audio/mp4","audio/x-m4a","audio/ogg","audio/wav","audio/x-wav"]);
      const extensions=/\.(mp3|m4a|ogg|wav)$/i;
      function unload(){
        player.pause();
        player.removeAttribute("src");
        player.load();
        if(activeUrl){URL.revokeObjectURL(activeUrl);activeUrl=null;}
        panel.hidden=true;
      }
      input.addEventListener("change",()=>{
        const file=input.files?.[0];
        if(!file)return;
        unload();
        if(file.size===0||file.size>30*1024*1024){
          text(status,"Escolha um arquivo de áudio de até 30 MB.");
          input.value="";
          return;
        }
        if((file.type&&!formats.has(file.type))||!extensions.test(file.name)){
          text(status,"Formato não compatível. Use MP3, M4A, OGG ou WAV.");
          input.value="";
          return;
        }
        activeUrl=URL.createObjectURL(file);
        player.src=activeUrl;
        text(name,file.name);
        panel.hidden=false;
        text(status,"Arquivo carregado só neste navegador. Aperte Play para ouvir.");
        toast("Áudio preparado. Não foi enviado para nenhum servidor.");
      });
      player.addEventListener("error",()=>{
        if(activeUrl)text(status,"Esse formato de áudio não pôde ser reproduzido neste navegador.");
      });
      clear?.addEventListener("click",()=>{
        unload();
        input.value="";
        text(status,"Arquivo descarregado. Escolha outro para ouvir.");
      });
      window.addEventListener("pagehide",()=>{
        if(activeUrl)unload();
      },{once:true});
    },"arquivo de áudio local");

    /* 05: SENAI • exemplos didáticos, sem alegar serem commits históricos */
    safeTask(()=>{
      const lessons={
        html:{
          left:"A primeira estrutura",right:"Estrutura com semântica",
          a:'<h1>Meu site</h1>\n<p>Olá, mundo!</p>',
          b:'<main>\n  <section aria-labelledby="titulo">\n    <h1 id="titulo">Meu site</h1>\n    <p>Olá, mundo!</p>\n  </section>\n</main>',
          note:"HTML descreve o conteúdo. Estruturar seções e títulos facilita entender uma página e pode ajudar quem usa tecnologias assistivas."
        },
        css:{
          left:"Uma regra básica",right:"Estilo responsivo",
          a:'h1 {\n  color: purple;\n}',
          b:'h1 {\n  color: var(--texto);\n  font-size: clamp(2rem, 6vw, 5rem);\n  line-height: 1.05;\n}\n@media (prefers-reduced-motion: reduce) {\n  * { animation: none; }\n}',
          note:"No CSS, dá para cuidar de escalas tipográficas, contraste, telas pequenas e preferências de acessibilidade."
        },
        js:{
          left:"Reagir ao clique",right:"Atualizar e guardar estado",
          a:'botao.addEventListener("click", () => {\n  alert("Olá!");\n});',
          b:'botao.addEventListener("click", () => {\n  const novo = Number(valor.textContent) + 1;\n  valor.textContent = novo;\n  localStorage.setItem("visitas", String(novo));\n});',
          note:"Com JavaScript, os botões deixam de ser só decoração. Neste exemplo, o contador seria guardado no navegador."
        }
      };
      const left=$("#xq2-study-before"),right=$("#xq2-study-after"),
        lt=$("#xq2-study-before-title"),rt=$("#xq2-study-after-title"),
        note=$("#xq2-study-explanation");
      const select=key=>{
        const entry=lessons[key];if(!entry)return;
        text(left,entry.a);text(right,entry.b);
        text(lt,entry.left);text(rt,entry.right);text(note,entry.note);
        $$("[data-study-topic]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.studyTopic===key)));
      };
      $$("[data-study-topic]").forEach(button=>button.addEventListener("click",()=>select(button.dataset.studyTopic)));
      select("html");
    },"laboratório SENAI");

    /* 06: MANGATECA 2.0 • estado em navegador, filtros e busca */
    safeTask(()=>{
      const shelf=$("#xq-manga-grid");
      if(!shelf)return;
      const cards=$$(".xq-manga-panel",shelf);
      const input=$("#xq2-manga-search"),selectGenre=$("#xq2-manga-genre"),selectState=$("#xq2-manga-state");
      if(!cards.length||!input||!selectGenre||!selectState)return;
      const STATUS=["explorar","quero","lendo","tenho"];
      const labels={explorar:"DESCOBRIR",quero:"QUERO LER",lendo:"LENDO",tenho:"JÁ TENHO"};
      const storageKey="manga-shelf";
      const defaults={"Oyasumi Punpun":"tenho","My Broken Mariko":"quero","As Flores do Mal":"quero",
        "A Voz do Silêncio":"quero","A Depressão é uma Borboleta Azul":"quero"};
      const tags={
        "My Solo Exchange Diary":["drama","psicologico"],
        "Solanin":["drama","arte"],
        "Homunculus":["psicologico"],
        "Blue":["drama"],
        "River's Edge":["psicologico","drama"],
        "My Brain is Different: Stories of ADHD and Other Developmental Disorders":["drama"],
        "Look Back":["arte","drama"],
        "Goodbye, Eri":["arte","drama"],
        "My Lesbian Experience with Loneliness":["drama","psicologico"],
        "Hikari no Machi":["drama"],
        "Nijigahara Holograph":["psicologico"],
        "Tekkonkinkreet":["fantasia","drama"],
        "Blue Period":["arte","drama"],
        "A Menina do Outro Lado":["fantasia"],
        "Monster":["psicologico"],
        "Helter Skelter":["psicologico","drama"],
        "Haru's Curse":["drama"],
        "My Broken Mariko":["drama"],
        "As Flores do Mal":["psicologico","drama"],
        "Oyasumi Punpun":["psicologico","drama"],
        "A Voz do Silêncio":["drama"],
        "A Depressão é uma Borboleta Azul":["drama"]
      };
      let saved={};
      try{const value=JSON.parse(local.get(storageKey)||"{}");
        if(value&&typeof value==="object"&&!Array.isArray(value))saved=value;
      }catch{/* malformed browser data: reset silently */}
      const data=new Map();
      const collator=new Intl.Collator("pt-BR",{sensitivity:"base"});
      cards.forEach(card=>{
        const title=card.dataset.title||$("h3",card)?.textContent.trim()||"";
        if(!title)return;
        const old=saved[title];
        const status=STATUS.includes(old?.status)?old.status:(defaults[title]||"explorar");
        const favorite=typeof old?.favorite==="boolean"?old.favorite:false;
        const genre=tags[title]||["drama"];
        data.set(card,{title,status,favorite,genre});
        card.dataset.genre=genre.join(" ");
        const badges=document.createElement("div");badges.className="xq2-manga-tags";
        genre.forEach(g=>{
          const badge=document.createElement("span");
          badge.textContent=g==="psicologico"?"PSICOLÓGICO":g==="drama"?"DRAMA":g==="arte"?"ARTE":"FANTASIA";
          badges.appendChild(badge);
        });
        const statusDisplay=document.createElement("span");
        statusDisplay.className="xq2-manga-status";
        const toolbar=document.createElement("div");
        toolbar.className="xq2-manga-toolbar";
        const stateButton=document.createElement("button");
        stateButton.type="button";stateButton.title="Alterar o estado de leitura";stateButton.setAttribute("aria-label","Alterar estado de "+title);
        const starButton=document.createElement("button");
        starButton.type="button";starButton.title="Adicionar ou remover dos favoritos";starButton.setAttribute("aria-label","Favoritar "+title);
        const search=document.createElement("a");
        search.href="https://books.google.com/books?q="+encodeURIComponent(title);
        search.textContent="PESQUISAR EDIÇÃO ↗";
        search.target="_blank";search.rel="noopener noreferrer";
        toolbar.append(stateButton,starButton,search);
        const bottom=$(".xq-manga-bottom",card);
        if(bottom){bottom.before(badges);bottom.after(statusDisplay,toolbar);}
        else card.append(badges,statusDisplay,toolbar);
        const redrawButtons=()=>{
          stateButton.textContent=labels[data.get(card).status]+" ↺";
          starButton.textContent=data.get(card).favorite?"♥ SALVO":"♡ FAVORITO";
          starButton.setAttribute("aria-pressed",String(data.get(card).favorite));
          text(statusDisplay,"STATUS / "+labels[data.get(card).status]);
        };
        stateButton.addEventListener("click",()=>{
          const item=data.get(card);
          item.status=STATUS[(STATUS.indexOf(item.status)+1)%STATUS.length];
          redrawButtons();persist();filter();toast(title+": "+labels[item.status].toLowerCase()+".");
        });
        starButton.addEventListener("click",()=>{
          data.get(card).favorite=!data.get(card).favorite;
          redrawButtons();persist();filter();
        });
        redrawButtons();
      });
      function persist(){
        const result={};
        for(const item of data.values())result[item.title]={status:item.status,favorite:item.favorite};
        if(!local.set(storageKey,JSON.stringify(result)))toast("Não consegui salvar a estante neste navegador.");
      }
      const empty=document.createElement("p");empty.className="xq2-manga-empty";empty.textContent="Nenhuma obra com esses filtros. Tente outra pesquisa.";
      function filter(){
        const search=input.value.trim().toLocaleLowerCase("pt-BR");
        const genre=selectGenre.value,status=selectState.value;
        let shown=0,owned=0,wish=0;
        for(const [card,item] of data){
          if(item.status==="tenho")owned++;
          if(item.status==="quero")wish++;
          const showTitle=!search||item.title.toLocaleLowerCase("pt-BR").includes(search);
          const showGenre=genre==="todos"||item.genre.includes(genre);
          const showStatus=status==="todos"||((status==="favorito")?item.favorite:item.status===status);
          card.hidden=!(showTitle&&showGenre&&showStatus);
          if(!card.hidden)shown++;
        }
        text($("#xq2-manga-visible"),shown);
        text($("#xq2-manga-owned"),owned);
        text($("#xq2-manga-wish"),wish);
        if(shown===0&&!empty.isConnected)shelf.appendChild(empty);
        if(shown>0)empty.remove();
      }
      input.addEventListener("input",filter);
      selectGenre.addEventListener("change",filter);
      selectState.addEventListener("change",filter);
      $("#xq2-manga-reset")?.addEventListener("click",()=>{
        input.value="";selectGenre.value="todos";selectState.value="todos";filter();input.focus();
      });
      $("#xq2-manga-random")?.addEventListener("click",()=>{
        const visible=cards.filter(x=>!x.hidden);
        if(!visible.length){toast("Não há nenhuma obra visível.");return;}
        const picked=visible[Math.floor(Math.random()*visible.length)];
        picked.scrollIntoView({behavior:reduceMotion?"instant":"smooth",block:"center"});
        const button=$(".xq2-manga-toolbar button",picked);
        button?.focus({preventScroll:true});
        if(!reduceMotion&&picked.animate)picked.animate(
          [{outline:"2px solid transparent"},{outline:"2px solid #889478"},{outline:"2px solid transparent"}],
          {duration:1350});
        toast("Talvez você queira conhecer: "+data.get(picked).title+".");
      });
      filter();
    },"Mangateca");

    /* EXTRA: FINDER DOS PROJETOS ANTIGOS • sem esconder links permanentemente */
    safeTask(()=>{
      const search=$("#xq2-project-search"),summary=$("#xq2-project-count");
      const cards=$("#projetos .project-card");
      if(!search||!summary||!cards.length)return;
      let group="todos";
      const empty=document.createElement("div");
      empty.className="xq2-project-empty";
      empty.setAttribute("role","status");
      empty.textContent="Não encontrei esse projeto. Limpe a busca para ver os trabalhos novamente.";
      const grid=$("#projetos .projects-grid");
      const normalize=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
      function filter(){
        let count=0;
        const query=normalize(search.value.trim());
        cards.forEach(card=>{
          const title=$("h3",card)?.textContent||"";
          const description=$(".project-content p",card)?.textContent||"";
          const matchesText=!query||normalize(title+" "+description).includes(query);
          const matchesKind=group==="todos"||card.dataset.projectKind===group;
          card.hidden=!(matchesText&&matchesKind);
          if(!card.hidden)count++;
        });
        text(summary,count+" DE "+cards.length+" PROJETOS VISÍVEIS");
        if(count===0&&!empty.isConnected)grid?.append(empty);
        else if(count>0)empty.remove();
        $("[data-project-group]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.projectGroup===group)));
      }
      search.addEventListener("input",filter);
      $("[data-project-group]").forEach(button=>button.addEventListener("click",()=>{
        group=button.dataset.projectGroup||"todos";filter();
      }));
      $("#xq2-project-clear")?.addEventListener("click",()=>{
        search.value="";group="todos";filter();search.focus();
      });
      filter();
    },"filtro de projetos");

    /* 07: EASTER EGGS • armazenamento limitado a três fragmentos */
    safeTask(()=>{
      const known=["escuta","lembranca","amanha"];
      let found=new Set();
      try{const raw=JSON.parse(local.get("fragments")||"[]");
        if(Array.isArray(raw))found=new Set(raw.filter(x=>known.includes(x)));
      }catch{/* invalid local data */}
      const btn=$("#xq2-secret-open"),panel=$("#xq2-secret-panel"),count=$("#xq2-secret-count");
      function openSecret(){
        if(panel){panel.hidden=false;$("#xq2-secret-close")?.focus();}
      }
      function draw(){
        text(count,found.size+" / 3 FRAGMENTOS REUNIDOS");
        if(btn)btn.disabled=found.size<3;
        $$("[data-egg]").forEach(button=>{
          const active=found.has(button.dataset.egg);
          button.classList.toggle("is-unlocked",active);
          button.setAttribute("aria-pressed",String(active));
          const small=$("small",button);
          text(small,active?"FRAGMENTO GUARDADO ✓":"GUARDAR FRAGMENTO ↗");
        });
      }
      $$("[data-egg]").forEach(button=>button.addEventListener("click",()=>{
        const key=button.dataset.egg;
        if(!known.includes(key))return;
        found.add(key);
        local.set("fragments",JSON.stringify([...found]));
        draw();
        toast(found.size===3?"Os três fragmentos se encontraram. Abra a mensagem.":"Fragmento guardado. "+found.size+"/3.");
      }));
      btn?.addEventListener("click",()=>{if(found.size===3)openSecret();});
      $("#xq2-secret-close")?.addEventListener("click",()=>{panel.hidden=true;});
      let index=0;
      const code=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
      document.addEventListener("keydown",event=>{
        if(event.target?.closest("input,textarea,select,[contenteditable=true]"))return;
        const key=event.key;
        if(key===code[index])index++;
        else index=(key===code[0])?1:0;
        if(index===code.length){
          index=0;openSecret();toast("Código secreto encontrado. ✳");
        }
        if(key==="Escape"&&panel&&!panel.hidden)panel.hidden=true;
      });
      draw();
    },"segredos");
  });
})();