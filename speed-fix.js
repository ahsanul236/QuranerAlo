(function(){
  'use strict';
  if(window.__KA_SPEED_FIX__)return;window.__KA_SPEED_FIX__=true;
  const s=document.createElement('style');s.id='ka-speed-fix';s.textContent=`
    main>section{contain:layout style;}
    main>section.hidden{display:none!important;}
    .ka-new-section,.ka-merged-report-shell{contain:content;}
    #view-report-merged{content-visibility:auto;contain:layout paint style;}
    table{contain:layout style;}
    img{content-visibility:auto;}
  `;document.head.appendChild(s);
  function trim(){
    const nav=document.querySelector('header .max-w-7xl.mx-auto.flex.gap-2.text-sm');
    if(nav)nav.style.willChange='auto';
    document.querySelectorAll('svg').forEach(x=>{if(!x.getAttribute('aria-hidden')&&!x.closest('button'))x.setAttribute('aria-hidden','true');});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(trim,300),{once:true});else setTimeout(trim,300);
})();