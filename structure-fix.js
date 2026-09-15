(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const core=['dashboard','students','payments','staffs'];
  const icon={students:'fa-solid fa-user-graduate text-cyan-500',payments:'fa-solid fa-hand-holding-dollar text-emerald-500',staffs:'fa-solid fa-user-tie text-amber-500'};

  function nav(){return $('header .max-w-7xl.mx-auto.flex.gap-2.text-sm');}

  function newTab(id,label,ico,click){
    const b=document.createElement('button');
    b.id=id;
    b.className='tab-btn py-2.5 px-3 font-medium flex items-center justify-center gap-2 rounded-xl transition text-slate-700';
    b.innerHTML='<i class="'+ico+'"></i><span>'+label+'</span>';
    b.onclick=click;
    return b;
  }

  function rebuildSection(name,title,subtitle){
    const old=document.getElementById('view-'+name);
    if(!old||old.dataset.kaRebuilt==='1')return;
    const wasVisible=!old.classList.contains('hidden');
    const sec=document.createElement('section');
    sec.id='view-'+name;
    sec.className=old.className;
    sec.classList.add('ka-new-section');
    sec.innerHTML='<div class="ka-section-head"><div><h2>'+title+'</h2><p>'+subtitle+'</p></div></div>';
    const head=sec.firstElementChild;
    while(old.firstChild) sec.appendChild(old.firstChild);
    if(!wasVisible)sec.classList.add('hidden');
    old.replaceWith(sec);
  }

  function rebuildCoreTabs(){
    const n=nav(); if(!n)return false;
    ['tab-students','tab-payments','tab-staffs','tab-monthly-sheet','tab-sheets-guide'].forEach(id=>document.getElementById(id)?.remove());
    const anchor=document.getElementById('tab-dashboard'); if(!anchor)return false;
    const b1=newTab('tab-students','স্টুডেন্ট লিস্ট',icon.students,()=>window.switchTab?.('students'));
    const b2=newTab('tab-payments','স্টুডেন্ট ফি জমা',icon.payments,()=>window.switchTab?.('payments'));
    const b3=newTab('tab-staffs','শিক্ষক ও স্টাফ স্যালারি',icon.staffs,()=>window.switchTab?.('staffs'));
    anchor.after(b1,b2,b3);
    b1.classList.remove('text-slate-700');b2.classList.remove('text-slate-700');b3.classList.remove('text-slate-700');
    const oldMonthly=document.getElementById('tab-monthly-sheet'); if(oldMonthly)oldMonthly.remove();
    const sheets=document.getElementById('tab-sheets-guide'); if(sheets)sheets.remove();
    return true;
  }

  function mergeReports(){
    if(document.getElementById('view-report-merged')) return true;
    const monthly=document.getElementById('view-monthly-sheet');
    const pro=document.getElementById('ka-pro-view');
    if(!monthly||!pro)return false;
    const sec=document.createElement('section');
    sec.id='view-report-merged';
    sec.className='hidden space-y-6 ka-merged-report-shell';
    sec.innerHTML='<div class="ka-section-head"><div><h2>রিপোর্ট ও অ্যানালিটিক্স</h2><p>মাসিক আয়-ব্যয়, ক্যাশ বুক, বেতন, অন্যান্য ব্যয় ও নিট ব্যালেন্স—সব হিসাব এক জায়গায়</p></div></div>';
    const head=sec.firstElementChild;
    while(pro.firstChild) sec.appendChild(pro.firstChild);
    while(monthly.firstChild) sec.appendChild(monthly.firstChild);
    pro.remove(); monthly.remove();
    document.querySelector('main')?.appendChild(sec);
    return true;
  }

  function reportTab(){
    const n=nav(); if(!n)return false;
    document.getElementById('tab-pro-reports')?.remove();
    const monthly=document.getElementById('tab-monthly-sheet'); monthly?.remove();
    const staff=document.getElementById('tab-staffs'); if(!staff)return false;
    const b=newTab('tab-pro-reports','রিপোর্ট ও অ্যানালিটিক্স','fa-solid fa-chart-line text-indigo-500',showMerged);
    staff.after(b);
    return true;
  }

  function showMerged(){
    ['dashboard','students','payments','staffs','invoice','sheets-guide'].forEach(t=>{
      document.getElementById('view-'+t)?.classList.add('hidden');
      document.getElementById('tab-'+t)?.classList.remove('active');
    });
    ['ka-settings-view','ka-admin-view','ka-expenses-view','ka-audit-view'].forEach(id=>$( '#'+id)?.classList.add('hidden'));
    ['tab-site-settings','tab-user-admin','tab-other-expenses','tab-audit-logs'].forEach(id=>$('#'+id)?.classList.remove('active'));
    const v=document.getElementById('view-report-merged'); if(v)v.classList.remove('hidden');
    const b=document.getElementById('tab-pro-reports'); if(b)b.classList.add('active');
    document.getElementById('ka-pro-view')?.classList.remove('hidden');
    window.reportView?.();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function hideSheets(){
    const b=document.getElementById('tab-sheets-guide'); if(b)b.remove();
    document.getElementById('view-sheets-guide')?.classList.add('hidden');
  }

  function css(){
    if(document.getElementById('ka-structure-style'))return;
    const s=document.createElement('style');s.id='ka-structure-style';s.textContent=`
      .ka-new-section{display:block!important}
      .ka-new-section.hidden{display:none!important}
      .ka-section-head{background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:18px;margin-bottom:2px;box-shadow:0 6px 20px rgba(15,23,42,.05)}
      .ka-section-head h2{margin:0;color:#0f172a;font-size:22px;font-weight:800}
      .ka-section-head p{margin:5px 0 0;color:#64748b;font-size:12px}
      #view-report-merged{width:100%}
      #view-report-merged>.ka-section-head{margin-bottom:14px}
      #view-report-merged #ka-pro-view{display:block!important}
      #view-report-merged #ka-pro-view.hidden{display:block!important}
      header .tab-btn{min-height:44px}
      @media(max-width:640px){.ka-section-head{padding:14px}.ka-section-head h2{font-size:19px}}
    `;document.head.appendChild(s);
  }

  function run(){
    css();
    rebuildCoreTabs();
    rebuildSection('students','স্টুডেন্ট লিস্ট','স্টুডেন্ট নিবন্ধন, তথ্য সম্পাদনা, বকেয়া ও তালিকা ব্যবস্থাপনা');
    rebuildSection('payments','স্টুডেন্ট ফি জমা','ফি সংগ্রহ, মাসভিত্তিক পেমেন্ট, বকেয়া ও ইনভয়েস ব্যবস্থাপনা');
    rebuildSection('staffs','শিক্ষক ও স্টাফ স্যালারি','শিক্ষক/স্টাফ তথ্য, বেতন প্রদান, বেতন ইতিহাস ও ভাউচার');
    mergeReports();
    reportTab();
    hideSheets();
    const iv=document.getElementById('view-report-merged');
    if(iv && !iv.classList.contains('hidden'))iv.classList.add('hidden');
  }

  let tries=0;
  const timer=setInterval(()=>{tries++;run();if(tries>30)clearInterval(timer)},700);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true}); else setTimeout(run,400);
  window.KA_SHOW_MERGED_REPORT=showMerged;
})();
