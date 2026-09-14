(function(){
  'use strict';
  const money=n=>'৳ '+Number(n||0).toLocaleString('bn-BD',{maximumFractionDigits:0});
  function s(){return window.state||{studentPayments:[],salaryPayments:[],expenses:[]}}
  function month(){return new Date().toISOString().slice(0,7)}
  function refresh(){
    const host=document.getElementById('view-dashboard');if(!host)return;
    if(!document.getElementById('ka-dashboard-plus')){
      const box=document.createElement('div');box.id='ka-dashboard-plus';box.className='glass-panel p-5 rounded-2xl mt-5';box.innerHTML='<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><h2 class="text-lg font-extrabold text-slate-800">এই মাসের আর্থিক সারাংশ</h2><p class="text-xs text-slate-500 mt-1">আয়, স্যালারি ও অন্যান্য ব্যয়ের তাৎক্ষণিক চিত্র</p></div><button id="ka-dash-refresh" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">আপডেট</button></div><div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4"><div class="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><div class="text-[11px] text-emerald-700">মোট আয়</div><div id="kdp-inc" class="text-xl font-extrabold text-emerald-700">৳ ০</div></div><div class="rounded-xl border border-amber-100 bg-amber-50 p-3"><div class="text-[11px] text-amber-700">স্যালারি</div><div id="kdp-sal" class="text-xl font-extrabold text-amber-700">৳ ০</div></div><div class="rounded-xl border border-rose-100 bg-rose-50 p-3"><div class="text-[11px] text-rose-700">অন্যান্য ব্যয়</div><div id="kdp-oth" class="text-xl font-extrabold text-rose-700">৳ ০</div></div><div class="rounded-xl border border-indigo-100 bg-indigo-50 p-3"><div class="text-[11px] text-indigo-700">নীট</div><div id="kdp-net" class="text-xl font-extrabold text-indigo-700">৳ ০</div></div><div class="rounded-xl border border-slate-200 bg-slate-50 p-3"><div class="text-[11px] text-slate-600">এই মাসে লেনদেন</div><div id="kdp-count" class="text-xl font-extrabold text-slate-700">০</div></div></div>';
      host.appendChild(box);document.getElementById('ka-dash-refresh').onclick=refresh;
    }
    const m=month(),x=s();const inc=(x.studentPayments||[]).filter(a=>String(a.date||'').startsWith(m)).reduce((a,b)=>a+Number(b.paidAmount||0),0);const sal=(x.salaryPayments||[]).filter(a=>String(a.date||'').startsWith(m)).reduce((a,b)=>a+Number(b.paidAmount||0),0);const oth=(x.expenses||[]).filter(a=>String(a.date||'').startsWith(m)).reduce((a,b)=>a+Number(b.amount||0),0);const count=(x.studentPayments||[]).filter(a=>String(a.date||'').startsWith(m)).length+(x.salaryPayments||[]).filter(a=>String(a.date||'').startsWith(m)).length+(x.expenses||[]).filter(a=>String(a.date||'').startsWith(m)).length;
    ['kdp-inc','kdp-sal','kdp-oth','kdp-net','kdp-count'].forEach((id,i)=>{const e=document.getElementById(id);if(!e)return;e.textContent=i===0?money(inc):i===1?money(sal):i===2?money(oth):i===3?money(inc-sal-oth):count.toLocaleString('bn-BD')});
  }
  window.addEventListener('load',()=>setTimeout(refresh,500));window.addEventListener('koraner-auth-ready',()=>setTimeout(refresh,700));setInterval(refresh,12000);
})();
