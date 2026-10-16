/* XQRENS Comunidade · Cliente público Supabase
   Somente publishable key. Permissões aplicadas pelo PostgreSQL/RLS. */
(() => {
"use strict";
const URL = "https://mvefcltfurlnnuueazym.supabase.co";
const PUBLIC_KEY = "sb_publishable__5chwrwF90b9X3v2yTdYHg_paqyaH15";
const q = selector => document.querySelector(selector);
const qa = selector => [...document.querySelectorAll(selector)];
const state = {client:null,user:null,profile:null,servers:[],memberships:[],currentServer:null,channels:[],currentChannel:null,realtime:null,authMode:"signin",profileCache:new Map(),pendingLoad:0};
const toast = (() => {let timer;return message => {const n=q("#toasts");n.textContent=message;n.classList.add("visible");clearTimeout(timer);timer=setTimeout(()=>n.classList.remove("visible"),3800);};})();
const show = (selector,visible) => {const n=q(selector);if(n)n.hidden=!visible;};
const safe = text => String(text??"");
const errorMessage = error => {
  const code=safe(error?.code);
  if(code==="23505") return "Esse nome já existe neste servidor.";
  if(code==="42501") return "Você não tem permissão para fazer isso.";
  if(code==="PGRST116") return "Não foi possível encontrar esse registro.";
  if(/Failed to fetch|fetch failed/i.test(safe(error?.message))) return "Sem conexão com o banco. Confira se o projeto Supabase está ativo.";
  return safe(error?.message||error||"Ocorreu um erro.");
};
const notifyError = error => {console.error(error);toast(errorMessage(error));};
const dialog = id => q("#"+id);
const open = id => {const el=dialog(id);if(el&&!el.open)el.showModal();};
const close = id => {const el=dialog(id);if(el?.open)el.close();};
const own = id => state.user?.id===id;
const titleLetter = value => safe(value).trim().charAt(0).toUpperCase()||"✳";
const userLabel = userId => state.profileCache.get(userId)||("leitor-"+safe(userId).slice(0,5));
const dates = time => new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(time));
const make = (tag,className,text) => {const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=safe(text);return node;};

function syncAccountEntry(){
 const signedIn=Boolean(state.user);
 const button=q("#account-launch");
 if(!button)return;
 button.dataset.signedIn=String(signedIn);
 button.setAttribute("aria-label",signedIn?"Editar meu nome e foto de perfil":"Entrar na minha conta");
 button.title=signedIn?"Minha conta: editar nome e foto":"Entrar ou criar conta";
 const label=q("#header-account-label");
 if(label)label.textContent=signedIn?"MEU PERFIL":"ENTRAR";
 const avatar=q("#header-avatar");
 if(!signedIn&&avatar)avatar.textContent="✳";
 else if(signedIn){
   const name=state.profile?.username||"";
   if(avatar&&!avatar.querySelector("img"))avatar.textContent=titleLetter(name||"✳");
 }
}
function openMyAccount(){
 if(!state.user){open("auth-dialog");return;}
 const input=q("#new-username");
 if(input)input.value=state.profile?.username||"leitor-"+state.user.id.slice(0,8);
 open("profile-dialog");
 window.XqCommunity?.ownProfileUpdated(state.profile);
}

function resetView(){
 window.XqCommunity?.signedOut();
 state.profile=null;
 syncAccountEntry();
 state.currentChannel=null;state.currentServer=null;state.servers=[];state.memberships=[];
 if(state.realtime){state.client.removeChannel(state.realtime);state.realtime=null;}
 q("#server-icons").replaceChildren();q("#channel-list").replaceChildren();
 q("#server-title").textContent="Comunidade ↗";q("#channel-title").textContent="bem-vindo";
 show("#profile-bar",false);show("#signed-menu",false);show("#chat-screen",false);show("#welcome-panel",true);
 q("#server-count").textContent="0";
}
async function loadProfile(){
 if(!state.user)return;
 const {data,error}=await state.client.from("xq_profiles").select("user_id,username,avatar_path").eq("user_id",state.user.id).maybeSingle();
 if(error)throw error;
 const profile=data||{user_id:state.user.id,username:"leitor-"+state.user.id.slice(0,8)};
 state.profile=profile;state.profileCache.set(profile.user_id,profile.username);
 window.XqCommunity?.registerProfiles([profile]);
 window.XqCommunity?.ownProfileUpdated(profile);
 q("#profile-username").textContent=profile.username;
 show("#profile-bar",true);
 syncAccountEntry();
}
async function getMembers(){
 const {data,error}=await state.client.from("xq_members").select("server_id,user_id,role").eq("user_id",state.user.id);
 if(error)throw error;
 state.memberships=data||[];
}
async function refreshServers(preferredId){
 if(!state.user)return;
 const {data,error}=await state.client.from("xq_servers").select("id,name,description,owner_id,created_at").order("created_at",{ascending:true}).limit(100);
 if(error)throw error;
 state.servers=data||[];q("#server-count").textContent=String(state.servers.length);
 await getMembers();
 const ids=new Set(state.memberships.map(m=>m.server_id));
 q("#server-icons").replaceChildren();
 state.servers.filter(s=>ids.has(s.id)).forEach(server=>{
   const button=make("button","server-icon",titleLetter(server.name));
   button.type="button";button.title=server.name;button.setAttribute("aria-label","Abrir "+server.name);
   button.classList.toggle("active",state.currentServer?.id===server.id);
   button.addEventListener("click",()=>selectServer(server.id).catch(notifyError));
   q("#server-icons").appendChild(button);
 });
 const selected=preferredId||state.currentServer?.id;
 if(selected&&ids.has(selected))await selectServer(selected);
 else if(state.memberships.length)await selectServer(state.memberships[0].server_id);
 else {
   state.currentServer=null;state.currentChannel=null;
   show("#chat-screen",false);show("#welcome-panel",true);
   q("#server-title").textContent="Comunidade ↗";q("#channel-title").textContent="bem-vindo";
   q("#channel-list").replaceChildren();
 }
}
async function selectServer(id){
 const server=state.servers.find(s=>s.id===id);
 if(!server)return;
 if(!state.memberships.some(m=>m.server_id===id))return toast("Entre no servidor antes.");
 state.currentServer=server;state.currentChannel=null;
 window.XqCommunity?.serverSelected(server);
 q("#server-title").textContent=server.name+" ↗";
 qa(".server-icon").forEach(b=>b.classList.toggle("active",b.title===server.name));
 show("#signed-menu",true);
 show("#add-channel-button",own(server.owner_id));
 show("#moderate-button",own(server.owner_id));
 const {data,error}=await state.client.from("xq_channels").select("id,server_id,name,created_at").eq("server_id",id).order("created_at");
 if(error)throw error;
 state.channels=data||[];
 const list=q("#channel-list");list.replaceChildren();
 state.channels.forEach(channel=>{
   const button=make("button","channel-button");
   const hash=make("span","", "#");button.append(hash,make("strong","",channel.name));
   button.addEventListener("click",()=>selectChannel(channel.id).catch(notifyError));
   list.appendChild(button);
 });
 if(state.channels.length)await selectChannel(state.channels[0].id);
 else {show("#chat-screen",false);show("#welcome-panel",true);}
 q(".channel-panel").classList.remove("mobile-open");
}
async function selectChannel(id){
 const channel=state.channels.find(c=>c.id===id);if(!channel)return;
 state.currentChannel=channel;
 window.XqCommunity?.channelSelected(channel);
 if(state.realtime){await state.client.removeChannel(state.realtime);state.realtime=null;}
 const stamp=++state.pendingLoad;
 q("#channel-title").textContent=channel.name;
 q("#channel-subtitle").textContent=state.currentServer?.name||"";
 q("#chat-topic-name").textContent=channel.name;
 q("#message-input").placeholder="Mensagem para #"+channel.name;
 qa(".channel-button").forEach(b=>b.classList.toggle("active",b.textContent.trim()==="#"+channel.name));
 show("#welcome-panel",false);show("#chat-screen",true);
 const list=q("#message-list");list.replaceChildren(make("p","empty-messages","Carregando mensagens..."));
 const {data,error}=await state.client.from("xq_messages").select("id,user_id,channel_id,content,image_path,created_at").eq("channel_id",id).order("created_at",{ascending:false}).limit(80);
 if(stamp!==state.pendingLoad)return;
 if(error)throw error;
 const rows=(data||[]).reverse();
 await cacheNames(rows.map(m=>m.user_id));
 list.replaceChildren();
 rows.forEach(renderMessage);
 scrollMessages();
 state.realtime=state.client.channel("xqrens-chat:"+id)
 .on("postgres_changes",{event:"INSERT",schema:"public",table:"xq_messages",filter:"channel_id=eq."+id},async payload=>{
   if(state.currentChannel?.id!==id)return;
   const message=payload.new;
   if(q('[data-message-id="'+message.id+'"]'))return;
   await cacheNames([message.user_id]);
   renderMessage(message);
   scrollMessages();
 }).on("postgres_changes",{event:"DELETE",schema:"public",table:"xq_messages",filter:"channel_id=eq."+id},payload=>{
   q('[data-message-id="'+payload.old.id+'"]')?.remove();
 }).subscribe(status=>{
   if(status==="CHANNEL_ERROR")toast("Conexão ao vivo interrompida; abra o canal novamente.");
 });
}
async function cacheNames(userIds){
 const missing=[...new Set(userIds)].filter(x=>!state.profileCache.has(x));
 if(!missing.length)return;
 const {data,error}=await state.client.from("xq_profiles").select("user_id,username,avatar_path").in("user_id",missing);
 if(error)return;
 (data||[]).forEach(profile=>state.profileCache.set(profile.user_id,profile.username));
 window.XqCommunity?.registerProfiles(data||[]);
}
function renderMessage(message){
 if(!message?.id||(!message?.content&&!message?.image_path))return;
 const el=make("article","message");el.dataset.messageId=safe(message.id);
 const avatar=make("div","message-avatar",titleLetter(userLabel(message.user_id)));
 const body=make("div","message-body"),info=make("div","message-info");
 info.append(make("strong","",userLabel(message.user_id)));
 const time=make("time","",dates(message.created_at));time.dateTime=message.created_at;info.append(time);
 body.append(info,make("p","message-content",message.content));
 const actions=make("div","message-actions");
 if(own(message.user_id)||state.currentServer?.owner_id===state.user?.id){
   const deleteButton=make("button","","×");deleteButton.title="Apagar minha mensagem";
   deleteButton.addEventListener("click",async()=>{
     if(!confirm("Apagar esta mensagem?"))return;
     const {error}=await state.client.from("xq_messages").delete().eq("id",message.id);
     if(error)return notifyError(error);
     el.remove();
     window.XqCommunity?.messageDeleted(message);
   });actions.append(deleteButton);
 }else{
   const report=make("button","","⚑");report.title="Denunciar mensagem";
   report.addEventListener("click",async()=>{
     const reason=prompt("Motivo da denúncia (mínimo 3 caracteres):");
     if(reason===null)return;
     if(reason.trim().length<3||reason.length>400)return toast("Informe um motivo entre 3 e 400 caracteres.");
     const {error}=await state.client.from("xq_reports").insert({message_id:message.id,reporter_id:state.user.id,reason:reason.trim()});
     if(error)notifyError(error);else toast("Denúncia registrada.");
   });actions.append(report);
 }
 el.append(avatar,body,actions);q("#message-list").appendChild(el);
 window.XqCommunity?.enhanceMessage(el,message);
}
function scrollMessages(){const list=q("#message-list");list.scrollTop=list.scrollHeight;}
async function signInOrUp(event){
 event.preventDefault();const email=q("#auth-email").value.trim(),password=q("#auth-password").value,button=q("#auth-submit");
 button.disabled=true;q("#auth-status").textContent="Aguarde...";
 try{
   const {data,error}=state.authMode==="signup"
   ? await state.client.auth.signUp({email,password})
   : await state.client.auth.signInWithPassword({email,password});
   if(error)throw error;
   if(state.authMode==="signup"&&!data.session){q("#auth-status").textContent="Conta criada. Confira seu e-mail para confirmar antes de entrar.";toast("Confirme a conta pelo e-mail.");}
   else {close("auth-dialog");toast("Bem-vindo à comunidade.");}
 }catch(error){q("#auth-status").textContent=errorMessage(error);notifyError(error);}
 finally{button.disabled=false;}
}
async function onAuthChange(user){
 const previous=state.user?.id;
 if(!user){
   state.user=null;
   resetView();
   return;
 }
 state.user=user;
 // Display account controls immediately, even without servers or profile lookup.
 if(previous!==user.id)state.profile=null;
 syncAccountEntry();
 const fallbackName=state.profile?.username||"leitor-"+user.id.slice(0,8);
 q("#profile-username").textContent=fallbackName;
 show("#profile-bar",true);
 show("#signed-menu",true);
 if(previous===user.id&&state.profile)return;
 try{
   await loadProfile();
 }catch(error){
   // Profile editing must never disappear just because profile lookup failed.
   notifyError(error);
   state.profile={user_id:user.id,username:fallbackName,avatar_path:null};
   q("#profile-username").textContent=fallbackName;
   syncAccountEntry();
   toast("Não foi possível buscar o perfil agora. Você ainda pode abrir Minha Conta.");
 }
 try{
   await refreshServers();
 }catch(error){
   notifyError(error);
   toast("Não consegui carregar os servidores, mas sua conta continua acessível.");
 }
}
async function createServer(event){
 event.preventDefault();if(!state.user)return open("auth-dialog");
 const name=q("#server-name").value.trim(),description=q("#server-description").value.trim();
 if(name.length<3||name.length>48)return toast("Nome entre 3 e 48 caracteres.");
 const {data,error}=await state.client.from("xq_servers").insert({name,description,owner_id:state.user.id}).select("id").single();
 if(error)return notifyError(error);
 close("server-dialog");q("#server-form").reset();toast("Servidor criado!");
 await refreshServers(data.id);
}
async function createChannel(event){
 event.preventDefault();if(!state.currentServer)return;
 if(!own(state.currentServer.owner_id))return toast("Somente o criador pode criar canais.");
 const name=q("#channel-name").value.trim().toLowerCase();
 if(!/^[a-z0-9-]{2,32}$/.test(name))return toast("Use letras minúsculas, números e hífens.");
 const {data,error}=await state.client.from("xq_channels").insert({server_id:state.currentServer.id,name}).select("id").single();
 if(error)return notifyError(error);
 close("channel-dialog");q("#channel-form").reset();const serverId=state.currentServer.id;
 await selectServer(serverId);await selectChannel(data.id);
 toast("Canal criado!");
}

async function sendMessage(event){
 event.preventDefault();
 if(!state.currentChannel||!state.user)return;
 const input=q("#message-input"),content=input.value.trim();
 const extras=window.XqCommunity;
 const hasImage=Boolean(extras?.hasAttachment());
 if((!content&&!hasImage)||content.length>2000)return;
 const button=q("#send-button");
 button.disabled=true;
 let uploadedPath=null;
 try{
   if(hasImage)uploadedPath=await extras.uploadAttachment(state.currentServer.id,state.currentChannel.id);
   const {data,error}=await state.client.from("xq_messages")
    .insert({channel_id:state.currentChannel.id,user_id:state.user.id,content,image_path:uploadedPath})
    .select("id,user_id,channel_id,content,image_path,created_at").single();
   if(error)throw error;
   input.value="";
   input.style.height="auto";
   q("#message-count").textContent="0/2000";
   extras?.clearAttachment();
   if(!q('[data-message-id="'+data.id+'"]')){
     renderMessage(data);
     scrollMessages();
   }
 }catch(error){
   if(uploadedPath)await state.client.storage.from("xq-chat-media").remove([uploadedPath]).catch(()=>{});
   notifyError(error);
 }finally{
   button.disabled=false;
   input.focus();
 }
}
async function explore(){
 if(!state.user)return open("auth-dialog");
 open("explore-dialog");
 const list=q("#explore-results");list.replaceChildren();
 const {data,error}=await state.client.from("xq_servers").select("id,name,description,owner_id").order("created_at",{ascending:false}).limit(100);
 if(error)return notifyError(error);
 const joined=new Set(state.memberships.map(m=>m.server_id));
 const draw=filter=>{
   list.replaceChildren();
   const items=(data||[]).filter(s=>s.name.toLocaleLowerCase("pt-BR").includes(filter.toLocaleLowerCase("pt-BR")));
   if(!items.length)list.append(make("p","", "Nenhum servidor encontrado."));
   items.forEach(server=>{
     const item=make("article","explore-server");
     const icon=make("div","explore-server-avatar",titleLetter(server.name));
     const content=make("div","explore-server-content");
     content.append(make("h3","",server.name),make("p","",server.description||"Servidor público"));
     const button=make("button","",joined.has(server.id)?"ABRIR ↗":"ENTRAR +");
     button.addEventListener("click",async()=>{
       button.disabled=true;
       if(!joined.has(server.id)){
         const {error}=await state.client.from("xq_members").insert({server_id:server.id,user_id:state.user.id,role:"member"});
         if(error){button.disabled=false;return notifyError(error);}
       }
       close("explore-dialog");
       await refreshServers(server.id);
       toast("Servidor aberto.");
     });
     item.append(icon,content,button);list.appendChild(item);
   });
 };
 q("#server-search").value="";draw("");
 q("#server-search").oninput=event=>draw(event.target.value);
}
async function saveProfile(event){
 event.preventDefault();if(!state.user)return;
 const username=q("#new-username").value.trim();
 if(username.length<3||username.length>32)return toast("Nome entre 3 e 32 caracteres.");
 const {error}=await state.client.from("xq_profiles").upsert({user_id:state.user.id,username},{onConflict:"user_id"});
 if(error)return notifyError(error);
 close("profile-dialog");await loadProfile();
 await selectChannel(state.currentChannel?.id).catch(()=>{});
 window.XqCommunity?.ownProfileUpdated(state.profile);
 toast("Nome alterado.");
}

async function reviewReports(){
 if(!state.currentServer||state.currentServer.owner_id!==state.user?.id)return toast("Somente o criador pode moderar.");
 open("moderation-dialog");
 const list=q("#moderation-results");list.replaceChildren(make("p","","Carregando denúncias..."));
 const {data:channels,error:channelError}=await state.client.from("xq_channels").select("id,name").eq("server_id",state.currentServer.id);
 if(channelError)return notifyError(channelError);
 const ids=(channels||[]).map(c=>c.id);
 if(!ids.length){list.replaceChildren(make("p","","Sem canais."));return;}
 const {data:msgs,error:msgError}=await state.client.from("xq_messages").select("id,content,channel_id,user_id").in("channel_id",ids);
 if(msgError)return notifyError(msgError);
 const messages=msgs||[];
 if(!messages.length){list.replaceChildren(make("p","","Nenhuma denúncia pendente."));return;}
 const map=new Map(messages.map(m=>[m.id,m]));
 const {data:reports,error}=await state.client.from("xq_reports").select("id,message_id,reason,created_at").in("message_id",[...map.keys()]).order("created_at",{ascending:false}).limit(60);
 if(error)return notifyError(error);
 list.replaceChildren();
 if(!(reports||[]).length){list.appendChild(make("p","","Nenhuma denúncia neste servidor."));return;}
 (reports||[]).forEach(report=>{
  const msg=map.get(report.message_id);if(!msg)return;
  const row=make("article","explore-server moderation-item");
  const content=make("div","explore-server-content");
  content.append(make("h3","","⚑ "+report.reason),make("p","","Mensagem: "+msg.content.slice(0,350)));
  const del=make("button","","EXCLUIR");
  del.addEventListener("click",async()=>{
   if(!confirm("Remover esta mensagem do servidor?"))return;
   const {error:deleteError}=await state.client.from("xq_messages").delete().eq("id",msg.id);
   if(deleteError)return notifyError(deleteError);
   row.remove();
   q('[data-message-id="'+msg.id+'"]')?.remove();
   toast("Mensagem removida.");
  });
  row.append(content,del);list.appendChild(row);
 });
}

function bind(){
 syncAccountEntry();
 qa("[data-close]").forEach(button=>button.addEventListener("click",()=>button.closest("dialog").close()));
 q("#welcome-start").addEventListener("click",()=>state.user?explore():open("auth-dialog"));
 ["#explore-button","#discover-icon","#show-explore"].forEach(s=>q(s).addEventListener("click",()=>explore().catch(notifyError)));
 ["#new-server-button","#create-server-icon"].forEach(s=>q(s).addEventListener("click",()=>state.user?open("server-dialog"):open("auth-dialog")));
 q("#add-channel-button").addEventListener("click",()=>open("channel-dialog"));
 q("#moderate-button").addEventListener("click",()=>reviewReports().catch(notifyError));
 q("#server-form").addEventListener("submit",e=>createServer(e).catch(notifyError));
 q("#channel-form").addEventListener("submit",e=>createChannel(e).catch(notifyError));
 q("#message-form").addEventListener("submit",e=>sendMessage(e).catch(notifyError));
 q("#auth-form").addEventListener("submit",e=>signInOrUp(e).catch(notifyError));
 q("#profile-form").addEventListener("submit",e=>saveProfile(e).catch(notifyError));
 q("#auth-mode").addEventListener("click",()=>{
   state.authMode=state.authMode==="signin"?"signup":"signin";
   q("#auth-submit").textContent=state.authMode==="signup"?"CRIAR CONTA ↗":"ENTRAR ↗";
   q("#auth-mode").textContent=state.authMode==="signup"?"Já tenho conta → Entrar":"Ainda não tenho conta → Criar";
   q("#auth-status").textContent="";
 });
 q("#sign-out").addEventListener("click",async()=>{const {error}=await state.client.auth.signOut();if(error)notifyError(error);else toast("Você saiu.");});
 q("#profile-edit").addEventListener("click",openMyAccount);
 q("#account-launch").addEventListener("click",openMyAccount);
 q("#message-input").addEventListener("input",event=>{
   q("#message-count").textContent=event.target.value.length+"/2000";
   event.target.style.height="auto";event.target.style.height=Math.min(event.target.scrollHeight,150)+"px";
 });
 q("#message-input").addEventListener("keydown",event=>{
   if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();q("#message-form").requestSubmit();}
 });
 q("#mobile-toggle").addEventListener("click",()=>q(".channel-panel").classList.toggle("mobile-open"));
 q("#mobile-open-channels").addEventListener("click",()=>q(".channel-panel").classList.toggle("mobile-open"));
 q("#server-title").addEventListener("click",()=>q(".channel-panel").classList.toggle("mobile-open"));
}
async function boot(){
 bind();
 if(!window.supabase?.createClient){toast("Biblioteca de conexão não carregou. Verifique sua internet.");return;}
 state.client=window.supabase.createClient(URL,PUBLIC_KEY,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
 window.XqCommunity?.initialize(state,{toast,notifyError,selectChannel,cacheNames});
 state.client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>onAuthChange(session?.user||null).catch(notifyError),0);});
 try{
   const {data,error}=await state.client.auth.getSession();
   if(error)throw error;
   await onAuthChange(data.session?.user||null);
 }catch(error){notifyError(error);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();