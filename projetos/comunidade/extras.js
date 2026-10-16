/* XQRENS / Extras: presença, fotos de perfil, imagens privadas
   A autenticação pertence ao app.js; aqui só usamos seu cliente conectado. */
(() => {
"use strict";
const $ = selector => document.querySelector(selector);
const PHOTO_TYPES = new Set(["image/jpeg","image/png","image/webp"]);
const UUID_RE = "[0-9a-f-]{36}";
const AVATAR_RE = new RegExp("^("+UUID_RE+")/("+UUID_RE+")\\.webp$");
const MEDIA_RE = new RegExp("^("+UUID_RE+")/("+UUID_RE+")/("+UUID_RE+")/("+UUID_RE+")\\.webp$");
const getInitial = value => String(value||"✳").trim().charAt(0).toUpperCase();
const make = (tag, className, text) => {
 const el = document.createElement(tag);
 if(className) el.className=className;
 if(text!==undefined)el.textContent=String(text);
 return el;
};
let state=null;
let callbacks=null;
const avatars=new Map();
const signedImageCache=new Map();
let selectedPhoto=null;
let pendingPreviewUrl=null;
let presenceChannel=null;
let presenceServerId=null;
let presenceGeneration=0;
let members=[];
let onlineIds=new Set();
let presenceConnected=false;
let avatarBusy=false;

function notify(text){callbacks?.toast(text);}
function problem(error){callbacks?.notifyError(error);}
function nameFor(id){return state?.profileCache.get(id)||("leitor-"+String(id).slice(0,5));}
function avatarUrl(id){
 const path=avatars.get(id);
 if(!path||!AVATAR_RE.test(path)||!path.startsWith(id+"/"))return null;
 return state.client.storage.from("xq-avatars").getPublicUrl(path).data.publicUrl;
}
function renderAvatar(node,userId){
 if(!node)return;
 const src=avatarUrl(userId);
 node.replaceChildren();
 if(!src){node.textContent=getInitial(nameFor(userId));return;}
 const img=make("img","xq-avatar-img");
 img.src=src;
 img.alt="Foto de "+nameFor(userId);
 img.loading="lazy";
 img.decoding="async";
 img.referrerPolicy="no-referrer";
 img.onerror=()=>{img.remove();node.textContent=getInitial(nameFor(userId));};
 node.appendChild(img);
}
function applyOwnAvatar(){
 if(!state?.user)return;
 renderAvatar($("#own-avatar"),state.user.id);
 const preview=$("#edit-avatar-preview");
 const img=$("#edit-avatar-img");
 const fallback=$("#edit-avatar-fallback");
 if(!preview||!img||!fallback)return;
 const src=avatarUrl(state.user.id);
 img.hidden=!src;
 fallback.hidden=Boolean(src);
 if(src){img.src=src;img.alt="Minha foto de perfil";}
 else {img.removeAttribute("src");fallback.textContent=getInitial(nameFor(state.user.id));}
}
function registerProfiles(rows){
 (rows||[]).forEach(profile=>{
  if(!profile?.user_id)return;
  state.profileCache.set(profile.user_id,profile.username);
  if(profile.avatar_path&&AVATAR_RE.test(profile.avatar_path)
    && profile.avatar_path.startsWith(profile.user_id+"/"))avatars.set(profile.user_id,profile.avatar_path);
  else avatars.delete(profile.user_id);
 });
 applyOwnAvatar();
 document.querySelectorAll(".message").forEach(node=>{
   const id=node.dataset.authorId;
   if(!id)return;
   const name=node.querySelector(".message-info strong");
   if(name)name.textContent=nameFor(id);
   renderAvatar(node.querySelector(".message-avatar"),id);
 });
 if(members.length)paintMembers();
}
function ownProfileUpdated(profile){
 if(profile?.user_id)registerProfiles([profile]);
 applyOwnAvatar();
}
async function pictureToWebP(file,{maxSide,maxBytes}){
 if(!PHOTO_TYPES.has(file.type))throw new Error("Envie uma foto JPG, PNG ou WEBP.");
 if(file.size>12*1024*1024)throw new Error("A foto original deve ter no máximo 12 MB.");
 let bitmap;
 try{
   if("createImageBitmap" in window)bitmap=await createImageBitmap(file);
   else {
     const url=URL.createObjectURL(file);
     try{
       const img=new Image();
       img.src=url;
       await img.decode();
       bitmap=img;
     }finally{URL.revokeObjectURL(url);}
   }
   const width=bitmap.width||bitmap.naturalWidth,height=bitmap.height||bitmap.naturalHeight;
   if(!width||!height||width>14000||height>14000)throw new Error("Imagem inválida ou grande demais.");
   const scale=Math.min(1,maxSide/Math.max(width,height));
   const canvas=document.createElement("canvas");
   canvas.width=Math.max(1,Math.round(width*scale));
   canvas.height=Math.max(1,Math.round(height*scale));
   const context=canvas.getContext("2d",{alpha:false});
   if(!context)throw new Error("Este navegador não consegue processar a foto.");
   context.fillStyle="#ffffff";
   context.fillRect(0,0,canvas.width,canvas.height);
   context.drawImage(bitmap,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",.82));
   if(!blob||blob.type!=="image/webp")throw new Error("Seu navegador não conseguiu converter esta imagem.");
   if(blob.size>maxBytes)throw new Error("Essa foto ficou grande demais. Tente outra imagem.");
   return blob;
 }finally{
   bitmap?.close?.();
 }
}
function clearAttachment(){
 selectedPhoto=null;
 if(pendingPreviewUrl){URL.revokeObjectURL(pendingPreviewUrl);pendingPreviewUrl=null;}
 const input=$("#chat-image-file");
 if(input)input.value="";
 const img=$("#attachment-preview-img");
 if(img)img.removeAttribute("src");
 $("#attachment-preview").hidden=true;
}
function channelSelected(){
 clearAttachment();
}
async function chooseAttachment(file){
 if(!file)return;
 const blob=await pictureToWebP(file,{maxSide:1800,maxBytes:5*1024*1024});
 clearAttachment();
 selectedPhoto={blob,label:file.name};
 pendingPreviewUrl=URL.createObjectURL(blob);
 $("#attachment-preview-img").src=pendingPreviewUrl;
 $("#attachment-name").textContent=file.name+" · "+Math.ceil(blob.size/1024)+" KB";
 $("#attachment-preview").hidden=false;
 notify("Imagem pronta! Envie no chat.");
}
function hasAttachment(){return Boolean(selectedPhoto?.blob);}
async function uploadAttachment(serverId,channelId){
 if(!selectedPhoto?.blob||!state?.user)throw new Error("Nenhuma foto anexada.");
 const path=[serverId,channelId,state.user.id,crypto.randomUUID()+".webp"].join("/");
 const {error}=await state.client.storage.from("xq-chat-media").upload(path,selectedPhoto.blob,{
   contentType:"image/webp",cacheControl:"3600",upsert:false
 });
 if(error)throw error;
 return path;
}
function signedUrl(path){
 if(!MEDIA_RE.test(path))return Promise.reject(new Error("Caminho da imagem inválido."));
 const hit=signedImageCache.get(path);
 if(hit&&hit.expiresAt>Date.now())return Promise.resolve(hit.url);
 return state.client.storage.from("xq-chat-media").createSignedUrl(path,600)
 .then(({data,error})=>{
   if(error)throw error;
   signedImageCache.set(path,{url:data.signedUrl,expiresAt:Date.now()+9*60*1000});
   return data.signedUrl;
 });
}
async function enhanceMessage(element,message){
 element.dataset.authorId=message.user_id;
 renderAvatar(element.querySelector(".message-avatar"),message.user_id);
 if(!message.image_path)return;
 const path=message.image_path;
 const safePath=MEDIA_RE.test(path)
  && path.split("/")[1]===message.channel_id
  && path.split("/")[2]===message.user_id;
 if(!safePath)return;
 const body=element.querySelector(".message-body");
 if(!body)return;
 const holder=make("div","chat-media");
 holder.append(make("span","chat-media-loading","Carregando imagem..."));
 body.appendChild(holder);
 try{
   const src=await signedUrl(path);
   if(!element.isConnected||element.dataset.messageId!==String(message.id))return;
   const btn=make("button","chat-image-button");
   btn.type="button";
   btn.setAttribute("aria-label","Ampliar imagem enviada por "+nameFor(message.user_id));
   const img=make("img","chat-image");
   img.src=src;
   img.loading="lazy";
   img.decoding="async";
   img.alt="Foto enviada por "+nameFor(message.user_id);
   btn.append(img);
   btn.addEventListener("click",()=>{
     const modal=$("#image-dialog"),preview=$("#image-dialog-img");
     preview.src=src;
     $("#image-dialog-caption").textContent="Foto enviada por "+nameFor(message.user_id);
     if(!modal.open)modal.showModal();
   });
   holder.replaceChildren(btn);
 }catch(error){
   holder.replaceChildren(make("span","chat-media-error","Não foi possível carregar a imagem."));
   console.error("Imagem do chat:",error);
 }
}
async function messageDeleted(message){
 if(!message?.image_path||!MEDIA_RE.test(message.image_path))return;
 signedImageCache.delete(message.image_path);
 const {error}=await state.client.storage.from("xq-chat-media").remove([message.image_path]);
 if(error)console.warn("Arquivo não removido do armazenamento:",error);
}
async function uploadAvatar(file){
 if(avatarBusy)return;
 if(!state?.user)throw new Error("Entre na sua conta antes de enviar uma foto.");
 avatarBusy=true;
 const change=$("#change-avatar-button");
 change.disabled=true;
 const old=state.profile?.avatar_path||null;
 let path;
 try{
   notify("Preparando sua foto...");
   const blob=await pictureToWebP(file,{maxSide:320,maxBytes:1024*1024});
   path=state.user.id+"/"+crypto.randomUUID()+".webp";
   const {error:uploadError}=await state.client.storage.from("xq-avatars")
     .upload(path,blob,{contentType:"image/webp",cacheControl:"3600",upsert:false});
   if(uploadError)throw uploadError;
   const {error:updateError}=await state.client.from("xq_profiles")
     .update({avatar_path:path}).eq("user_id",state.user.id);
   if(updateError)throw updateError;
   state.profile.avatar_path=path;
   ownProfileUpdated(state.profile);
   if(old&&old!==path)await state.client.storage.from("xq-avatars").remove([old]);
   notify("Sua foto de perfil foi atualizada! ♡");
   path=null;
 }catch(error){
   if(path)await state.client.storage.from("xq-avatars").remove([path]).catch(()=>{});
   problem(error);
 }finally{
   avatarBusy=false;change.disabled=false;
 }
}
async function removeAvatar(){
 if(!state?.user||avatarBusy)return;
 const old=state.profile?.avatar_path;
 if(!old)return notify("Você ainda não tem uma foto de perfil.");
 if(!confirm("Remover sua foto de perfil?"))return;
 const {error}=await state.client.from("xq_profiles").update({avatar_path:null}).eq("user_id",state.user.id);
 if(error)return problem(error);
 state.profile.avatar_path=null;
 ownProfileUpdated(state.profile);
 await state.client.storage.from("xq-avatars").remove([old]);
 notify("Foto removida.");
}
function setPresenceIndicator(count,connected){
 const value=connected?String(count):"—";
 ["#presence-pill-count","#online-count","#mobile-online-count"].forEach(selector=>{
   const node=$(selector);if(node)node.textContent=value;
 });
 const hint=$("#presence-state");
 if(hint)hint.textContent=connected?"EM TEMPO REAL":"CONECTANDO...";
 $("#presence-pill")?.classList.toggle("presence-active",connected&&count>0);
}
function paintMembers(){
 if(!state?.user||!state.currentServer)return;
 const isOnline=id=>presenceConnected&&onlineIds.has(id);
 const live=members.filter(m=>isOnline(m.user_id));
 const offline=presenceConnected?members.filter(m=>!isOnline(m.user_id)):[];
 setPresenceIndicator(live.length,presenceConnected);
 ["#offline-count","#mobile-offline-count"].forEach(s=>{
  const n=$(s);if(n)n.textContent=presenceConnected?String(offline.length):"—";
 });
 function fill(selector,users,empty){
  const list=$(selector);if(!list)return;
  list.replaceChildren();
  if(!users.length){list.append(make("p","empty-members",empty));return;}
  users.forEach(m=>{
   const row=make("div","member-item");
   const icon=make("div","member-avatar");
   renderAvatar(icon,m.user_id);
   const content=make("div","member-details");
   content.append(make("strong","",nameFor(m.user_id)));
   content.append(make("small","",m.role==="owner"?"CRIADOR DO SERVIDOR":"MEMBRO"));
   const dot=make("span","member-status-dot"+(isOnline(m.user_id)?" is-online":""));
   row.append(icon,content,dot);list.appendChild(row);
  });
 }
 fill("#online-member-list",live,presenceConnected?"Ninguém online agora.":"Conectando...");
 fill("#mobile-online-members",live,presenceConnected?"Ninguém online agora.":"Conectando...");
 fill("#offline-member-list",offline,presenceConnected?"Todo mundo está online.":"Aguardando...");
 fill("#mobile-offline-members",offline,presenceConnected?"Todo mundo está online.":"Aguardando...");
}
async function stopPresence(){
 presenceGeneration++;
 const old=presenceChannel;
 presenceChannel=null;presenceServerId=null;
 onlineIds.clear();members=[];presenceConnected=false;
 setPresenceIndicator(0,false);
 paintMembers();
 if(old&&state?.client)await state.client.removeChannel(old).catch(()=>{});
}
function syncPresence(channel){
 if(channel!==presenceChannel)return;
 const entries=channel.presenceState();
 onlineIds=new Set(Object.keys(entries).filter(id=>members.some(m=>m.user_id===id)));
 paintMembers();
}
async function serverSelected(server){
 if(!state?.user)return;
 if(presenceServerId===server.id)return;
 await stopPresence();
 const generation=presenceGeneration;
 presenceServerId=server.id;
 try{
   const {data,error}=await state.client.from("xq_members")
     .select("user_id,role").eq("server_id",server.id).limit(200);
   if(error)throw error;
   if(generation!==presenceGeneration||presenceServerId!==server.id)return;
   members=data||[];
   await callbacks.cacheNames(members.map(m=>m.user_id));
   if(generation!==presenceGeneration||presenceServerId!==server.id)return;
   paintMembers();
   const {data:sessionData}=await state.client.auth.getSession();
   if(sessionData?.session?.access_token)await state.client.realtime.setAuth(sessionData.session.access_token);
   if(generation!==presenceGeneration||presenceServerId!==server.id)return;
   const channel=state.client.channel("xq-presence:"+server.id,{
     config:{private:true,presence:{key:state.user.id}}
   });
   presenceChannel=channel;
   channel.on("presence",{event:"sync"},()=>syncPresence(channel))
    .on("presence",{event:"join"},()=>syncPresence(channel))
    .on("presence",{event:"leave"},()=>syncPresence(channel))
    .subscribe(async(status,err)=>{
      if(channel!==presenceChannel)return;
      if(status==="SUBSCRIBED"){
        presenceConnected=true;
        try{await channel.track({connected_at:new Date().toISOString()});}
        catch(e){console.warn("Erro ao anunciar presença:",e);}
        syncPresence(channel);
      }else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){
        presenceConnected=false;onlineIds.clear();paintMembers();
        console.warn("Realtime Presence:",err);
      }else if(status==="CLOSED"){
        presenceConnected=false;onlineIds.clear();paintMembers();
      }
    });
 }catch(error){
   if(generation===presenceGeneration)problem(error);
 }
}
function signedOut(){
 void stopPresence();
 avatars.clear();signedImageCache.clear();clearAttachment();
 const avatar=$("#own-avatar");if(avatar)avatar.textContent="?";
}
function bind(){
 $("#presence-pill")?.addEventListener("click",()=>{
  if(!state?.currentServer){notify("Entre em um servidor para ver os membros.");return;}
  $("#members-dialog").showModal();
 });
 $("#avatar-edit")?.addEventListener("click",()=>$("#profile-edit").click());
 $("#profile-edit")?.addEventListener("click",()=>applyOwnAvatar());
 $("#change-avatar-button")?.addEventListener("click",()=>$("#avatar-file").click());
 $("#avatar-file")?.addEventListener("change",e=>{
  const file=e.target.files?.[0];e.target.value="";
  if(file)void uploadAvatar(file);
 });
 $("#remove-avatar-button")?.addEventListener("click",()=>void removeAvatar());
 $("#attach-image")?.addEventListener("click",()=>$("#chat-image-file").click());
 $("#chat-image-file")?.addEventListener("change",e=>{
  const file=e.target.files?.[0];e.target.value="";
  if(file)void chooseAttachment(file).catch(problem);
 });
 $("#attachment-remove")?.addEventListener("click",clearAttachment);
 const target=$("#message-input");
 target?.addEventListener("paste",event=>{
  const file=[...(event.clipboardData?.files||[])].find(f=>PHOTO_TYPES.has(f.type));
  if(!file)return;
  event.preventDefault();
  void chooseAttachment(file).catch(problem);
 });
 const composer=$("#message-form");
 composer?.addEventListener("dragover",event=>event.preventDefault());
 composer?.addEventListener("drop",event=>{
  const file=[...(event.dataTransfer?.files||[])].find(f=>PHOTO_TYPES.has(f.type));
  if(!file)return;
  event.preventDefault();
  void chooseAttachment(file).catch(problem);
 });
 $("#image-dialog")?.addEventListener("close",()=>{
  $("#image-dialog-img")?.removeAttribute("src");
 });
 document.addEventListener("visibilitychange",()=>{
  if(!document.hidden&&presenceChannel&&presenceConnected)syncPresence(presenceChannel);
 });
}
function initialize(sharedState,sharedCallbacks){
 if(state)return;
 state=sharedState;callbacks=sharedCallbacks;
 bind();
 setPresenceIndicator(0,false);
}
window.XqCommunity={
 initialize,registerProfiles,ownProfileUpdated,hasAttachment,uploadAttachment,clearAttachment,
 channelSelected,serverSelected,enhanceMessage,messageDeleted,signedOut
};
})();
