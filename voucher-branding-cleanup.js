(function(){
  'use strict';
  if(window.__KA_VOUCHER_BRANDING_CLEANUP__)return;
  window.__KA_VOUCHER_BRANDING_CLEANUP__=true;

  const norm=v=>String(v??'').replace(/\s+/g,' ').trim();
  const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>10&&r.height>10&&s.display!=='none'&&s.visibility!=='hidden'};

  function cleanHomeLogo(){
    const header=document.querySelector('header');
    if(!header)return;
    const img=header.querySelector('img.ka-final-logo');
    if(!img)return;
    img.style.setProperty('background','transparent','important');
    img.style.setProperty('border','0','important');
    img.style.setProperty('border-radius','0','important');
    img.style.setProperty('box-shadow','none','important');
    img.style.setProperty('padding','0','important');
    img.style.setProperty('width','68px','important');
    img.style.setProperty('height','68px','important');
    img.style.setProperty('object-fit','contain','important');

    let p=img.parentElement;
    for(let i=0;i<3&&p&&p!==header;i++,p=p.parentElement){
      const txt=(p.className||'').toString();
      if(p.children.length<=1 || /rounded-xl|bg-gradient|border|shadow-lg|p-1/.test(txt)){
        p.style.setProperty('background','transparent','important');
        p.style.setProperty('border','0','important');
        p.style.setProperty('border-radius','0','important');
        p.style.setProperty('box-shadow','none','important');
        p.style.setProperty('padding','0','important');
        p.style.setProperty('overflow','visible','important');
        if(i===0){p.style.setProperty('width','68px','important');p.style.setProperty('height','68px','important');}
      }
    }
  }

  function stackStudentTeacherContacts(){
    const area=document.getElementById('printable-area');
    if(!area)return;
    const s=Object.assign({address:'',email:'',phone:''},window.state&&window.state.siteSettings||{});
    const address=norm(s.address), email=norm(s.email), phone=norm(s.phone);
    if(!email&&!phone)return;
    const candidates=[...area.querySelectorAll('p,div,span')].filter(visible);
    const target=candidates.find(el=>{
      if(el.children.length>0)return false;
      const t=norm(el.textContent);
      return t && (email&&t.includes(email)) && (phone&&t.includes(phone));
    });
    if(!target || target.dataset.kaContactStacked==='1')return;
    const raw=norm(target.textContent);
    let addr=address;
    if(!addr){
      const parts=raw.split(/\s*[•|·]\s*/);
      addr=parts[0]||'';
    }
    const lines=[addr,email,phone].filter(Boolean);
    if(lines.length<2)return;
    target.dataset.kaContactStacked='1';
    target.innerHTML=lines.map((x,i)=>'<span class="ka-contact-line-'+i+'">'+x.replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))+'</span>').join('<br>');
    target.style.setProperty('line-height','1.35','important');
    target.style.setProperty('margin','0','important');
  }

  function normalizeExpenseNumbers(){
    const st=window.state;
    if(!st||!Array.isArray(st.expenses))return false;
    const used=new Set();
    st.expenses.forEach(x=>{const v=String(x?.expenseNo||'').trim();if(/^EXP-\d{4,}$/.test(v))used.add(v);});
    let n=3001,changed=false;
    const next=()=>{while(used.has('EXP-'+n))n++;const v='EXP-'+n;used.add(v);n++;return v;};
    st.expenses.forEach(x=>{
      if(!/^EXP-\d{4,}$/.test(String(x?.expenseNo||'').trim())){x.expenseNo=next();changed=true;}
    });
    if(changed){
      try{localStorage.setItem('koraner_alo_db_v2',JSON.stringify(st));}catch(e){}
    }
    return changed;
  }

  function patchCloudSave(){
    if(window.__KA_EXPENSE_PUSH_PATCHED)return;
    if(typeof window.pushStateToCloud==='function'){
      const orig=window.pushStateToCloud;
      window.pushStateToCloud=function(){normalizeExpenseNumbers();return orig.apply(this,arguments);};
      window.__KA_EXPENSE_PUSH_PATCHED=true;
    }
  }

  function run(){
    cleanHomeLogo();
    stackStudentTeacherContacts();
    patchCloudSave();
    normalizeExpenseNumbers();
  }

  function boot(){run();setTimeout(run,250);setTimeout(run,700);setTimeout(run,1400);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,120);
  window.addEventListener('load',()=>setTimeout(run,180));
  window.addEventListener('koraner-auth-ready',()=>setTimeout(run,300));
  if(window.MutationObserver)new MutationObserver(()=>requestAnimationFrame(run)).observe(document.body,{childList:true,subtree:true});
})();
