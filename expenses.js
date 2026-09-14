(function(){
  'use strict';
  const money = n => '৳ ' + Number(n||0).toLocaleString('bn-BD',{minimumFractionDigits:0,maximumFractionDigits:2});
  const today = () => new Date().toISOString().slice(0,10);
  const uid = () => 'EXP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();

  function ensureState(){
    window.state = window.state || {};
    if(!Array.isArray(window.state.expenses)) window.state.expenses = [];
    if(!window.state.siteSettings) window.state.siteSettings = {};
    return window.state;
  }

  function patchNormalizeState(){
    if(window.__kaExpenseNormalizePatched || typeof window.normalizeState!=='function') return;
    const original = window.normalizeState;
    window.normalizeState = function(data){
      const out = original(data||{});
      out.expenses = Array.isArray(data && data.expenses) ? data.expenses.slice() : (Array.isArray(window.state&&window.state.expenses)?window.state.expenses.slice():[]);
      return out;
    };
    window.__kaExpenseNormalizePatched = true;
  }

  function save(){
    ensureState();
    if(window.saveData) window.saveData();
    else {
      try{ localStorage.setItem('koraner_alo_db_v2', JSON.stringify(window.state)); }catch(e){}
      if(window.pushStateToCloud) window.pushStateToCloud();
    }
  }

  function getFiltered(){
    ensureState();
    const month = document.getElementById('ka-exp-month')?.value || '';
    const q = (document.getElementById('ka-exp-search')?.value || '').trim().toLowerCase();
    return window.state.expenses.filter(x=>{
      const monthOK = !month || String(x.date||'').slice(0,7)===month;
      const hay = [x.title,x.category,x.payee,x.reference,x.note,x.expenseNo].filter(Boolean).join(' ').toLowerCase();
      return monthOK && (!q || hay.includes(q));
    }).sort((a,b)=>(b.date||'').localeCompare(a.date||'') || String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  }

  function printExpense(id){
    ensureState();
    const e=window.state.expenses.find(x=>x.id===id);
    if(!e) return;
    const s=Object.assign({
      institutionName:'কোরআনের আলো', subtitle:'অনলাইন কুরআন শিক্ষা কেন্দ্র',
      phone:'', email:'', address:'', logoUrl:''
    }, window.state.siteSettings||{});
    const logo=s.logoUrl || '';
    const html='<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>'+e.expenseNo+'</title>'+\
      '<style>@page{size:A4;margin:15mm}body{font-family:Arial,"Noto Sans Bengali",sans-serif;color:#172033;margin:0}.wrap{max-width:760px;margin:auto}.head{display:flex;align-items:center;gap:18px;border-bottom:2px solid #c9a33b;padding-bottom:14px}.logo{width:90px;height:90px;object-fit:contain}.brand h1{margin:0;font-size:25px}.brand p{margin:4px 0;color:#555;font-size:13px}.meta{margin-top:18px;display:flex;justify-content:space-between;gap:20px}.box{border:1px solid #ddd;border-radius:10px;padding:12px}.title{font-size:22px;font-weight:700;text-align:center;margin:24px 0 14px}.table{width:100%;border-collapse:collapse}.table th,.table td{border:1px solid #ddd;padding:10px}.table th{background:#f6f1df;text-align:left;width:35%}.amount{font-size:24px;font-weight:700;text-align:right;margin-top:18px}.sign{display:flex;justify-content:space-between;margin-top:85px}.sign div{width:30%;text-align:center;border-top:1px solid #777;padding-top:6px;font-size:12px}</style></head><body><div class="wrap">'+\
      '<div class="head">'+(logo?'<img class="logo" src="'+logo+'">':'')+'<div class="brand"><h1>'+esc(s.institutionName)+'</h1><p>'+esc(s.subtitle)+'</p><p>'+esc(s.address||'')+' '+(s.phone?'• '+esc(s.phone):'')+(s.email?' • '+esc(s.email):'')+'</p></div></div>'+\
      '<div class="title">অন্যান্য ব্যয়ের ভাউচার / EXPENSE INVOICE</div>'+\
      '<div class="meta"><div class="box"><b>ভাউচার নং:</b> '+esc(e.expenseNo)+'</div><div class="box"><b>তারিখ:</b> '+esc(e.date)+'</div></div>'+\
      '<table class="table" style="margin-top:16px"><tr><th>খরচের শিরোনাম</th><td>'+esc(e.title)+'</td></tr><tr><th>খরচের ধরন</th><td>'+esc(e.category)+'</td></tr><tr><th>যাকে/যেখানে প্রদান</th><td>'+esc(e.payee||'—')+'</td></tr><tr><th>পেমেন্ট মাধ্যম</th><td>'+esc(e.method||'—')+'</td></tr><tr><th>রেফারেন্স/বিল নং</th><td>'+esc(e.reference||'—')+'</td></tr><tr><th>বিস্তারিত</th><td>'+esc(e.note||'—')+'</td></tr></table>'+\
      '<div class="amount">মোট খরচ: '+money(e.amount)+'</div>'+\
      '<div class="sign"><div>প্রদানকারী / গ্রহণকারী</div><div>হিসাব রক্ষক</div><div>পরিচালক / কর্তৃপক্ষ</div></div></div><script>window.onload=()=>setTimeout(()=>window.print(),250);function esc(v){return String(v??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]))}</script></body></html>';
    const w=window.open('','_blank','width=900,height=1000');
    if(!w){alert('পপ-আপ ব্লক হয়েছে। ব্রাউজারে pop-up অনুমতি দিন।');return;}
    w.document.open();w.document.write(html);w.document.close();
  }

  function esc(v){
    return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function showExpenses(){
    const core=['dashboard','students','payments','staffs','monthly-sheet','invoice','sheets-guide','settings'];
    core.forEach(t=>{document.getElementById('view-'+t)?.classList.add('hidden');document.getElementById('tab-'+t)?.classList.remove('active');});
    document.getElementById('ka-expenses-view')?.classList.remove('hidden');
    document.getElementById('tab-other-expenses')?.classList.add('active');
    render();
  }

  function wrapSwitchTab(){
    if(window.__kaExpenseSwitchPatched || typeof window.switchTab!=='function') return;
    const original=window.switchTab;
    window.switchTab=function(tab){
      document.getElementById('ka-expenses-view')?.classList.add('hidden');
      document.getElementById('tab-other-expenses')?.classList.remove('active');
      return original(tab);
    };
    window.__kaExpenseSwitchPatched=true;
  }

  function render(){
    ensureState();
    const rows=getFiltered();
    const total=rows.reduce((a,x)=>a+Number(x.amount||0),0);
    const list=document.getElementById('ka-expense-list');
    if(!list) return;
    document.getElementById('ka-exp-count').textContent = rows.length.toLocaleString('bn-BD')+' টি';
    document.getElementById('ka-exp-total').textContent = money(total);
    const allTotal=window.state.expenses.reduce((a,x)=>a+Number(x.amount||0),0);
    document.getElementById('ka-exp-all-total').textContent = money(allTotal);
    list.innerHTML = rows.length ? rows.map(x=>'<div class="border border-white/10 rounded-2xl p-4 bg-white/[0.02]"><div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><span class="font-bold text-white">'+esc(x.title)+'</span><span class="text-[10px] px-2 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">'+esc(x.category||'অন্যান্য')+'</span><span class="text-[10px] text-slate-500">'+esc(x.expenseNo)+'</span></div><div class="text-xs text-slate-400 mt-2">'+esc(x.date)+' • '+esc(x.payee||'প্রযোজ্য নয়')+' • '+esc(x.method||'')+'</div><div class="text-xs text-slate-500 mt-1">'+esc(x.note||'')+'</div></div><div class="flex flex-wrap items-center gap-2 shrink-0"><span class="font-extrabold text-rose-300 text-lg">'+money(x.amount)+'</span><button data-print="'+esc(x.id)+'" class="bg-sky-600/20 border border-sky-500/30 text-sky-300 px-3 py-1.5 rounded-lg text-xs">ভাউচার</button><button data-edit="'+esc(x.id)+'" class="bg-amber-600/20 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg text-xs">এডিট</button><button data-del="'+esc(x.id)+'" class="bg-rose-600/20 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-lg text-xs">ডিলিট</button></div></div></div>').join('') : '<div class="text-slate-500 text-sm p-5 text-center border border-dashed border-white/10 rounded-2xl">কোনো অন্যান্য ব্যয়ের রেকর্ড নেই।</div>';
    list.querySelectorAll('[data-print]').forEach(b=>b.onclick=()=>printExpense(b.dataset.print));
    list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editExpense(b.dataset.edit));
    list.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteExpense(b.dataset.del));
  }

  function resetForm(){
    document.getElementById('ka-exp-form')?.reset();
    document.getElementById('ka-exp-date').value=today();
    document.getElementById('ka-exp-method').value='নগদ';
    document.getElementById('ka-exp-category').value='অফিস / পরিচালনা';
    document.getElementById('ka-exp-id').value='';
    document.getElementById('ka-exp-form-title').textContent='নতুন অন্যান্য ব্যয় এন্ট্রি';
    document.getElementById('ka-exp-save').innerHTML='<i class="fa-solid fa-floppy-disk"></i> খরচ সেভ করুন';
    document.getElementById('ka-exp-cancel')?.classList.add('hidden');
  }

  function fillExpense(x){
    document.getElementById('ka-exp-id').value=x.id;
    document.getElementById('ka-exp-title').value=x.title||'';
    document.getElementById('ka-exp-category').value=x.category||'অফিস / পরিচালনা';
    document.getElementById('ka-exp-amount').value=x.amount||'';
    document.getElementById('ka-exp-date').value=x.date||today();
    document.getElementById('ka-exp-method').value=x.method||'নগদ';
    document.getElementById('ka-exp-payee').value=x.payee||'';
    document.getElementById('ka-exp-reference').value=x.reference||'';
    document.getElementById('ka-exp-note').value=x.note||'';
    document.getElementById('ka-exp-form-title').textContent='অন্যান্য ব্যয় এন্ট্রি সম্পাদনা';
    document.getElementById('ka-exp-save').innerHTML='<i class="fa-solid fa-pen-to-square"></i> পরিবর্তন সেভ করুন';
    document.getElementById('ka-exp-cancel').classList.remove('hidden');
    document.getElementById('ka-exp-title').focus();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function editExpense(id){
    const x=window.state.expenses.find(a=>a.id===id);
    if(x) fillExpense(x);
  }

  function deleteExpense(id){
    const x=window.state.expenses.find(a=>a.id===id);
    if(!x)return;
    if(!confirm('এই ব্যয়ের রেকর্ডটি মুছে ফেলবেন?'))return;
    window.state.expenses=window.state.expenses.filter(a=>a.id!==id);
    save(); render();
  }

  function submit(e){
    e.preventDefault(); ensureState();
    const id=document.getElementById('ka-exp-id').value;
    const amount=Number(document.getElementById('ka-exp-amount').value);
    const title=document.getElementById('ka-exp-title').value.trim();
    const date=document.getElementById('ka-exp-date').value;
    if(!title || !date || !amount || amount<0){alert('খরচের শিরোনাম, তারিখ ও সঠিক খরচের পরিমাণ দিন।');return;}
    const payload={
      id:id||uid(),
      expenseNo:id?(window.state.expenses.find(x=>x.id===id)?.expenseNo || uid()):uid(),
      title,
      category:document.getElementById('ka-exp-category').value.trim()||'অন্যান্য',
      amount,
      date,
      method:document.getElementById('ka-exp-method').value,
      payee:document.getElementById('ka-exp-payee').value.trim(),
      reference:document.getElementById('ka-exp-reference').value.trim(),
      note:document.getElementById('ka-exp-note').value.trim(),
      createdAt:id?(window.state.expenses.find(x=>x.id===id)?.createdAt||new Date().toISOString()):new Date().toISOString()
    };
    const idx=window.state.expenses.findIndex(x=>x.id===id);
    if(idx>=0) window.state.expenses[idx]=payload; else window.state.expenses.push(payload);
    save(); resetForm(); render();
    alert('অন্যান্য ব্যয়ের তথ্য সফলভাবে সেভ হয়েছে।');
  }

  function addUI(){
    if(document.getElementById('ka-expenses-view')){render();return;}
    const staffBtn=document.getElementById('tab-staffs');
    const nav=staffBtn?.parentElement || document.querySelector('header .max-w-7xl.mx-auto.flex.gap-2.text-sm');
    const main=document.querySelector('main');
    if(!nav||!main)return;
    const btn=document.createElement('button');
    btn.id='tab-other-expenses';
    btn.className='tab-btn py-2.5 px-3 font-medium flex items-center gap-2 rounded-t-lg transition text-slate-300 whitespace-nowrap';
    btn.innerHTML='<i class="fa-solid fa-money-bill-transfer text-rose-400"></i> অন্যান্য ব্যয়';
    btn.onclick=showExpenses;
    if(staffBtn) staffBtn.after(btn); else nav.appendChild(btn);

    const sec=document.createElement('section');
    sec.id='ka-expenses-view'; sec.className='space-y-6 hidden';
    sec.innerHTML='<div class="glass-panel p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"><div><h2 class="text-xl font-bold gold-gradient-text flex items-center gap-2"><i class="fa-solid fa-money-bill-transfer text-rose-400"></i> অন্যান্য ব্যয় ব্যবস্থাপনা</h2><p class="text-xs text-slate-400 mt-1">বেতন/স্টুডেন্ট ফি ছাড়া অফিস, ইউটিলিটি, মেরামত, পরিবহন, সরঞ্জাম ও অন্যান্য সকল খরচ এখানে সংরক্ষণ করুন।</p></div><div class="flex flex-wrap gap-3 text-xs"><div class="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2"><div class="text-slate-500">ফিল্টারকৃত মোট</div><div id="ka-exp-total" class="font-bold text-rose-300 text-lg">৳ ০</div></div><div class="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2"><div class="text-slate-500">সব রেকর্ডের মোট</div><div id="ka-exp-all-total" class="font-bold text-amber-300 text-lg">৳ ০</div></div><div class="bg-white/5 border border-white/10 rounded-xl px-4 py-2"><div class="text-slate-500">রেকর্ড</div><div id="ka-exp-count" class="font-bold text-slate-200 text-lg">০ টি</div></div></div></div>'+\
    '<div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="glass-panel p-6 rounded-2xl"><div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4"><h3 id="ka-exp-form-title" class="text-md font-bold text-slate-200">নতুন অন্যান্য ব্যয় এন্ট্রি</h3><span class="text-[10px] text-slate-500">ইনভয়েস/ভাউচার সহ</span></div><form id="ka-exp-form" class="space-y-3 text-xs"><input id="ka-exp-id" type="hidden"><div><label class="block font-semibold text-slate-300 mb-1">খরচের শিরোনাম *</label><input id="ka-exp-title" required class="glass-input w-full p-2.5 rounded-xl" placeholder="যেমন: বিদ্যুৎ বিল / স্টেশনারি / মেরামত"></div><div class="grid grid-cols-2 gap-3"><div><label class="block font-semibold text-slate-300 mb-1">খরচের ধরন</label><select id="ka-exp-category" class="glass-input w-full p-2.5 rounded-xl bg-navy-900"><option>অফিস / পরিচালনা</option><option>বিদ্যুৎ / গ্যাস / পানি</option><option>ভাড়া</option><option>স্টেশনারি / শিক্ষা সামগ্রী</option><option>মেরামত / রক্ষণাবেক্ষণ</option><option>পরিবহন</option><option>খাবার / আপ্যায়ন</option><option>বিজ্ঞাপন / প্রচার</option><option>যন্ত্রপাতি / সরঞ্জাম</option><option>অন্যান্য</option></select></div><div><label class="block font-semibold text-slate-300 mb-1">খরচের পরিমাণ *</label><input id="ka-exp-amount" type="number" min="0" step="0.01" required class="glass-input w-full p-2.5 rounded-xl font-bold text-rose-300" placeholder="0"></div></div><div class="grid grid-cols-2 gap-3"><div><label class="block font-semibold text-slate-300 mb-1">তারিখ *</label><input id="ka-exp-date" type="date" required class="glass-input w-full p-2.5 rounded-xl"></div><div><label class="block font-semibold text-slate-300 mb-1">পেমেন্ট মাধ্যম</label><select id="ka-exp-method" class="glass-input w-full p-2.5 rounded-xl bg-navy-900"><option>নগদ</option><option>ব্যাংক</option><option>বিকাশ</option><option>নগদ (মোবাইল)</option><option>রকেট</option><option>চেক</option><option>অন্যান্য</option></select></div></div><div><label class="block font-semibold text-slate-300 mb-1">যাকে/যেখানে প্রদান করা হয়েছে</label><input id="ka-exp-payee" class="glass-input w-full p-2.5 rounded-xl" placeholder="দোকান / সরবরাহকারী / ব্যক্তি"></div><div><label class="block font-semibold text-slate-300 mb-1">রেফারেন্স / বিল নং</label><input id="ka-exp-reference" class="glass-input w-full p-2.5 rounded-xl" placeholder="ঐচ্ছিক"></div><div><label class="block font-semibold text-slate-300 mb-1">বিস্তারিত / নোট</label><textarea id="ka-exp-note" rows="3" class="glass-input w-full p-2.5 rounded-xl" placeholder="খরচের বিস্তারিত লিখুন"></textarea></div><div class="flex gap-2"><button id="ka-exp-save" class="flex-1 bg-gradient-to-r from-rose-600 to-orange-500 text-white font-bold py-2.5 rounded-xl"><i class="fa-solid fa-floppy-disk"></i> খরচ সেভ করুন</button><button type="button" id="ka-exp-cancel" class="hidden bg-slate-700 text-white font-bold px-4 rounded-xl">বাতিল</button></div></form><div class="mt-4 pt-4 border-t border-white/10 text-[11px] text-slate-500">এই হিসাবের ভাউচার প্রিন্ট করলে প্রতিষ্ঠান সেটিংসে সংরক্ষিত লোগো স্বয়ংক্রিয়ভাবে থাকবে।</div></div><div class="lg:col-span-2 glass-panel p-6 rounded-2xl"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-4"><h3 class="text-md font-bold text-slate-200">অন্যান্য ব্যয়ের তালিকা</h3><div class="flex gap-2"><input id="ka-exp-month" type="month" class="glass-input p-2 rounded-xl text-xs"><input id="ka-exp-search" class="glass-input p-2 rounded-xl text-xs w-44" placeholder="শিরোনাম/সরবরাহকারী খুঁজুন"></div></div><div id="ka-expense-list" class="space-y-3 max-h-[680px] overflow-auto pr-1"></div></div></div>'+\
    '<div class="glass-panel p-5 rounded-2xl"><div class="flex items-center gap-3"><img src="" data-ka-exp-logo class="w-20 h-20 object-contain rounded-xl bg-white p-1 border border-amber-500/20" alt="Logo"><div><h3 class="font-bold text-white">ডিজিটাল ভাউচার</h3><p class="text-xs text-slate-400">প্রতিটি খরচের পাশে <b>ভাউচার</b> চাপলে A4 প্রিন্ট / PDF বানানো যাবে।</p></div></div></div>';
    main.appendChild(sec);
    document.getElementById('ka-exp-form').addEventListener('submit',submit);
    document.getElementById('ka-exp-cancel').onclick=resetForm;
    document.getElementById('ka-exp-month').addEventListener('change',render);
    document.getElementById('ka-exp-search').addEventListener('input',render);
    document.querySelector('[data-ka-exp-logo]').src = (window.state.siteSettings&&window.state.siteSettings.logoUrl) || '';
    resetForm();
    render();
  }

  function boot(){
    patchNormalizeState();
    ensureState();
    addUI();
    wrapSwitchTab();
    render();
  }

  window.KA_SHOW_OTHER_EXPENSES=showExpenses;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,200),{once:true});
  else setTimeout(boot,200);
  window.addEventListener('load',()=>setTimeout(boot,250));
  window.addEventListener('koraner-auth-ready',()=>setTimeout(boot,150));
})();
