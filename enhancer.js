(function(){
  const C = window.KORANER_ALO_CONFIG || {};
  const U = (C.supabaseUrl || '').replace(/\/$/, '');
  const K = C.supabaseAnonKey || '';
  const WORKSPACE = C.workspaceId || 'koraner-alo';
  const SETTINGS_DEFAULT = {
    institutionName: 'কোরআনের আলো',
    subtitle: 'অনলাইন কুরআন শিক্ষা কেন্দ্র',
    tagline: 'স্টুডেন্ট ফি, টিচার স্যালারি ও ক্যাশ ফ্লো পোর্টাল',
    phone: '+৮৮০ ১৭০০-০০০০০০',
    email: 'info@koraneralo.com',
    address: 'বাংলাদেশ',
    logoUrl: ''
  };

  function token(){ return window.KORANER_ACCESS_TOKEN || K; }
  function headers(extra){
    return Object.assign({
      apikey: K,
      Authorization: 'Bearer ' + token(),
      'Content-Type': 'application/json'
    }, extra || {});
  }
  async function rest(path, options){
    if(!U || !K) throw new Error('Supabase configuration missing');
    const r = await fetch(U + '/rest/v1/' + path, Object.assign({}, options || {}, {headers: headers(options && options.headers)}));
    const text = await r.text();
    if(!r.ok) throw new Error('Supabase ' + r.status + ': ' + text);
    return text ? JSON.parse(text) : null;
  }
  function normalizeState(s){
    return Object.assign({siteSettings:Object.assign({}, SETTINGS_DEFAULT), students:[], studentPayments:[], staffs:[], salaryPayments:[]}, s || {});
  }
  function badge(text, online){
    const el=document.getElementById('sync-status-text'); const b=document.getElementById('cloud-sync-badge');
    if(el) el.innerText=text;
    if(b) b.className='flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl ' + (online ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/30 text-amber-300');
  }

  async function loadCloud(){
    if(!window.KORANER_ACCESS_TOKEN){ badge('লগইন প্রয়োজন', false); return; }
    try{
      badge('ক্লাউড ডাটা লোড হচ্ছে…', true);
      const rows=await rest('app_state?id=eq.'+encodeURIComponent(WORKSPACE)+'&select=id,state,updated_at');
      if(rows && rows.length){
        window.state=normalizeState(rows[0].state || {});
        try{ localStorage.setItem('koraner_alo_db_v2', JSON.stringify(window.state)); }catch(e){}
        if(window.applySiteSettings) window.applySiteSettings();
        if(window.refreshUIViews) window.refreshUIViews();
      } else {
        await saveCloud();
      }
      badge('লাইভ ক্লাউড সিঙ্ক সক্রিয়', true);
      window.__kaCloudUpdatedAt = Date.now();
    }catch(e){
      console.error(e); badge('ক্লাউড সংযোগ ব্যর্থ • লোকাল সেভ', false);
    }
  }
  async function saveCloud(){
    if(!window.KORANER_ACCESS_TOKEN) return false;
    const payload={id:WORKSPACE,state:normalizeState(window.state),updated_at:new Date().toISOString()};
    await rest('app_state?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(payload)});
    badge('লাইভ ক্লাউড সিঙ্ক সক্রিয়', true);
    return true;
  }

  // Override the original Firebase-named hooks with Supabase.
  window.initCloudFirebase = loadCloud;
  window.pushStateToCloud = async function(){
    try{ badge('ক্লাউডে সেভ হচ্ছে…', true); await saveCloud(); }
    catch(e){ console.error(e); badge('Cloud Save ব্যর্থ • লোকাল সেভ আছে', false); }
  };

  function applyBrand(){
    const s=Object.assign({}, SETTINGS_DEFAULT, window.state && window.state.siteSettings || {});
    document.querySelectorAll('[data-brand-name]').forEach(e=>e.textContent=s.institutionName);
    document.querySelectorAll('[data-brand-subtitle]').forEach(e=>e.textContent=s.subtitle);
    document.querySelectorAll('[data-brand-tagline]').forEach(e=>e.textContent=s.tagline);
    document.querySelectorAll('[data-brand-phone]').forEach(e=>e.textContent=s.phone);
    document.querySelectorAll('[data-brand-email]').forEach(e=>e.textContent=s.email);
    document.querySelectorAll('[data-brand-address]').forEach(e=>e.textContent=s.address);
    document.querySelectorAll('[data-brand-logo]').forEach(e=>{ if(s.logoUrl){e.src=s.logoUrl;e.classList.remove('hidden')}else{e.classList.add('hidden')} });
  }

  function addSettingsUI(){
    if(document.getElementById('ka-settings-view')) return;
    const nav=document.querySelector('header .max-w-7xl.mx-auto.flex.gap-2.text-sm');
    const main=document.querySelector('main');
    if(!nav || !main) return;
    const btn=document.createElement('button');
    btn.id='tab-site-settings'; btn.className='tab-btn py-2.5 px-3 font-medium flex items-center gap-2 rounded-t-lg transition text-slate-300 whitespace-nowrap';
    btn.innerHTML='<i class="fa-solid fa-gear text-amber-400"></i> প্রতিষ্ঠান সেটিংস';
    btn.onclick=showSettings;
    nav.appendChild(btn);

    const sec=document.createElement('section');
    sec.id='ka-settings-view'; sec.className='space-y-6 hidden';
    sec.innerHTML=`<div class="glass-panel p-6 rounded-2xl space-y-5">
      <div><h2 class="text-xl font-bold gold-gradient-text">প্রতিষ্ঠান সেটিংস</h2><p class="text-xs text-slate-400 mt-1">এখান থেকে প্রতিষ্ঠানটির নাম, ফোন, ইমেইল, ঠিকানা ও লোগো পরিবর্তন করুন। পরিবর্তন সব ব্যবহারকারীর জন্য ক্লাউডে সংরক্ষিত হবে।</p></div>
      <form id="ka-settings-form" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <label class="space-y-1"><span>প্রতিষ্ঠানের নাম</span><input id="ka-set-name" class="glass-input w-full p-2.5 rounded-xl"></label>
        <label class="space-y-1"><span>সাবটাইটেল</span><input id="ka-set-subtitle" class="glass-input w-full p-2.5 rounded-xl"></label>
        <label class="space-y-1 md:col-span-2"><span>ট্যাগলাইন</span><input id="ka-set-tagline" class="glass-input w-full p-2.5 rounded-xl"></label>
        <label class="space-y-1"><span>ফোন</span><input id="ka-set-phone" class="glass-input w-full p-2.5 rounded-xl"></label>
        <label class="space-y-1"><span>ইমেইল</span><input id="ka-set-email" type="email" class="glass-input w-full p-2.5 rounded-xl"></label>
        <label class="space-y-1 md:col-span-2"><span>ঠিকানা</span><input id="ka-set-address" class="glass-input w-full p-2.5 rounded-xl"></label>
        <label class="space-y-1 md:col-span-2"><span>লোগো URL (ঐচ্ছিক)</span><input id="ka-set-logo" class="glass-input w-full p-2.5 rounded-xl" placeholder="https://..."></label>
        <div class="md:col-span-2 flex gap-2 items-center"><button class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-5 py-2.5 rounded-xl">সেটিংস সেভ করুন</button><button type="button" id="ka-logout" class="bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl">লগআউট</button><span id="ka-set-msg" class="text-emerald-300"></span></div>
      </form>
    </div>`;
    main.appendChild(sec);
    document.getElementById('ka-settings-form').onsubmit=async function(e){
      e.preventDefault();
      window.state=normalizeState(window.state);
      window.state.siteSettings={
        institutionName:document.getElementById('ka-set-name').value.trim(),
        subtitle:document.getElementById('ka-set-subtitle').value.trim(),
        tagline:document.getElementById('ka-set-tagline').value.trim(),
        phone:document.getElementById('ka-set-phone').value.trim(),
        email:document.getElementById('ka-set-email').value.trim(),
        address:document.getElementById('ka-set-address').value.trim(),
        logoUrl:document.getElementById('ka-set-logo').value.trim()
      };
      if(window.saveLocalOnly) window.saveLocalOnly();
      try{ await saveCloud(); document.getElementById('ka-set-msg').innerText='সেটিংস সফলভাবে সেভ হয়েছে।'; applyBrand(); }
      catch(err){ document.getElementById('ka-set-msg').innerText='সেভ ব্যর্থ: '+err.message; }
    };
    document.getElementById('ka-logout').onclick=function(){ if(window.kaLogout) window.kaLogout(); else { localStorage.removeItem('ka_supabase_session_v1'); location.reload(); } };
  }
  function fillSettings(){
    const s=Object.assign({}, SETTINGS_DEFAULT, window.state && window.state.siteSettings || {});
    const map={name:s.institutionName,subtitle:s.subtitle,tagline:s.tagline,phone:s.phone,email:s.email,address:s.address,logo:s.logoUrl};
    Object.keys(map).forEach(k=>{const e=document.getElementById('ka-set-'+k);if(e)e.value=map[k]||''});
  }
  window.showSettings=function(){
    ['dashboard','students','payments','staffs','monthly-sheet','invoice','sheets-guide'].forEach(t=>{const v=document.getElementById('view-'+t),b=document.getElementById('tab-'+t);if(v)v.classList.add('hidden');if(b)b.classList.remove('active')});
    document.querySelectorAll('#ka-settings-view').forEach(v=>v.classList.remove('hidden'));
    document.getElementById('tab-site-settings')?.classList.add('active'); fillSettings();
  };

  const oldOnload=window.onload;
  window.onload=function(e){
    if(oldOnload) oldOnload(e);
    addSettingsUI(); applyBrand();
    setTimeout(loadCloud, 300);
  };
  if(document.readyState!=='loading'){
    setTimeout(function(){addSettingsUI();applyBrand();if(window.KORANER_ACCESS_TOKEN) loadCloud();},50);
  }
})();
