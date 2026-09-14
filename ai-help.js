(function(){
  const C=window.KORANER_ALO_CONFIG||{};
  const U=(C.supabaseUrl||'').replace(/\/$/,'');
  const K=C.supabaseAnonKey||'';
  const FN=(U?U+'/functions/v1/quraner-alo-admin-ai-help':'');
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let admin=false, ready=false, history=[];

  async function getAdmin(){
    const token=window.KORANER_ACCESS_TOKEN;
    if(!token||!U||!K)return false;
    try{
      const ar=await fetch(U+'/auth/v1/user',{headers:{apikey:K,Authorization:'Bearer '+token}});
      if(!ar.ok)return false;
      const au=await ar.json();
      const mr=await fetch(U+'/rest/v1/app_members?select=id,email,role,status&id=eq.'+encodeURIComponent(au.id),{headers:{apikey:K,Authorization:'Bearer '+token}});
      if(!mr.ok)return false;
      const rows=await mr.json();
      return !!(rows[0]&&rows[0].role==='admin'&&rows[0].status==='active');
    }catch(e){return false}
  }

  function currentContext(){
    const active=(document.querySelector('.tab-btn.active')?.innerText||'').trim();
    const s=window.state||{};
    return {
      activeTab:active,
      url:location.href,
      title:document.title,
      counts:{students:(s.students||[]).length,studentPayments:(s.studentPayments||[]).length,staffs:(s.staffs||[]).length,salaryPayments:(s.salaryPayments||[]).length},
      siteSettings:s.siteSettings||{}
    };
  }

  function add(role,text){
    const box=document.getElementById('qaa-messages'); if(!box)return;
    const cls=role==='user'?'qaa-user':'qaa-ai';
    const div=document.createElement('div'); div.className='qaa-msg '+cls;
    div.innerHTML='<div class="qaa-bubble">'+esc(text).replace(/\n/g,'<br>')+'</div>';
    box.appendChild(div); box.scrollTop=box.scrollHeight;
  }

  function show(){
    if(document.getElementById('qaa-root'))return;
    const root=document.createElement('div'); root.id='qaa-root';
    root.innerHTML=`
      <button id="qaa-fab" aria-label="Quraner Alo AI সহায়তা"><span>✦</span> AI সহায়তা</button>
      <section id="qaa-panel" aria-label="Quraner Alo AI সহায়তা">
        <header class="qaa-head"><div><strong>Quraner Alo AI সহায়তা</strong><small>শুধু Super Admin-এর জন্য</small></div><button id="qaa-close">×</button></header>
        <div id="qaa-messages" class="qaa-messages"><div class="qaa-msg qaa-ai"><div class="qaa-bubble">আসসালামু আলাইকুম। আপনার সিস্টেমে যে সমস্যাটি দেখছেন, সেটি বাংলায় লিখুন। আমি এই পেজের বর্তমান অংশ ও সিস্টেমের কাঠামো বিবেচনা করে সমাধানের ধাপ দেব।</div></div></div>
        <form id="qaa-form" class="qaa-form"><textarea id="qaa-input" rows="2" placeholder="যেমন: ভাউচারে পুরোনো লোগো কেন আসছে?"></textarea><button id="qaa-send" type="submit">পাঠান</button></form>
      </section>`;
    document.body.appendChild(root);
    const st=document.createElement('style'); st.textContent=`
      #qaa-root{font-family:'Hind Siliguri',sans-serif;position:fixed;right:18px;bottom:18px;z-index:2147483000}
      #qaa-fab{border:0;border-radius:999px;background:#0f766e;color:#fff;padding:12px 16px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.22);cursor:pointer}
      #qaa-fab span{margin-right:6px}
      #qaa-panel{display:none;width:min(390px,calc(100vw - 28px));height:min(600px,calc(100vh - 90px));background:#fff;border:1px solid #dbe3ea;border-radius:18px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,.24)}
      .qaa-head{background:#0f766e;color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between}.qaa-head strong{display:block;font-size:15px}.qaa-head small{opacity:.82;font-size:11px}.qaa-head button{border:0;background:transparent;color:#fff;font-size:24px;cursor:pointer}
      .qaa-messages{height:calc(100% - 126px);overflow:auto;padding:14px;background:#f7faf9}.qaa-msg{display:flex;margin:0 0 10px}.qaa-user{justify-content:flex-end}.qaa-bubble{max-width:86%;padding:10px 12px;border-radius:14px;background:#fff;border:1px solid #e2e8f0;color:#172033;font-size:13px;line-height:1.5}.qaa-user .qaa-bubble{background:#0f766e;color:#fff;border-color:#0f766e}
      .qaa-form{padding:10px;border-top:1px solid #e5e7eb;background:#fff;display:flex;gap:8px}.qaa-form textarea{flex:1;resize:none;border:1px solid #cbd5e1;border-radius:12px;padding:9px;font:inherit;font-size:13px;outline:none}.qaa-form textarea:focus{border-color:#0f766e;box-shadow:0 0 0 3px rgba(15,118,110,.12)}.qaa-form button{border:0;background:#0f766e;color:#fff;border-radius:12px;padding:0 15px;font-weight:700;cursor:pointer}.qaa-form button:disabled{opacity:.55;cursor:wait}
      @media(max-width:480px){#qaa-root{right:10px;bottom:10px}#qaa-fab{padding:11px 13px}.qaa-messages{padding:10px}}
    `; document.head.appendChild(st);
    document.getElementById('qaa-fab').onclick=()=>{document.getElementById('qaa-fab').style.display='none';document.getElementById('qaa-panel').style.display='flex';document.getElementById('qaa-panel').style.flexDirection='column'};
    document.getElementById('qaa-close').onclick=()=>{document.getElementById('qaa-panel').style.display='none';document.getElementById('qaa-fab').style.display='block'};
    document.getElementById('qaa-form').onsubmit=send;
  }

  async function send(e){
    e.preventDefault();
    const input=document.getElementById('qaa-input'), btn=document.getElementById('qaa-send');
    const text=(input.value||'').trim(); if(!text||btn.disabled)return;
    add('user',text); history.push({role:'user',content:text}); input.value=''; btn.disabled=true;
    add('ai','সমাধান প্রস্তুত করছি…');
    const pending=[...document.querySelectorAll('#qaa-messages .qaa-msg')].pop();
    try{
      const token=window.KORANER_ACCESS_TOKEN; const r=await fetch(FN,{method:'POST',headers:{apikey:K,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({message:text,history:history.slice(-10),context:currentContext()})});
      const j=await r.json();
      pending?.remove();
      const answer=j.answer||'এই মুহূর্তে উত্তর পাওয়া যায়নি।'; add('ai',answer); history.push({role:'assistant',content:answer});
    }catch(err){
      pending?.remove(); add('ai','AI সেবায় সংযোগ হয়নি। Edge Function/API key সেট করা আছে কি না দেখুন।');
    }finally{btn.disabled=false;input.focus()}
  }

  async function boot(){
    admin=await getAdmin();
    if(!admin)return;
    show(); ready=true;
  }

  window.addEventListener('koraner-auth-ready',()=>setTimeout(boot,250));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500),{once:true}); else setTimeout(boot,500);
})();
