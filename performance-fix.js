(function(){
  'use strict';
  if(window.__KA_PERF_FIX__) return;
  window.__KA_PERF_FIX__=true;

  function css(){
    const s=document.createElement('style');
    s.id='ka-performance-fix';
    s.textContent=`
      html,body{scroll-behavior:auto!important}
      body{background:#f6f8fb!important}
      header.glass-panel{position:relative!important;top:auto!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:0 2px 10px rgba(15,23,42,.06)!important}
      .glass-panel{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:0 4px 14px rgba(15,23,42,.05)!important}
      *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
      header .max-w-7xl.mx-auto.flex.gap-2.text-sm{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:8px!important;overflow:visible!important;white-space:normal!important;align-items:stretch!important;padding:8px 0!important}
      header .max-w-7xl.mx-auto.flex.gap-2.text-sm .tab-btn{width:100%!important;min-width:0!important;height:48px!important;justify-content:center!important;align-items:center!important;text-align:center!important;white-space:normal!important;line-height:1.2!important;border:1px solid #e2e8f0!important;border-radius:10px!important;background:#fff!important;box-shadow:none!important;padding:7px 6px!important}
      header .max-w-7xl.mx-auto.flex.gap-2.text-sm .tab-btn.active{background:#fff8df!important;border-color:#d4af37!important;color:#7a5700!important;border-bottom:2px solid #b8860b!important}
      #ka-quickbar{display:none!important}
      @media(max-width:1024px){header .max-w-7xl.mx-auto.flex.gap-2.text-sm{grid-template-columns:repeat(4,minmax(0,1fr))!important}}
      @media(max-width:700px){header .max-w-7xl.mx-auto.flex.gap-2.text-sm{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;padding:7px 6px!important}.tab-btn{font-size:12px!important;height:46px!important}}
      .ka-brand-logo{object-fit:contain!important;background:#fff!important;border-radius:12px!important;padding:2px!important}
    `;
    document.head.appendChild(s);
  }

  function getLogo(){
    return window.KA_DEFAULT_LOGO || (window.KA_DEFAULT_LOGO_URL ? window.KA_DEFAULT_LOGO_URL : '');
  }

  function patchLogo(){
    const header=document.querySelector('header');
    if(!header) return;
    const holder=header.querySelector('svg')?.parentElement;
    const logo=getLogo();
    if(holder && logo){
      const old=holder.querySelector('.ka-brand-logo');
      if(old) old.src=logo;
      else holder.innerHTML='<img class="ka-brand-logo" src="'+logo+'" alt="কোরআনের আলো লোগো">';
    }
    document.querySelectorAll('[data-brand-logo],[data-ka-exp-logo]').forEach(img=>{if(logo)img.src=logo;});
  }

  function patchActiveTabs(){
    const nav=document.querySelector('header .max-w-7xl.mx-auto.flex.gap-2.text-sm');
    if(!nav || nav.__kaActivePatch) return;
    nav.__kaActivePatch=true;
    nav.addEventListener('click',function(e){
      const b=e.target.closest('.tab-btn');
      if(!b) return;
      nav.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      setTimeout(()=>{nav.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active')},0);
    },true);
  }

  function patchSwitchTab(){
    if(window.__kaPerfSwitchPatched || typeof window.switchTab!=='function') return;
    const original=window.switchTab;
    window.switchTab=function(tab){
      document.querySelectorAll('header .tab-btn').forEach(b=>b.classList.remove('active'));
      const id='tab-'+tab;
      const btn=document.getElementById(id);
      if(btn) btn.classList.add('active');
      const result=original.apply(this,arguments);
      requestAnimationFrame(()=>{
        document.querySelectorAll('header .tab-btn').forEach(b=>b.classList.remove('active'));
        const current=document.getElementById(id); if(current) current.classList.add('active');
      });
      return result;
    };
    window.__kaPerfSwitchPatched=true;
  }

  function boot(){css();patchLogo();patchActiveTabs();patchSwitchTab();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,100),{once:true});
  else setTimeout(boot,100);
  window.addEventListener('load',()=>setTimeout(boot,100));
  window.addEventListener('koraner-auth-ready',()=>setTimeout(boot,100));
})();
