(function(){
  'use strict';
  if(window.__KA_HOME_LOGO_CLEAN_FIX__) return;
  window.__KA_HOME_LOGO_CLEAN_FIX__=true;

  function clean(){
    const header=document.querySelector('header');
    if(!header) return;
    const img=header.querySelector('img.ka-final-logo');
    if(!img) return;

    // The legacy header puts the logo inside a decorative rounded/background wrapper.
    // Move the actual logo image directly into the brand flex row and remove that wrapper.
    const holder=img.parentElement;
    const row=holder && holder.parentElement;
    if(holder && row && holder!==row && row.contains(holder) && holder.children.length===1){
      img.style.setProperty('display','block','important');
      img.style.setProperty('width','56px','important');
      img.style.setProperty('height','56px','important');
      img.style.setProperty('object-fit','contain','important');
      img.style.setProperty('background','transparent','important');
      img.style.setProperty('border','0','important');
      img.style.setProperty('border-radius','0','important');
      img.style.setProperty('padding','0','important');
      img.style.setProperty('box-shadow','none','important');
      img.style.setProperty('margin','0','important');
      row.insertBefore(img,holder);
      holder.remove();
      row.style.setProperty('gap','12px','important');
      row.style.setProperty('align-items','center','important');
    }
  }

  function boot(){
    clean();
    setTimeout(clean,250);
    setTimeout(clean,700);
    setTimeout(clean,1400);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else setTimeout(boot,100);
  window.addEventListener('load',()=>setTimeout(clean,180));
  window.addEventListener('koraner-auth-ready',()=>setTimeout(clean,300));
  if(window.MutationObserver)new MutationObserver(()=>requestAnimationFrame(clean)).observe(document.body,{childList:true,subtree:true});
})();
