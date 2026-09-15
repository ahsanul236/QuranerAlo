(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const icon={students:'fa-solid fa-user-graduate text-cyan-500',payments:'fa-solid fa-hand-holding-dollar text-emerald-500',staffs:'fa-solid fa-user-tie text-amber-500'};
  let done=false;

  function nav(){return $('header .max-w-7xl.mx-auto.flex.gap-2.text-sm');}
  function newTab(id,label,ico,click){
    const b=document.createElement('button'); b.id=id;
    b.className='tab-btn py-2.5 px-3 font-medium flex items-center justify-center gap-2 rounded-xl transition';
    b.innerHTML='<i class="'+ico+'"></i><span>'+label+'</span>'; b.onclick=click; return b;
  }

  function rebuildSection(name,title,subtitle){
    const old=document.getElementById('view-'+name);
    if(!old||old.dataset.kaRebuilt==='1')return;
    const wasVisible=!old.classList.contains('hidden');
    const sec=document.createElement('section'); sec.id='view-'+name; sec.className=old.className+' ka-new-section';
    sec.innerHTML='<div class="ka-section-head"><div><h2>'+title+'</h2><p>'+subtitle+'</p></div></div>';
    const head=sec.firstElementChild; void head;
    while(old.firstChild)sec.appendChild(old.firstChild);
    if(!wasVisible)sec.classList.add('hidden');
    sec.dataset.kaRebuilt='1'; old.replaceWith(sec);
  }

  function rebuildCoreTabs(){
    const n=nav(); if(!n||n.dataset.kaCoreTabs==='1')return;
    ['tab-students','tab-payments','tab-staffs','tab-monthly-sheet','tab-sheets-guide'].forEach(id=>document.getElementById(id)?.remove());
    const anchor=document.getElementById('tab-dashboard'); if(!anchor)return;
    const b1=newTab('tab-students','স্টুডেন্ট লিস্ট',icon.students,()=>window.switchTab?.('students'));
    const b2=newTab('tab-payments','স্টুডেন্ট ফি জমা',icon.payments,()=>window.switchTab?.('payments'));
    const b3=newTab('tab-staffs','শিক্ষক ও স্টাফ স্যালারি',icon.staffs,()=>window.switchTab?.('staffs'));
    anchor.after(b1,b2,b3);
    n.dataset.kaCoreTabs='1';
  }

  function mergeReports(){
    if(document.getElementById('view-report-merged'))return true;
    const monthly=document.getElementById('view-monthly-sheet');
    const pro=document.getElementById('ka-pro-view');
    if(!monthly||!pro)return false;
    const sec=document.createElement('section'); sec.id='view-report-merged'; sec.className='hidden space-y-6 ka-merged-report-shell';
    sec.innerHTML='<div class="ka-section-head"><div><h2>রিপোর্ট ও অ্যানালিটিক্স</h2><p>মাসিক আয়-ব্যয়, ক্যাশ বুক, বেতন, অন্যান্য ব্যয় ও নিট ব্যালেন্স—সব হিসাব এক জায়গায়</p></div></div>';
    sec.appendChild(pro);
    while(monthly.firstChild)sec.appendChild(monthly.firstChild);
    monthly.remove();
    document.querySelector('main')?.appendChild(sec);
    return true;
  }

  function reportTab(){
    const n=nav(); if(!n||document.getElementById('tab-pro-reports'))return;
    const old=document.getElementById('tab-monthly-sheet'); old?.remove();
    const staff=document.getElementById('tab-staffs'); if(!staff)return;
    const b=newTab('tab-pro-reports','রিপোর্ট ও অ্যানালিটিক্স','fa-solid fa-chart-line text-indigo-500',showMerged);
    staff.after(b);
  }

  function showMerged(){
    ['dashboard','students','payments','staffs','invoice','sheets-guide'].forEach(t=>{
      document.getElementById('view-'+t)?.classList.add('hidden');
      document.getElementById('tab-'+t)?.classList.remove('active');
    });
    ['ka-settings-view','ka-admin-view','ka-expenses-view','ka-audit-view'].forEach(id=>$('#'+id)?.classList.add('hidden'));
    ['tab-site-settings','tab-user-admin','tab-other-expenses','tab-audit-logs'].forEach(id=>$('#'+id)?.classList.remove('active'));
    const v=document.getElementById('view-report-merged'); if(v)v.classList.remove('hidden');
    const p=document.getElementById('ka-pro-view'); if(p)p.classList.remove('hidden');
    document.getElementById('tab-pro-reports')?.classList.add('active');
    const m=document.getElementById('ka-pro-report-month'); if(m)m.dispatchEvent(new Event('change',{bubbles:true}));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function hideSheets(){
    document.getElementById('tab-sheets-guide')?.remove();
    document.getElementById('view-sheets-guide')?.classList.add('hidden');
  }

  function css(){
    if(document.getElementById('ka-structure-style'))return;
    const s=document.createElement('style'); s.id='ka-structure-style'; s.textContent=`
      .ka-new-section{width:100%}.ka-section-head{background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:18px;margin-bottom:10px;box-shadow:0 6px 20px rgba(15,23,42,.05)}
      .ka-section-head h2{margin:0;color:#0f172a;font-size:22px;font-weight:800}.ka-section-head p{margin:5px 0 0;color:#64748b;font-size:12px}
      #view-report-merged{width:100%}#view-report-merged #ka-pro-view{width:100%}#view-report-merged #ka-pro-view.hidden{display:block!important}
      header .tab-btn{min-height:44px}
      @media(max-width:640px){.ka-section-head{padding:14px}.ka-section-head h2{font-size:19px}}
    `;document.head.appendChild(s);
  }

  function run(){
    if(done)return;
    css();
    if(!nav()||!document.getElementById('tab-dashboard'))return;
    rebuildSection('students','স্টুডেন্ট লিস্ট','স্টুডেন্ট নিবন্ধন, তথ্য সম্পাদনা, বকেয়া ও তালিকা ব্যবস্থাপনা');
    rebuildSection('payments','স্টুডেন্ট ফি জমা','ফি সংগ্রহ, মাসভিত্তিক পেমেন্ট, বকেয়া ও ইনভয়েস ব্যবস্থাপনা');
    rebuildSection('staffs','শিক্ষক ও স্টাফ স্যালারি','শিক্ষক/স্টাফ তথ্য, বেতন প্রদান, বেতন ইতিহাস ও ভাউচার');
    rebuildCoreTabs();
    if(!mergeReports())return;
    reportTab();
    hideSheets();
    done=true;
  }

  const timer=setInterval(()=>{run();if(done)clearInterval(timer)},500);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else setTimeout(run,400);
  window.KA_SHOW_MERGED_REPORT=showMerged;
})();
