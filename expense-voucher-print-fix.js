(function(){
  'use strict';
  if(window.__KA_EXPENSE_VOUCHER_PRINT_FIX__)return;
  window.__KA_EXPENSE_VOUCHER_PRINT_FIX__=true;
  const money=n=>'৳ '+Number(n||0).toLocaleString('bn-BD',{minimumFractionDigits:0,maximumFractionDigits:2});
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  function printExpense(id){
    const s=Object.assign({institutionName:'কোরআনের আলো',subtitle:'অনলাইন কুরআন শিক্ষা কেন্দ্র',phone:'',email:'',address:'',logoUrl:''},window.state?.siteSettings||{});
    const e=(window.state?.expenses||[]).find(x=>x.id===id); if(!e)return;
    const logo=s.logoUrl||window.KA_DEFAULT_LOGO||'';
    const contact=[
      s.address?`<div class="contact-line">${esc(s.address)}</div>`:'',
      s.email?`<div class="contact-line">${esc(s.email)}</div>`:'',
      s.phone?`<div class="contact-line">${esc(s.phone)}</div>`:''
    ].join('');
    const html=`<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>${esc(e.expenseNo)}</title><style>
      @page{size:A4;margin:15mm}
      body{font-family:Arial,"Noto Sans Bengali",sans-serif;color:#172033;margin:0;background:#fff}
      .wrap{max-width:760px;margin:auto}
      .head{display:flex;align-items:flex-start;gap:18px;border-bottom:2px solid #c9a33b;padding-bottom:14px}
      .logo{width:90px;height:90px;object-fit:contain}
      .brand{flex:1;min-width:0}.brand h1{margin:0;font-size:25px;line-height:1.15}.brand p{margin:4px 0;color:#555;font-size:13px}
      .contact{margin-top:5px;font-size:13px;color:#555;line-height:1.4}.contact-line{display:block;margin:0 0 1px}
      .meta{width:180px;flex:0 0 180px;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:2px;padding-top:1px}
      .authority-pill{display:inline-block;background:#d1fae5;color:#065f46;font-weight:800;font-size:12px;border-radius:999px;padding:6px 12px;white-space:nowrap;margin-bottom:3px}
      .voucher-ref,.date-ref{font-size:13px;line-height:1.35;color:#475569;white-space:nowrap}
      .voucher-ref strong{color:#0f172a;font-weight:900}
      .title{font-size:22px;font-weight:700;text-align:center;margin:24px 0 14px}
      .table{width:100%;border-collapse:collapse}.table th,.table td{border:1px solid #ddd;padding:10px}.table th{background:#f6f1df;text-align:left;width:35%}
      .amount{font-size:24px;font-weight:700;text-align:right;margin-top:18px}.sign{display:flex;justify-content:space-between;margin-top:85px}.sign div{width:30%;text-align:center;border-top:1px solid #777;padding-top:6px;font-size:12px}
      @media(max-width:650px){.head{gap:12px;flex-wrap:wrap}.logo{width:70px;height:70px}.brand{flex:1 1 calc(100% - 82px)}.brand h1{font-size:21px}.contact{font-size:12px}.meta{width:100%;flex:1 1 100%;align-items:flex-end;padding-top:0}.authority-pill{font-size:11px}.voucher-ref,.date-ref{font-size:12px}}
    </style></head><body><div class="wrap"><div class="head">${logo?`<img class="logo" src="${logo}" alt="Logo">`:''}<div class="brand"><h1>${esc(s.institutionName)}</h1><p>${esc(s.subtitle)}</p><div class="contact">${contact}</div></div><div class="meta"><div class="authority-pill">অফিসিয়াল কর্তৃপক্ষ</div><div class="voucher-ref">ভাউচার নং: <strong>#${esc(e.expenseNo)}</strong></div><div class="date-ref">তারিখ: ${esc(e.date)}</div></div></div><div class="title">অন্যান্য ব্যয়ের ভাউচার / EXPENSE INVOICE</div><table class="table" style="margin-top:16px"><tr><th>খরচের শিরোনাম</th><td>${esc(e.title)}</td></tr><tr><th>খরচের ধরন</th><td>${esc(e.category)}</td></tr><tr><th>যাকে/যেখানে প্রদান</th><td>${esc(e.payee||'—')}</td></tr><tr><th>পেমেন্ট মাধ্যম</th><td>${esc(e.method||'—')}</td></tr><tr><th>রেফারেন্স/বিল নং</th><td>${esc(e.reference||'—')}</td></tr><tr><th>বিস্তারিত</th><td>${esc(e.note||'—')}</td></tr></table><div class="amount">মোট খরচ: ${money(e.amount)}</div><div class="sign"><div>প্রদানকারী / গ্রহণকারী</div><div>হিসাব রক্ষক</div><div>পরিচালক / কর্তৃপক্ষ</div></div></div><script>window.onload=()=>setTimeout(()=>window.print(),250);</script></body></html>`;
    const w=window.open('','_blank','width=900,height=1000');
    if(!w){alert('পপ-আপ ব্লক হয়েছে। ব্রাউজারে pop-up অনুমতি দিন।');return;}
    w.document.open();w.document.write(html);w.document.close();
  }
  function bind(){
    const list=document.getElementById('ka-expense-list'); if(!list||list.dataset.kaPrintFix==='1')return;
    list.addEventListener('click',function(ev){
      const b=ev.target.closest('[data-print]'); if(!b)return;
      ev.preventDefault();ev.stopImmediatePropagation();
      printExpense(b.dataset.print);
    },true);
    list.dataset.kaPrintFix='1';
  }
  const boot=()=>{bind();setTimeout(bind,300);setTimeout(bind,800)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,120);
  new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
})();
