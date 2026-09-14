(function(){
  'use strict';
  const LOGO=()=>window.KA_DEFAULT_LOGO || window.KA_DEFAULT_LOGO_URL || 'logo.webp';
  const logoUrl=()=>LOGO()+'?v=20260914-5';

  function css(){
    if(document.getElementById('ka-light-mobile-style')) return;
    const s=document.createElement('style'); s.id='ka-light-mobile-style';
    s.textContent=`
      :root{color-scheme:light}
      html,body{background:#f4f7fb!important;color:#162033!important;min-height:100vh}
      body{font-family:'Hind Siliguri',sans-serif!important}
      header.glass-panel{background:#ffffff!important;border:0!important;border-bottom:1px solid #e2e8f0!important;box-shadow:0 3px 16px rgba(15,23,42,.07)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
      .glass-panel{background:#ffffff!important;border:1px solid #e2e8f0!important;box-shadow:0 5px 18px rgba(15,23,42,.055)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;color:#162033!important}
      .glass-input{background:#fff!important;border:1px solid #cbd5e1!important;color:#172033!important;box-shadow:none!important}
      .glass-input::placeholder{color:#94a3b8!important}
      .glass-input:focus{border-color:#c79a2b!important;box-shadow:0 0 0 3px rgba(199,154,43,.12)!important}
      .text-slate-50,.text-slate-100,.text-slate-200,.text-slate-300,.text-slate-400,.text-slate-500,.text-white{color:#475569!important}
      .text-slate-950{color:#0f172a!important}
      .bg-navy-950\\/80{background:#f8fafc!important;border-top:1px solid #e2e8f0!important}
      .bg-white\\/5{background:#f8fafc!important}
      .border-white\\/10,.border-white\\/5{border-color:#e2e8f0!important}
      .gold-gradient-text{background:linear-gradient(135deg,#7c590b,#c79a2b,#7c590b)!important;-webkit-background-clip:text!important;background-clip:text!important}
      .ka-tabbar{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px!important;align-items:stretch!important;padding:8px 0!important;white-space:normal!important}
      .ka-tabbar .tab-btn{display:flex!important;align-items:center!important;justify-content:center!important;min-height:46px!important;padding:7px 8px!important;border:1px solid #e2e8f0!important;border-radius:11px!important;background:#fff!important;color:#475569!important;white-space:normal!important;text-align:center!important;line-height:1.2!important;flex:none!important;box-shadow:0 1px 3px rgba(15,23,42,.035)!important}
      .ka-tabbar .tab-btn.active{background:linear-gradient(135deg,#fff9e8,#ffffff)!important;color:#8a6414!important;border-color:rgba(199,154,43,.52)!important;border-bottom:3px solid #c79a2b!important;box-shadow:0 4px 12px rgba(199,154,43,.10)!important}
      .ka-tabbar .tab-btn:hover{background:#fffdf6!important;border-color:#d7c38e!important}
      .ka-brand-logo{width:56px;height:56px;object-fit:contain;background:#fff;border-radius:14px;padding:2px;border:1px solid rgba(199,154,43,.40);box-shadow:0 3px 10px rgba(15,23,42,.07)}
      .ka-page-logo{width:56px;height:56px;object-fit:contain;background:#fff;border-radius:12px;padding:2px;border:1px solid #e2e8f0}
      main{max-width:1280px!important;padding-top:18px!important;padding-bottom:28px!important}
      main .glass-panel{border-radius:16px!important}
      button{touch-action:manipulation!important}
      @media(max-width:1023px){.ka-tabbar{grid-template-columns:repeat(4,minmax(0,1fr));}}
      @media(max-width:767px){
        header>.max-w-7xl.mx-auto{padding:10px 10px!important;align-items:flex-start!important}
        header h1{font-size:1.18rem!important;line-height:1.2!important}
        header p{font-size:10px!important;line-height:1.35!important}
        .ka-brand-logo{width:46px;height:46px;border-radius:11px}
        .ka-tabbar{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px!important;padding:7px 8px!important}
        .ka-tabbar .tab-btn{min-height:50px!important;font-size:11px!important;padding:7px 5px!important}
        main{padding:12px 10px 24px!important}
        input,select,textarea,button{min-height:42px}
        .grid{gap:12px!important}
      }
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    `;
    document.head.appendChild(s);
  }

  function prepareTabs(){
    const first=document.querySelector('header .tab-btn');
    if(first&&first.parentElement) first.parentElement.classList.add('ka-tabbar');
    if(window.__kaSingleTabWired) return;
    window.__kaSingleTabWired=true;
    document.addEventListener('click',function(e){
      const btn=e.target.closest && e.target.closest('header .tab-btn');
      if(!btn) return;
      setTimeout(function(){
        document.querySelectorAll('header .tab-btn.active').forEach(x=>x.classList.remove('active'));
        btn.classList.add('active');
      },20);
    },true);
  }

  function patchTabViews(){
    if(window.__kaTabViewsPatched) return;
    window.__kaTabViewsPatched=true;
    ['showSettings','showAdmin','showExpenses'].forEach(function(name){
      const fn=window[name];
      if(typeof fn!=='function') return;
      window[name]=function(){
        const r=fn.apply(this,arguments);
        setTimeout(function(){
          const id=name==='showSettings'?'tab-site-settings':name==='showAdmin'?'tab-user-admin':'tab-other-expenses';
          const b=document.getElementById(id);
          if(b){document.querySelectorAll('header .tab-btn.active').forEach(x=>x.classList.remove('active'));b.classList.add('active');}
        },25);
        return r;
      };
    });
  }

  function patchLogo(){
    const logo=logoUrl();
    const header=document.querySelector('header');
    if(header){
      const holder=header.querySelector('svg')?.parentElement;
      if(holder){
        holder.innerHTML='<img class="ka-brand-logo" src="'+logo+'" alt="কোরআনের আলো লোগো">';
        holder.style.background='transparent';holder.style.padding='0';holder.style.border='0';holder.style.boxShadow='none';
      }
      const title=header.querySelector('h1'); if(title) title.classList.add('ka-brand-title');
    }
    document.querySelectorAll('[data-brand-logo],[data-ka-exp-logo]').forEach(function(img){img.src=logo;img.classList.remove('hidden');});
    window.state=window.state||{};window.state.siteSettings=window.state.siteSettings||{};
    if(!window.state.siteSettings.logoUrl){window.state.siteSettings.logoUrl=logo;}
  }

  function boot(){css();prepareTabs();patchTabViews();patchLogo();}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,100));
  window.addEventListener('load',()=>setTimeout(boot,180));
  window.addEventListener('koraner-auth-ready',()=>setTimeout(boot,180));
  setTimeout(boot,320);
})();