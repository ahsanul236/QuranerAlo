// Public Supabase client configuration. Never put a service_role/secret key here.
window.KORANER_ALO_CONFIG = {
  supabaseUrl: 'https://nnhzcfjmmbzzjmocvonm.supabase.co',
  supabaseAnonKey: 'sb_publishable_pnFGXjTcg_Mbh8XKQrTd7Q_dZRR7_H1',
  workspaceId: 'koraner-alo'
};
(function(){
  ['auth-ui.js','enhancer.js'].forEach(function(src){
    var s=document.createElement('script'); s.src=src; s.defer=false; document.head.appendChild(s);
  });
})();
