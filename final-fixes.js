(function(){
  'use strict';
  const C=window.KORANER_ALO_CONFIG||{};
  const U=(C.supabaseUrl||'').replace(/\/$/,'');
  const K=C.supabaseAnonKey||'';
  const WORKSPACE=C.workspaceId||'koraner-alo';
  const LOGO=()=>window.KA_DEFAULT_LOGO || window.KA_DEFAULT_LOGO_URL || '';
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const member=()=>window.KA_MEMBER||{};
  const admin=()=>member().status==='active'&&member().role==='admin';
  const active=()=>member().status==='active';
  function token(){return window.KORANER_ACCESS_TOKEN||K;}
  function h(extra){return Object.assign({apikey:K,Authorization:'Bearer '+token(),'Content-Type':'application/json'},extra||{});}
  async function rest(path,opts){const r=await fetch(U+'/rest/v1/'+path,Object.assign({},opts||{},{headers:h(opts&&opts.headers)}));const t=await r.text();if(!r.ok)throw new Error(t);return t?JSON.parse(t):null;}

  function style(){
    if(document.getElementById('ka-final-fixes-style'))return;
    const s=document.createElement('style');s.id='ka-final-fixes-style';s.textContent=`
      html,body{background:#f4f7fb!important;color:#1e293b!important}
      body{background-image:none!important}
      .glass-panel{background:#fff!important;border-color:#e5e7eb!important;box-shadow:0 5px 18px rgba(15,23,42,.06)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
      .glass-input{background:#fff!important;color:#172033!important;border-color:#d8dee8!important;backdrop-filter:none!important}
      .glass-input option{color:#172033!important;background:#fff!important}
      .gold-gradient-text{-webkit-text-fill-color:initial!important;background:none!important;color:#9a6b08!important}
      .ka-final-logo{width:56px!important;height:56px!important;object-fit:contain!important;background:#fff!important;border-radius:12px!important;padding:2px!important}
      #printable-area .ka-final-logo{width:64px!important;height:64px!important;border-radius:50%!important;border:1px solid #d4af37!important}
      #cloud-sync-badge,.ka-final-hide,.ka-legacy-cloud{display:none!important}
      @media(max-width:768px){.ka-final-logo{width:46px!important;height:46px!important}#printable-area .ka-final-logo{width:58px!important;height:58px!important}}
    `;document.head.appendChild(s);
  }

  function hideLegacyControls(){
    ['cloud-sync-badge','sync-status-text'].forEach(id=>document.getElementById(id)?.closest('div')?.classList.add('ka-final-hide'));
    document.querySelectorAll('button').forEach(b=>{
      const t=(b.innerText||'').trim(); const o=b.getAttribute('onclick')||'';
      if(t==='ব্যাকআপ'||t==='রিস্টোর'||o.includes('exportDataJSON')||o.includes("getElementById('importFile')")||o.includes('importDataJSON')) b.classList.add('ka-final-hide');
      if(t.includes('ক্লাউড অটো-সিঙ্ক')) b.classList.add('ka-final-hide');
    });
    document.querySelectorAll('span,p').forEach(e=>{const t=(e.innerText||'').trim();if(t==='ক্লাউড অটো-সিঙ্ক ভের্সন')e.classList.add('ka-final-hide');});
  }

  function brand(){
    const s=Object.assign({institutionName:'কোরআনের আলো',subtitle:'অনলাইন কুরআন শিক্ষা কেন্দ্র',phone:'',email:'',address:'',logoUrl:''},window.state&&window.state.siteSettings||{});
    const logo=s.logoUrl||LOGO();
    document.querySelectorAll('[data-brand-name]').forEach(e=>e.textContent=s.institutionName);
    document.querySelectorAll('[data-brand-subtitle]').forEach(e=>e.textContent=s.subtitle);
    document.querySelectorAll('[data-brand-phone]').forEach(e=>e.textContent=s.phone);
    document.querySelectorAll('[data-brand-email]').forEach(e=>e.textContent=s.email);
    document.querySelectorAll('[data-brand-address]').forEach(e=>e.textContent=s.address);
    patchHeaderLogo(logo,s);
    patchInvoice(logo,s);
    patchMonthly(logo,s);
  }
  function patchHeaderLogo(logo,s){
    const header=document.querySelector('header');if(!header||!logo)return;
    const holder=header.querySelector('svg')?.parentElement;
    if(holder){
      const old=holder.querySelector('svg');
      if(old){old.remove(); if(!holder.querySelector('.ka-final-logo')){const img=document.createElement('img');img.className='ka-final-logo';img.src=logo;img.alt=s.institutionName;holder.appendChild(img);}}
    }
    const h1=header.querySelector('h1'); if(h1){const txt=h1.firstChild; if(txt) txt.textContent=s.institutionName+' '; h1.classList.remove('gold-gradient-text');}
    const p=header.querySelector('p');if(p)p.textContent=[s.subtitle,s.tagline].filter(Boolean).join(' • ');
  }
  function patchInvoice(logo,s){
    const area=document.getElementById('printable-area');if(!area)return;
    const logoBox=area.querySelector('svg')?.parentElement;
    if(logoBox && logo){area.querySelectorAll('svg').forEach(svg=>{const par=svg.parentElement;if(par&&par.closest('#printable-area'))svg.remove();});}
    const firstBox=area.querySelector('.flex.items-center.gap-4');
    if(firstBox && logo && !firstBox.querySelector('.ka-final-logo')){const img=document.createElement('img');img.className='ka-final-logo';img.src=logo;img.alt=s.institutionName;const holder=firstBox.querySelector('div');if(holder){holder.innerHTML='';holder.appendChild(img)}}
    const h1=area.querySelector('h1');if(h1)h1.textContent=s.institutionName;
    const ps=area.querySelectorAll('p'); if(ps[0]) ps[0].textContent=s.subtitle;
    if(ps[1]) ps[1].textContent=[s.address,s.phone,s.email].filter(Boolean).join(' • ');
    const auth=area.querySelector('.font-bold.text-emerald-900');if(auth)auth.textContent='অফিসিয়াল কর্তৃপক্ষ';
    area.querySelectorAll('p').forEach(p=>{if((p.innerText||'').trim()==='কোরআনের আলো')p.textContent=s.institutionName;});
  }
  function patchMonthly(logo,s){
    const v=document.getElementById('view-monthly-sheet');if(!v)return;
    const h2=v.querySelector('h2');if(h2)h2.textContent=s.institutionName+' - মাসিক ব্যালেন্স শিট';
    const sub=v.querySelector('h2')?.parentElement?.querySelectorAll('p'); if(sub&&sub[0])sub[0].textContent=[s.subtitle,s.address,s.phone,s.email].filter(Boolean).join(' • ');
    const box=v.querySelector('h2')?.parentElement?.parentElement?.querySelector('svg')?.parentElement;
    if(box&&logo){box.innerHTML='<img class="ka-final-logo" src="'+logo+'" alt="'+esc(s.institutionName)+'">';}
  }
  function patchPrint(){
    if(window.__kaFinalPrintPatched)return;
    const native=window.print.bind(window);window.print=function(){brand();setTimeout(native,40)};window.__kaFinalPrintPatched=true;
  }

  async function writeAudit(action,detail){
    if(!active())return;
    const m=member();
    try{await rest('audit_logs',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({workspace_id:WORKSPACE,user_id:m.id,email:m.email||'',action,detail:detail||''})});}catch(e){console.warn('audit log failed',e)}
  }
  function patchSave(){
    if(window.__kaFinalSavePatched||typeof window.saveData!=='function')return;
    const orig=window.saveData;
    window.saveData=function(){const before=JSON.stringify(window.state);const r=orig.apply(this,arguments);const after=JSON.stringify(window.state);if(before!==after)writeAudit('ডাটা আপডেট','সিস্টেমের তথ্য পরিবর্তন/সংরক্ষণ করা হয়েছে');return r};
    window.__kaFinalSavePatched=true;
  }
  async function renderAuditTable(){
    const box=document.getElementById('ka-audit-list');if(!box||!admin())return;
    try{
      const rows=await rest('audit_logs?workspace_id=eq.'+encodeURIComponent(WORKSPACE)+'&order=created_at.desc&limit=200&select=id,email,action,detail,created_at');
      box.innerHTML=rows&&rows.length?'<table class="w-full text-xs"><thead><tr class="border-b border-slate-200"><th class="p-3 text-left">সময়</th><th class="p-3 text-left">ব্যবহারকারী</th><th class="p-3 text-left">কাজ</th><th class="p-3 text-left">বিবরণ</th></tr></thead><tbody>'+rows.map(x=>'<tr class="border-b border-slate-100"><td class="p-3 text-slate-500">'+esc(new Date(x.created_at).toLocaleString('bn-BD'))+'</td><td class="p-3 font-semibold text-slate-700">'+esc(x.email)+'</td><td class="p-3 text-slate-700">'+esc(x.action)+'</td><td class="p-3 text-slate-500">'+esc(x.detail||'')+'</td></tr>').join('')+'</tbody></table>':'<div class="p-5 text-center text-slate-400">এখনও কোনো audit record নেই।</div>';
    }catch(e){box.innerHTML='<div class="p-5 text-center text-rose-500">Audit log লোড করা যায়নি।</div>';console.warn(e)}
  }
  function patchAuditUI(){
    const b=document.getElementById('tab-audit-logs');if(b&&!b.__finalAudit){b.addEventListener('click',()=>setTimeout(renderAuditTable,60));b.__finalAudit=true;}
  }
  function watchSettings(){
    const f=document.getElementById('ka-settings-form');if(!f||f.__finalBrand){return !!f;}
    f.addEventListener('submit',()=>setTimeout(()=>{brand();writeAudit('প্রতিষ্ঠান সেটিংস আপডেট','প্রতিষ্ঠানের ব্র্যান্ডিং/যোগাযোগ তথ্য পরিবর্তন করা হয়েছে');},120));f.__finalBrand=true;return true;
  }
  function boot(){
    style();hideLegacyControls();brand();patchPrint();patchSave();patchAuditUI();watchSettings();
    if(admin())setTimeout(renderAuditTable,300);
    setTimeout(()=>{hideLegacyControls();brand();patchAuditUI();watchSettings();},800);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,120),{once:true});else setTimeout(boot,120);
  window.addEventListener('load',()=>setTimeout(boot,180));
  window.addEventListener('koraner-auth-ready',()=>setTimeout(boot,180));
  setInterval(()=>{hideLegacyControls();watchSettings();},1500);
})();