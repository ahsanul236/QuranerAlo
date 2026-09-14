(function(){
  'use strict';
  const LOGO='logo.webp';
  function css(){
    if(document.getElementById('ka-light-mobile-style')) return;
    const s=document.createElement('style');
    s.id='ka-light-mobile-style';
    s.textContent=`
      :root{color-scheme:light}
      body{background:#f5f7fb!important;color:#18212f!important;min-height:100vh}
      header.glass-panel{background:rgba(255,255,255,.96)!important;border-color:#e5e7eb!important;box-shadow:0 4px 18px rgba(15,23,42,.08)!important}
      .glass-panel{background:#fff!important;border:1px solid #e5e7eb!important;box-shadow:0 8px 24px rgba(15,23,42,.07)!important;backdrop-filter:none!important;color:#18212f!important}
      .glass-input{background:#fff!important;border:1px solid #d7dde7!important;color:#172033!important;box-shadow:none!important}
      .glass-input::placeholder{color:#94a3b8!important}
      .glass-input:focus{border-color:#d4af37!important;box-shadow:0 0 0 3px rgba(212,175,55,.14)!important}
      .text-slate-50,.text-slate-100,.text-slate-200,.text-slate-300,.text-slate-400,.text-slate-500,.text-white{color:#334155!important}
      .text-slate-950{color:#0f172a!important}
      .bg-navy-950\\/80{background:#f8fafc!important}
      .bg-white\\/5{background:#f8fafc!important}
      .border-white\\/10{border-color:#e5e7eb!important}
      .border-white\\/5{border-color:#eef2f7!important}
      .gold-gradient-text{background:linear-gradient(135deg,#8a5a00,#c18b19,#8a5a00)!important;-webkit-background-clip:text!important;background-clip:text!important}
      .tab-btn{color:#475569!important;border-radius:12px 12px 0 0!important;flex:0 0 auto!important}
      .tab-btn.active{background:linear-gradient(135deg,#fff8df,#eefbf5)!important;color:#8a5a00!important;border-bottom:3px solid #d4af37!important}
      header .max-w-7xl.mx-auto.flex.gap-2.text-sm{display:flex!important;align-items:flex-end!important;gap:6px!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:thin!important;white-space:nowrap!important;padding-bottom:2px!important}
      header .max-w-7xl.mx-auto.flex.gap-2.text-sm::-webkit-scrollbar{height:5px}
      header .max-w-7xl.mx-auto.flex.gap-2.text-sm::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:20px}
      main{max-width:1280px!important}
      button{touch-action:manipulation}
      @media(max-width:768px){
        body{font-size:14px!important}
        header>.max-w-7xl.mx-auto{padding:10px 12px!important;align-items:flex-start!important}
        header>.max-w-7xl.mx-auto>div:first-child{width:100%!important}
        header>.max-w-7xl.mx-auto>div:last-child{width:100%!important;justify-content:flex-start!important;flex-wrap:wrap!important}
        header .max-w-7xl.mx-auto.flex.gap-2.text-sm{padding:0 8px 4px!important;align-items:center!important}
        .tab-btn{font-size:12px!important;padding:9px 11px!important}
        main{padding:14px 10px!important}
        main .glass-panel{border-radius:16px!important}
        input,select,textarea,button{min-height:44px}
        .grid{gap:12px!important}
        [id*='expense'],[id*='settings'],[id*='admin']{scroll-margin-top:12px}
      }
      .ka-brand-logo{width:56px;height:56px;object-fit:contain;background:#fff;border-radius:14px;padding:3px;box-shadow:0 2px 10px rgba(15,23,42,.08)}
      @media(max-width:768px){.ka-brand-logo{width:48px;height:48px;border-radius:12px}.ka-brand-title{font-size:20px!important}}
    `;
    document.head.appendChild(s);
  }
  function logoUrl(){return LOGO+'?v=20260914-4'}
  function patchLogo(){
    const header=document.querySelector('header');
    if(!header)return;
    const holder=header.querySelector('svg')?.parentElement;
    if(holder && !holder.querySelector('.ka-brand-logo')){
      holder.innerHTML='<img class="ka-brand-logo" src="'+logoUrl()+'" alt="কোরআনের আলো লোগো">';
    }
    const title=header.querySelector('h1');
    if(title) title.classList.add('ka-brand-title');
    document.querySelectorAll('[data-brand-logo]').forEach(img=>img.src=logoUrl());
  }
  function patchSettingsDefaults(){
    const s=window.state&&window.state.siteSettings;
    if(s && !s.logoUrl) s.logoUrl=logoUrl();
    const img=document.querySelector('[data-ka-exp-logo]'); if(img) img.src=logoUrl();
  }
  function boot(){css();patchLogo();patchSettingsDefaults();}
  window.addEventListener('load',()=>setTimeout(boot,200));
  window.addEventListener('koraner-auth-ready',()=>setTimeout(boot,250));
  setTimeout(boot,500);
  window.KA_DEFAULT_LOGO_URL=logoUrl();
})();