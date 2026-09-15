(function(){
  'use strict';
  if(window.__KA_DATA_INTEGRITY_FIX__) return;
  window.__KA_DATA_INTEGRITY_FIX__=true;

  const C=window.KORANER_ALO_CONFIG||{};
  const U=(C.supabaseUrl||'').replace(/\/$/,'');
  const K=C.supabaseAnonKey||'';
  const WORKSPACE=C.workspaceId||'koraner-alo';
  const token=()=>window.KORANER_ACCESS_TOKEN||K;
  const headers=extra=>Object.assign({apikey:K,Authorization:'Bearer '+token(),'Content-Type':'application/json'},extra||{});

  function count(a){return Array.isArray(a)?a.length:0;}
  function mergeById(localArr,cloudArr){
    const l=Array.isArray(localArr)?localArr:[];
    const c=Array.isArray(cloudArr)?cloudArr:[];
    const map=new Map();
    c.forEach(x=>{if(x&&x.id!=null)map.set(String(x.id),x);});
    l.forEach(x=>{if(x&&x.id!=null)map.set(String(x.id),x);});
    const noId=[...l.filter(x=>!x||x.id==null),...c.filter(x=>!x||x.id==null)];
    return [...map.values(),...noId];
  }

  async function getCloudState(){
    if(!U||!K||!window.KORANER_ACCESS_TOKEN) return null;
    try{
      const r=await fetch(U+'/rest/v1/app_state?id=eq.'+encodeURIComponent(WORKSPACE)+'&select=state',{headers:headers()});
      if(!r.ok)return null;
      const rows=await r.json();
      return rows&&rows[0]&&rows[0].state?rows[0].state:null;
    }catch(e){return null;}
  }

  async function safePush(){
    if(window.__KA_SAFE_PUSH_RUNNING)return;
    if(!window.KA_MEMBER || window.KA_MEMBER.status!=='active')return;
    window.__KA_SAFE_PUSH_RUNNING=true;
    try{
      const local=window.state||{};
      const cloud=await getCloudState();
      if(cloud){
        const merged=Object.assign({},cloud,local);
        ['students','studentPayments','staffs','salaryPayments','expenses'].forEach(k=>{
          const la=Array.isArray(local[k])?local[k]:[];
          const ca=Array.isArray(cloud[k])?cloud[k]:[];
          merged[k]=mergeById(la,ca);
        });
        window.state=merged;
        try{localStorage.setItem('koraner_alo_db_v2',JSON.stringify(merged));}catch(e){}
      }
      const payload={id:WORKSPACE,state:window.state||{},updated_at:new Date().toISOString()};
      const r=await fetch(U+'/rest/v1/app_state?on_conflict=id',{method:'POST',headers:headers({Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify(payload)});
      if(!r.ok)throw new Error(await r.text());
    }catch(e){console.warn('Safe cloud save skipped',e);}
    finally{window.__KA_SAFE_PUSH_RUNNING=false;}
  }

  function patchPush(){
    if(window.__KA_PUSH_PATCHED_INTEGRITY || typeof window.pushStateToCloud!=='function')return;
    window.pushStateToCloud=function(){return safePush();};
    window.__KA_PUSH_PATCHED_INTEGRITY=true;
  }

  function cleanHomeLogo(){
    const header=document.querySelector('header');
    if(!header)return;
    const img=header.querySelector('img.ka-final-logo');
    if(!img)return;
    [img,img.parentElement,img.parentElement?.parentElement,img.parentElement?.parentElement?.parentElement].forEach((el,i)=>{
      if(!el||el===header)return;
      if(i===0 || el.children.length<=1){
        el.style.setProperty('background','transparent','important');
        el.style.setProperty('background-image','none','important');
        el.style.setProperty('border','0','important');
        el.style.setProperty('border-radius','0','important');
        el.style.setProperty('box-shadow','none','important');
        el.style.setProperty('padding','0','important');
        el.style.setProperty('outline','0','important');
      }
    });
    img.style.setProperty('display','block','important');
    img.style.setProperty('width','56px','important');
    img.style.setProperty('height','56px','important');
    img.style.setProperty('object-fit','contain','important');
  }

  function boot(){patchPush();cleanHomeLogo();setTimeout(patchPush,200);setTimeout(cleanHomeLogo,250);setTimeout(cleanHomeLogo,800);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,120);
  window.addEventListener('load',boot);
  window.addEventListener('koraner-auth-ready',()=>setTimeout(boot,250));
  if(window.MutationObserver)new MutationObserver(()=>requestAnimationFrame(cleanHomeLogo)).observe(document.body,{childList:true,subtree:true});
})();
