(function(){
  'use strict';
  const MONEY=n=>'৳ '+Number(n||0).toLocaleString('bn-BD',{maximumFractionDigits:0});
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const monthNow=()=>new Date().toISOString().slice(0,7);
  const activeMember=()=>window.KA_MEMBER&&window.KA_MEMBER.status==='active';
  const admin=()=>activeMember()&&window.KA_MEMBER.role==='admin';
  function state(){window.state=window.state||{};window.state.studentPayments=Array.isArray(window.state.studentPayments)?window.state.studentPayments:[];window.state.salaryPayments=Array.isArray(window.state.salaryPayments)?window.state.salaryPayments:[];window.state.expenses=Array.isArray(window.state.expenses)?window.state.expenses:[];window.state.auditLogs=Array.isArray(window.state.auditLogs)?window.state.auditLogs:[];window.state.siteSettings=window.state.siteSettings||{};return window.state;}
  function css(){
    if(document.getElementById('ka-pro-suite-style'))return;
    const s=document.createElement('style');s.id='ka-pro-suite-style';s.textContent=`
      header .max-w-7xl.mx-auto.flex.gap-2.text-sm{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:7px!important;overflow:visible!important;white-space:normal!important;align-items:stretch!important}
      header .max-w-7xl.mx-auto.flex.gap-2.text-sm .tab-btn{width:100%!important;justify-content:center!important;min-width:0!important;text-align:center!important;line-height:1.25!important;border:1px solid #e2e8f0!important;background:#fff!important;border-radius:12px!important;padding:10px 8px!important;white-space:normal!important;box-shadow:0 1px 4px rgba(15,23,42,.04)!important}
      header .max-w-7xl.mx-auto.flex.gap-2.text-sm .tab-btn.active{background:linear-gradient(135deg,#fff8dc,#eefbf5)!important;border-color:#d4af37!important;border-bottom:2px solid #c18b19!important;color:#765000!important;box-shadow:0 3px 10px rgba(15,23,42,.07)!important}
      #ka-pro-view,#ka-audit-view{scroll-margin-top:120px}
      .ka-pro-card{background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:18px;box-shadow:0 8px 24px rgba(15,23,42,.06)}
      .ka-pro-kpi{border-radius:16px;padding:16px;border:1px solid #e5e7eb;background:linear-gradient(135deg,#fff,#f8fafc)}
      .ka-pro-kpi .n{font-size:26px;font-weight:800;margin-top:3px}
      .ka-pro-table{width:100%;border-collapse:collapse}.ka-pro-table th,.ka-pro-table td{padding:10px;border-bottom:1px solid #edf0f4;font-size:12px;text-align:left}.ka-pro-table th{font-weight:700;color:#64748b;background:#f8fafc;position:sticky;top:0}.ka-pro-table td.num{text-align:right;font-weight:700}
      .ka-quickbar{position:fixed;right:18px;bottom:18px;z-index:9990;display:flex;gap:8px;flex-wrap:wrap;max-width:calc(100vw - 36px)}
      .ka-quickbar button{background:#fff;border:1px solid #dbe2ea;border-radius:14px;padding:11px 13px;box-shadow:0 8px 24px rgba(15,23,42,.10);font-size:12px;font-weight:700;color:#334155}
      .ka-quickbar button.primary{background:#0f766e;color:#fff;border-color:#0f766e}
      .ka-report-print{background:#fff;color:#111}
      @media(max-width:1024px){header .max-w-7xl.mx-auto.flex.gap-2.text-sm{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
      @media(max-width:640px){header .max-w-7xl.mx-auto.flex.gap-2.text-sm{grid-template-columns:repeat(2,minmax(0,1fr))!important;padding:8px!important}.ka-pro-kpi .n{font-size:21px}.ka-quickbar{left:10px;right:10px;bottom:10px}.ka-quickbar button{flex:1 1 calc(50% - 8px);min-height:46px}.ka-pro-table th,.ka-pro-table td{padding:8px;font-size:11px}.ka-pro-card{padding:13px}}
      @media print{body{background:#fff!important}.no-print,.ka-quickbar{display:none!important}.ka-pro-view-shell{box-shadow:none!important;border:0!important}}
    `;document.head.appendChild(s);
  }
  function patchTabs(){
    if(window.__kaProTabsPatched||typeof window.switchTab!=='function')return;
    const orig=window.switchTab;
    window.switchTab=function(tab){
      document.querySelectorAll('header .tab-btn').forEach(b=>b.classList.remove('active'));
      ['ka-pro-view','ka-audit-view'].forEach(id=>document.getElementById(id)?.classList.add('hidden'));
      ['tab-pro-reports','tab-audit-logs'].forEach(id=>document.getElementById(id)?.classList.remove('active'));
      const r=orig(tab);
      document.getElementById('tab-'+tab)?.classList.add('active');
      return r;
    };
    window.__kaProTabsPatched=true;
  }
  function addNav(id,label,icon,fn){
    if(document.getElementById(id))return;
    const nav=document.querySelector('header .max-w-7xl.mx-auto.flex.gap-2.text-sm');if(!nav)return;
    const b=document.createElement('button');b.id=id;b.className='tab-btn py-2.5 px-3 font-medium flex items-center gap-2';b.innerHTML='<i class="'+icon+'"></i> '+label;b.onclick=fn;nav.appendChild(b);
  }
  function totals(m){
    const s=state();const inc=s.studentPayments.filter(x=>String(x.date||'').startsWith(m)).reduce((a,x)=>a+Number(x.paidAmount||0),0);const sal=s.salaryPayments.filter(x=>String(x.date||'').startsWith(m)).reduce((a,x)=>a+Number(x.paidAmount||0),0);const oth=s.expenses.filter(x=>String(x.date||'').startsWith(m)).reduce((a,x)=>a+Number(x.amount||0),0);return{inc,sal,oth,expense:sal+oth,net:inc-sal-oth};
  }
  function reportView(){
    if(!admin())return;
    const month=document.getElementById('ka-pro-report-month')?.value||monthNow();const t=totals(month);const s=state();
    const incRows=s.studentPayments.filter(x=>String(x.date||'').startsWith(month));
    const othRows=s.expenses.filter(x=>String(x.date||'').startsWith(month));
    const salRows=s.salaryPayments.filter(x=>String(x.date||'').startsWith(month));
    document.getElementById('ka-r-inc').textContent=MONEY(t.inc);document.getElementById('ka-r-sal').textContent=MONEY(t.sal);document.getElementById('ka-r-oth').textContent=MONEY(t.oth);document.getElementById('ka-r-net').textContent=MONEY(t.net);
    document.getElementById('ka-r-count').textContent=(incRows.length+salRows.length+othRows.length).toLocaleString('bn-BD');
    const rows=[...incRows.map(x=>({date:x.date,type:'আয়',title:'স্টুডেন্ট ফি — '+x.studentName,amount:Number(x.paidAmount||0)})),...salRows.map(x=>({date:x.date,type:'বেতন',title:'স্যালারি — '+x.staffName,amount:-Number(x.paidAmount||0)})),...othRows.map(x=>({date:x.date,type:'অন্যান্য ব্যয়',title:x.title,amount:-Number(x.amount||0)}))].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    document.getElementById('ka-r-rows').innerHTML=rows.length?rows.map(r=>'<tr><td>'+esc(r.date)+'</td><td>'+esc(r.type)+'</td><td>'+esc(r.title)+'</td><td class="num">'+(r.amount<0?'-':'')+MONEY(Math.abs(r.amount))+'</td></tr>').join(''):'<tr><td colspan="4" style="text-align:center;padding:24px;color:#94a3b8">এই মাসে কোনো লেনদেন নেই।</td></tr>';
  }
  function showReports(){
    if(!admin())return;
    ['dashboard','students','payments','staffs','monthly-sheet','invoice','sheets-guide'].forEach(t=>{document.getElementById('view-'+t)?.classList.add('hidden');document.getElementById('tab-'+t)?.classList.remove('active')});
    document.getElementById('ka-settings-view')?.classList.add('hidden');document.getElementById('tab-site-settings')?.classList.remove('active');document.getElementById('ka-admin-view')?.classList.add('hidden');document.getElementById('tab-user-admin')?.classList.remove('active');document.getElementById('ka-expenses-view')?.classList.add('hidden');document.getElementById('tab-other-expenses')?.classList.remove('active');
    document.getElementById('ka-pro-view')?.classList.remove('hidden');document.getElementById('tab-pro-reports')?.classList.add('active');reportView();
  }
  function addReportUI(){
    if(!admin())return;
    addNav('tab-pro-reports','রিপোর্ট ও অ্যানালিটিক্স','fa-solid fa-chart-line text-indigo-500',showReports);
    if(document.getElementById('ka-pro-view'))return;
    const main=document.querySelector('main');if(!main)return;
    const sec=document.createElement('section');sec.id='ka-pro-view';sec.className='hidden space-y-5 ka-pro-view-shell';sec.innerHTML=`<div class="ka-pro-card"><div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><h2 class="text-2xl font-extrabold" style="color:#1e293b">ফাইন্যান্সিয়াল রিপোর্ট ও অ্যানালিটিক্স</h2><p style="color:#64748b;font-size:12px;margin-top:4px">মাসভিত্তিক আয়, বেতন, অন্যান্য ব্যয় ও নীট ব্যালেন্স</p></div><div class="flex gap-2"><input id="ka-pro-report-month" type="month" class="glass-input p-3 rounded-xl" value="${monthNow()}"><button id="ka-pro-report-print" class="px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs">প্রিন্ট / PDF</button></div></div></div><div class="grid grid-cols-2 lg:grid-cols-5 gap-3"><div class="ka-pro-kpi"><div style="color:#64748b;font-size:11px">মোট আয়</div><div id="ka-r-inc" class="n" style="color:#047857">৳ ০</div></div><div class="ka-pro-kpi"><div style="color:#64748b;font-size:11px">স্যালারি</div><div id="ka-r-sal" class="n" style="color:#b45309">৳ ০</div></div><div class="ka-pro-kpi"><div style="color:#64748b;font-size:11px">অন্যান্য ব্যয়</div><div id="ka-r-oth" class="n" style="color:#be123c">৳ ০</div></div><div class="ka-pro-kpi"><div style="color:#64748b;font-size:11px">নীট ব্যালেন্স</div><div id="ka-r-net" class="n" style="color:#4338ca">৳ ০</div></div><div class="ka-pro-kpi"><div style="color:#64748b;font-size:11px">মোট লেনদেন</div><div id="ka-r-count" class="n" style="color:#334155">০</div></div></div><div class="ka-pro-card"><div style="overflow:auto"><table class="ka-pro-table"><thead><tr><th>তারিখ</th><th>ধরন</th><th>বিবরণ</th><th style="text-align:right">পরিমাণ</th></tr></thead><tbody id="ka-r-rows"></tbody></table></div></div>`;main.appendChild(sec);
    document.getElementById('ka-pro-report-month').addEventListener('change',reportView);
    document.getElementById('ka-pro-report-print').onclick=()=>{const w=window.open('','_blank');if(!w)return;w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>মাসিক রিপোর্ট</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#111}h1{font-size:22px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ddd}</style></head><body>'+document.getElementById('ka-pro-view').innerHTML+'</body></html>');w.document.close();setTimeout(()=>w.print(),300)};
  }
  function addQuickBar(){
    if(document.getElementById('ka-quickbar'))return;const d=document.createElement('div');d.id='ka-quickbar';d.className='ka-quickbar no-print';d.innerHTML='<button class="primary" data-q="payments"><i class="fa-solid fa-plus"></i> ফি</button><button data-q="staffs"><i class="fa-solid fa-user-plus"></i> স্যালারি</button><button data-q="expenses"><i class="fa-solid fa-money-bill-transfer"></i> ব্যয়</button><button data-q="invoice"><i class="fa-solid fa-file-invoice"></i> ইনভয়েস</button>';document.body.appendChild(d);d.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const t=b.dataset.q;if(t==='expenses'){window.KA_SHOW_OTHER_EXPENSES?.();return}if(t==='invoice'){window.switchTab?.('invoice');return}window.switchTab?.(t)});
  }
  function audit(action,detail){
    const s=state();if(!activeMember())return;s.auditLogs.push({id:'AUD-'+Date.now().toString(36),at:new Date().toISOString(),email:window.KA_MEMBER.email||'',action,detail:detail||''});if(s.auditLogs.length>500)s.auditLogs=s.auditLogs.slice(-500);
  }
  function patchSave(){
    if(window.__kaAuditSavePatched||typeof window.saveData!=='function')return;const orig=window.saveData;let busy=false;window.saveData=function(){if(!busy&&activeMember()){busy=true;const s=state();audit('ডেটা সংরক্ষণ','সিস্টেমে একটি পরিবর্তন সংরক্ষণ করা হয়েছে');busy=false}return orig.apply(this,arguments)};window.__kaAuditSavePatched=true;
  }
  function showAudit(){
    if(!admin())return;['dashboard','students','payments','staffs','monthly-sheet','invoice','sheets-guide'].forEach(t=>{document.getElementById('view-'+t)?.classList.add('hidden');document.getElementById('tab-'+t)?.classList.remove('active')});['ka-settings-view','ka-admin-view','ka-expenses-view','ka-pro-view'].forEach(id=>document.getElementById(id)?.classList.add('hidden'));['tab-site-settings','tab-user-admin','tab-other-expenses','tab-pro-reports'].forEach(id=>document.getElementById(id)?.classList.remove('active'));document.getElementById('ka-audit-view')?.classList.remove('hidden');document.getElementById('tab-audit-logs')?.classList.add('active');renderAudit();
  }
  function renderAudit(){const box=document.getElementById('ka-audit-list');if(!box)return;const rows=[...state().auditLogs].reverse();box.innerHTML=rows.length?rows.map(x=>'<tr><td>'+esc(new Date(x.at).toLocaleString('bn-BD'))+'</td><td>'+esc(x.email)+'</td><td>'+esc(x.action)+'</td><td>'+esc(x.detail)+'</td></tr>').join(''):'<tr><td colspan="4" style="text-align:center;padding:24px;color:#94a3b8">এখনও কোনো audit event নেই।</td></tr>';}
  function addAuditUI(){
    if(!admin())return;addNav('tab-audit-logs','অডিট লগ','fa-solid fa-shield-halved text-rose-500',showAudit);if(document.getElementById('ka-audit-view'))return;const main=document.querySelector('main');if(!main)return;const sec=document.createElement('section');sec.id='ka-audit-view';sec.className='hidden space-y-5 ka-pro-view-shell';sec.innerHTML='<div class="ka-pro-card"><div class="flex items-center justify-between gap-3"><div><h2 class="text-2xl font-extrabold" style="color:#1e293b">অডিট লগ</h2><p style="color:#64748b;font-size:12px">কোন ব্যবহারকারী কখন সিস্টেমে পরিবর্তন সংরক্ষণ করেছে তার রেকর্ড</p></div><button id="ka-audit-refresh" class="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold">রিফ্রেশ</button></div></div><div class="ka-pro-card"><div style="max-height:560px;overflow:auto"><table class="ka-pro-table"><thead><tr><th>সময়</th><th>ব্যবহারকারী</th><th>অ্যাকশন</th><th>বিস্তারিত</th></tr></thead><tbody id="ka-audit-list"></tbody></table></div></div>';main.appendChild(sec);document.getElementById('ka-audit-refresh').onclick=renderAudit;}
  function patchInvoice(){
    const s=state();const logo=(s.siteSettings&&s.siteSettings.logoUrl)||((window.KA_DEFAULT_LOGO_URL)||'logo.webp?v=20260914-4');const area=document.getElementById('printable-area')||document.getElementById('invoice-print-area');if(!area)return;if(!area.querySelector('.ka-invoice-brand')){const h=document.createElement('div');h.className='ka-invoice-brand';h.style='display:flex;align-items:center;gap:14px;border-bottom:2px solid #d4af37;padding:0 0 12px;margin-bottom:16px';h.innerHTML='<img src="'+logo+'" style="width:72px;height:72px;object-fit:contain"><div><div style="font-size:22px;font-weight:800">'+esc((s.siteSettings&&s.siteSettings.institutionName)||'কোরআনের আলো')+'</div><div style="font-size:12px;color:#64748b">'+esc((s.siteSettings&&s.siteSettings.subtitle)||'অনলাইন কুরআন শিক্ষা কেন্দ্র')+'</div></div>';area.prepend(h)}else{const img=area.querySelector('.ka-invoice-brand img');if(img)img.src=logo}
  }
  function boot(){state();css();patchTabs();addQuickBar();if(admin()){addReportUI();addAuditUI();patchSave();}patchInvoice();}
  window.addEventListener('load',()=>setTimeout(boot,250));window.addEventListener('koraner-auth-ready',()=>setTimeout(boot,350));setTimeout(boot,1000);setInterval(()=>{if(admin()){addReportUI();addAuditUI();patchSave();patchInvoice()}},4000);
})();
