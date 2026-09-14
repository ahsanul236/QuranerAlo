(function(){
  const C = window.KORANER_ALO_CONFIG || {};
  const U = (C.supabaseUrl || '').replace(/\/$/, '');
  const K = C.supabaseAnonKey || '';
  const WORKSPACE = C.workspaceId || 'koraner-alo';
  const SETTINGS_DEFAULT = {
    institutionName: 'কোরআনের আলো', subtitle: 'অনলাইন কুরআন শিক্ষা কেন্দ্র',
    tagline: 'স্টুডেন্ট ফি, টিচার স্যালারি ও ক্যাশ ফ্লো পোর্টাল',
    phone: '+৮৮০ ১৭০০-০০০০০০', email: 'info@koraneralo.com', address: 'বাংলাদেশ', logoUrl: ''
  };

  function token(){ return window.KORANER_ACCESS_TOKEN || K; }
  function headers(extra){ return Object.assign({apikey:K, Authorization:'Bearer '+token(), 'Content-Type':'application/json'}, extra||{}); }
  async function rest(path, options){
    if(!U || !K) throw new Error('Supabase configuration missing');
    const r=await fetch(U+'/rest/v1/'+path,Object.assign({},options||{},{headers:headers(options&&options.headers)}));
    const text=await r.text(); if(!r.ok) throw new Error('Supabase '+r.status+': '+text); return text?JSON.parse(text):null;
  }
  async function authUser(){
    if(!window.KORANER_ACCESS_TOKEN) return null;
    const r=await fetch(U+'/auth/v1/user',{headers:{apikey:K,Authorization:'Bearer '+token()}});
    if(!r.ok) return null; return await r.json();
  }
  function normalizeState(s){ return Object.assign({siteSettings:Object.assign({},SETTINGS_DEFAULT),students:[],studentPayments:[],staffs:[],salaryPayments:[]},s||{}); }
  function badge(text,online){
    const el=document.getElementById('sync-status-text'),b=document.getElementById('cloud-sync-badge');
    if(el)el.innerText=text;
    if(b)b.className='flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl '+(online?'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400':'bg-amber-500/10 border border-amber-500/30 text-amber-300');
  }
  function overlay(title,msg){
    let o=document.getElementById('ka-access-overlay'); if(o)o.remove();
    o=document.createElement('div'); o.id='ka-access-overlay'; o.className='fixed inset-0 z-[999999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4';
    o.innerHTML='<div class="glass-panel max-w-lg w-full p-8 rounded-3xl text-center border border-amber-500/30"><div class="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center"><i class="fa-solid fa-user-shield text-amber-400 text-3xl"></i></div><h2 class="text-2xl font-bold mt-4 text-white">'+title+'</h2><p class="text-slate-400 text-sm mt-2">'+msg+'</p><button id="ka-access-logout" class="mt-6 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl">লগআউট</button></div>';
    document.body.appendChild(o); document.getElementById('ka-access-logout').onclick=function(){if(window.kaLogout)window.kaLogout();};
  }
  function removeOverlay(){document.getElementById('ka-access-overlay')?.remove();}

  async function ensureMembership(){
    const u=await authUser(); if(!u) return null;
    const rows=await rest('app_members?id=eq.'+encodeURIComponent(u.id)+'&select=id,email,role,status,created_at,updated_at');
    if(rows&&rows.length){ window.KA_MEMBER=rows[0]; return rows[0]; }
    const created=await rest('app_members',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({id:u.id,email:u.email||'',role:'user',status:'pending'})});
    window.KA_MEMBER=(created&&created[0])||{id:u.id,email:u.email,role:'user',status:'pending'}; return window.KA_MEMBER;
  }
  function active(){return window.KA_MEMBER&&window.KA_MEMBER.status==='active';}
  function admin(){return active()&&window.KA_MEMBER.role==='admin';}

  async function loadCloud(){
    if(!window.KORANER_ACCESS_TOKEN){badge('লগইন প্রয়োজন',false);return;}
    try{
      const m=await ensureMembership();
      if(!m){overlay('অ্যাকাউন্ট যাচাই করা যায়নি','দয়া করে আবার লগইন করুন।');return;}
      if(m.status==='pending'){badge('অ্যাডমিন অনুমোদন প্রয়োজন',false);overlay('অনুমোদনের অপেক্ষায়','আপনার অ্যাকাউন্ট তৈরি হয়েছে, কিন্তু সিস্টেমে প্রবেশের আগে প্রশাসকের অনুমোদন প্রয়োজন।');return;}
      if(m.status!=='active'){badge('অ্যাক্সেস বন্ধ',false);overlay('অ্যাক্সেস বন্ধ করা হয়েছে','এই অ্যাকাউন্টের সিস্টেম অ্যাক্সেস বর্তমানে বন্ধ রয়েছে।');return;}
      removeOverlay(); badge('ক্লাউড ডাটা লোড হচ্ছে…',true);
      const rows=await rest('app_state?id=eq.'+encodeURIComponent(WORKSPACE)+'&select=id,state,updated_at');
      if(rows&&rows.length){window.state=normalizeState(rows[0].state||{});try{localStorage.setItem('koraner_alo_db_v2',JSON.stringify(window.state));}catch(e){}
        if(window.applySiteSettings)window.applySiteSettings(); if(window.refreshUIViews)window.refreshUIViews();
      }else await saveCloud();
      badge('লাইভ ক্লাউড সিঙ্ক সক্রিয়',true); if(admin())addAdminUI();
    }catch(e){console.error(e);badge('ক্লাউড সংযোগ ব্যর্থ',false);}
  }
  async function saveCloud(){
    if(!active())return false;
    const payload={id:WORKSPACE,state:normalizeState(window.state),updated_at:new Date().toISOString()};
    await rest('app_state?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(payload)});
    badge('লাইভ ক্লাউড সিঙ্ক সক্রিয়',true); return true;
  }
  window.initCloudFirebase=loadCloud;
  window.pushStateToCloud=async function(){try{if(!active())return;badge('ক্লাউডে সেভ হচ্ছে…',true);await saveCloud();}catch(e){console.error(e);badge('Cloud Save ব্যর্থ • লোকাল সেভ আছে',false);}};

  function applyBrand(){
    const s=Object.assign({},SETTINGS_DEFAULT,window.state&&window.state.siteSettings||{});
    document.querySelectorAll('[data-brand-name]').forEach(e=>e.textContent=s.institutionName);
    document.querySelectorAll('[data-brand-subtitle]').forEach(e=>e.textContent=s.subtitle);
    document.querySelectorAll('[data-brand-tagline]').forEach(e=>e.textContent=s.tagline);
    document.querySelectorAll('[data-brand-phone]').forEach(e=>e.textContent=s.phone);
    document.querySelectorAll('[data-brand-email]').forEach(e=>e.textContent=s.email);
    document.querySelectorAll('[data-brand-address]').forEach(e=>e.textContent=s.address);
    document.querySelectorAll('[data-brand-logo]').forEach(e=>{if(s.logoUrl){e.src=s.logoUrl;e.classList.remove('hidden')}else e.classList.add('hidden');});
  }

  function addSettingsUI(){
    if(!admin()||document.getElementById('ka-settings-view'))return;
    const nav=document.querySelector('header .max-w-7xl.mx-auto.flex.gap-2.text-sm'),main=document.querySelector('main'); if(!nav||!main)return;
    const btn=document.createElement('button'); btn.id='tab-site-settings'; btn.className='tab-btn py-2.5 px-3 font-medium flex items-center gap-2 rounded-t-lg transition text-slate-300 whitespace-nowrap'; btn.innerHTML='<i class="fa-solid fa-gear text-amber-400"></i> প্রতিষ্ঠান সেটিংস'; btn.onclick=showSettings; nav.appendChild(btn);
    const sec=document.createElement('section'); sec.id='ka-settings-view'; sec.className='space-y-6 hidden';
    sec.innerHTML='<div class="glass-panel p-6 rounded-2xl space-y-5"><div><h2 class="text-xl font-bold gold-gradient-text">প্রতিষ্ঠান সেটিংস</h2><p class="text-xs text-slate-400 mt-1">শুধু Super Admin এই সেটিংস পরিবর্তন করতে পারবেন।</p></div><form id="ka-settings-form" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"><label class="space-y-1"><span>প্রতিষ্ঠানের নাম</span><input id="ka-set-name" class="glass-input w-full p-2.5 rounded-xl"></label><label class="space-y-1"><span>সাবটাইটেল</span><input id="ka-set-subtitle" class="glass-input w-full p-2.5 rounded-xl"></label><label class="space-y-1 md:col-span-2"><span>ট্যাগলাইন</span><input id="ka-set-tagline" class="glass-input w-full p-2.5 rounded-xl"></label><label class="space-y-1"><span>ফোন</span><input id="ka-set-phone" class="glass-input w-full p-2.5 rounded-xl"></label><label class="space-y-1"><span>ইমেইল</span><input id="ka-set-email" type="email" class="glass-input w-full p-2.5 rounded-xl"></label><label class="space-y-1 md:col-span-2"><span>ঠিকানা</span><input id="ka-set-address" class="glass-input w-full p-2.5 rounded-xl"></label><label class="space-y-1 md:col-span-2"><span>লোগো URL</span><input id="ka-set-logo" class="glass-input w-full p-2.5 rounded-xl" placeholder="https://..."></label><div class="md:col-span-2 flex gap-2 items-center"><button class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-5 py-2.5 rounded-xl">সেটিংস সেভ করুন</button><button type="button" id="ka-logout" class="bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl">লগআউট</button><span id="ka-set-msg" class="text-emerald-300"></span></div></form></div>';
    main.appendChild(sec);
    document.getElementById('ka-settings-form').onsubmit=async function(e){e.preventDefault();window.state=normalizeState(window.state);window.state.siteSettings={institutionName:document.getElementById('ka-set-name').value.trim(),subtitle:document.getElementById('ka-set-subtitle').value.trim(),tagline:document.getElementById('ka-set-tagline').value.trim(),phone:document.getElementById('ka-set-phone').value.trim(),email:document.getElementById('ka-set-email').value.trim(),address:document.getElementById('ka-set-address').value.trim(),logoUrl:document.getElementById('ka-set-logo').value.trim()};if(window.saveLocalOnly)window.saveLocalOnly();try{await saveCloud();document.getElementById('ka-set-msg').innerText='সেটিংস সফলভাবে সেভ হয়েছে।';applyBrand();}catch(err){document.getElementById('ka-set-msg').innerText='সেভ ব্যর্থ: '+err.message;}};
    document.getElementById('ka-logout').onclick=function(){if(window.kaLogout)window.kaLogout();};
  }
  function fillSettings(){const s=Object.assign({},SETTINGS_DEFAULT,window.state&&window.state.siteSettings||{});const map={name:s.institutionName,subtitle:s.subtitle,tagline:s.tagline,phone:s.phone,email:s.email,address:s.address,logo:s.logoUrl};Object.keys(map).forEach(k=>{const e=document.getElementById('ka-set-'+k);if(e)e.value=map[k]||''});}
  window.showSettings=function(){['dashboard','students','payments','staffs','monthly-sheet','invoice','sheets-guide'].forEach(t=>{document.getElementById('view-'+t)?.classList.add('hidden');document.getElementById('tab-'+t)?.classList.remove('active');});document.getElementById('ka-settings-view')?.classList.remove('hidden');document.getElementById('tab-site-settings')?.classList.add('active');fillSettings();};

  function addAdminUI(){
    if(!admin()||document.getElementById('ka-admin-view')){addSettingsUI();return;}
    addSettingsUI();
    const nav=document.querySelector('header .max-w-7xl.mx-auto.flex.gap-2.text-sm'),main=document.querySelector('main'); if(!nav||!main)return;
    const btn=document.createElement('button');btn.id='tab-user-admin';btn.className='tab-btn py-2.5 px-3 font-medium flex items-center gap-2 rounded-t-lg transition text-slate-300 whitespace-nowrap';btn.innerHTML='<i class="fa-solid fa-user-shield text-rose-400"></i> ব্যবহারকারী নিয়ন্ত্রণ';btn.onclick=showAdmin;nav.appendChild(btn);
    const sec=document.createElement('section');sec.id='ka-admin-view';sec.className='space-y-6 hidden';
    sec.innerHTML='<div class="glass-panel p-6 rounded-2xl space-y-5"><div><h2 class="text-xl font-bold gold-gradient-text">ব্যবহারকারী নিয়ন্ত্রণ</h2><p class="text-xs text-slate-400 mt-1">এখান থেকে নতুন ব্যবহারকারী অনুমোদন, অ্যাক্সেস বন্ধ বা অ্যাক্সেস সরানো যাবে। আপনার Super Admin অ্যাকাউন্ট সুরক্ষিত থাকবে।</p></div><div id="ka-member-list" class="space-y-3"></div></div>';
    main.appendChild(sec);loadMembers();
  }
  async function loadMembers(){
    const box=document.getElementById('ka-member-list');if(!box||!admin())return;box.innerHTML='<div class="text-slate-400 text-sm">ব্যবহারকারী তালিকা লোড হচ্ছে…</div>';
    try{const rows=await rest('app_members?select=id,email,role,status,created_at,updated_at&order=created_at.desc');
      if(!rows.length){box.innerHTML='<div class="text-slate-400">কোন ব্যবহারকারী নেই।</div>';return;}
      box.innerHTML=rows.map(m=>{const isSelf=m.id===window.KA_MEMBER.id;let actions='';if(!isSelf){if(m.status!=='active')actions+='<button data-act="approve" data-id="'+m.id+'" class="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs">অনুমোদন</button>';if(m.status==='active')actions+='<button data-act="revoke" data-id="'+m.id+'" class="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs">অ্যাক্সেস বন্ধ</button>';actions+='<button data-act="remove" data-id="'+m.id+'" class="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs">রিমুভ অ্যাক্সেস</button>';}return '<div class="border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><div class="font-semibold text-white">'+(m.email||'')+(isSelf?' <span class="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">আপনি • Super Admin</span>':'')+'</div><div class="text-xs text-slate-400 mt-1">Status: <span class="text-slate-200">'+m.status+'</span> • Role: <span class="text-slate-200">'+m.role+'</span></div></div><div class="flex flex-wrap gap-2">'+actions+'</div></div>';}).join('');
      box.querySelectorAll('button[data-act]').forEach(b=>b.onclick=()=>memberAction(b.dataset.act,b.dataset.id));
    }catch(e){box.innerHTML='<div class="text-rose-300 text-sm">ব্যবহারকারী তালিকা লোড হয়নি: '+e.message+'</div>';}
  }
  async function memberAction(act,id){
    if(!admin()||id===window.KA_MEMBER.id)return;
    try{
      if(act==='approve'||act==='revoke') await rest('app_members?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:act==='approve'?'active':'revoked',updated_at:new Date().toISOString()})});
      if(act==='remove') await rest('app_members?id=eq.'+encodeURIComponent(id),{method:'DELETE'});
      await loadMembers();
    }catch(e){alert('অ্যাকশন ব্যর্থ: '+e.message);}
  }
  function showAdmin(){
    ['dashboard','students','payments','staffs','monthly-sheet','invoice','sheets-guide'].forEach(t=>{document.getElementById('view-'+t)?.classList.add('hidden');document.getElementById('tab-'+t)?.classList.remove('active');});
    document.getElementById('ka-settings-view')?.classList.add('hidden');document.getElementById('tab-site-settings')?.classList.remove('active');document.getElementById('ka-admin-view')?.classList.remove('hidden');document.getElementById('tab-user-admin')?.classList.add('active');loadMembers();
  }

  function boot(){addSettingsUI();applyBrand();if(window.KORANER_ACCESS_TOKEN)loadCloud();}
  window.addEventListener('load',function(){setTimeout(boot,150);});
  window.addEventListener('koraner-auth-ready',function(){setTimeout(loadCloud,50);});
  if(document.readyState!=='loading')setTimeout(boot,50);
})();
