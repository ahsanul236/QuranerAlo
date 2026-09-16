export async function getAccess(supabase){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) return null;
  const {data:profile,error:profileError}=await supabase.from('qa_users').select('user_id,email,full_name,role,active').eq('user_id',session.user.id).maybeSingle();
  if(profileError||!profile||!profile.active) return null;
  const {data:rows,error:permissionError}=await supabase.from('qa_user_permissions').select('permission_code').eq('user_id',session.user.id).eq('allowed',true);
  if(permissionError) return null;
  const permissions=new Set((rows||[]).map(row=>row.permission_code));
  const elevated=['owner','admin'].includes(profile.role);
  return {
    session,
    profile,
    permissions,
    can(permission){ return elevated || permissions.has(permission); }
  };
}

export async function requireAccess(supabase,permission,{redirect='./'}={}){
  const access=await getAccess(supabase);
  if(!access){ await supabase.auth.signOut(); window.location.replace(redirect); return null; }
  if(!access.can(permission)){ return {...access,denied:true}; }
  return access;
}
