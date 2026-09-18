import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import {getAccess} from './authz.js';

const c=window.QURANER_ALO_CONFIG;
const supabase=createClient(c.supabaseUrl,c.supabasePublishableKey,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));}
function money(v){return Number(v||0).toFixed(2)}
function msg(id,t,type=''){const el=$(id);if(!el)return;el.innerHTML=t;el.className='message-inline '+type;}
function today(){return new Date().toISOString().slice(0,10)}
function setFormEnabled(formId,enabled){const form=$(formId);if(!form)return;form.querySelectorAll('input,select,textarea,button[type="submit"]').forEach(el=>el.disabled=!enabled)}
let access=null,canFinanceView=false,canFinanceManage=false,canVoucherView=false,canVoucherManage=false,currentView='income';
function viewFromHash(){const hash=location.hash.replace('#','');return hash==='expense'?'expense':hash==='vouchers'?'vouchers':'income';}
function updateView(){currentView=viewFromHash();document.querySelectorAll('.finance-view').forEach(el=>el.classList.remove('is-active'));const target=currentView==='income'?'incomeView':currentView==='expense'?'expenseView':'vouchersView';$(target)?.classList.add('is-active');$('brandSubtitle').textContent=currentView==='income'?'Income Management':currentView==='expense'?'Expense Management':'Voucher Management';setFormEnabled('financeForm',currentView==='income'&&canFinanceManage);setFormEnabled('expenseForm',currentView==='expense'&&canFinanceManage);setFormEnabled('voucherForm',currentView==='vouchers'&&canVoucherManage);}
async function findVoucher(sourceId){const {data,error}=await supabase.from('qa_vouchers').select('voucher_id,voucher_no,voucher_type').eq('source_type','finance_transaction').eq('source_id',sourceId).maybeSingle();if(error)throw error;return data;}
function voucherLink(v){return v?'<a class="quick-link" target="_blank" rel="noopener" href="receipt.html?type=voucher&id='+encodeURIComponent(v.voucher_id)+'">'+esc(v.voucher_no)+'</a>':'—';}
function sourceLabel(v){if(v.source_type==='finance_transaction')return v.voucher_type==='income'?'Income':'Expense';if(v.source_type==='fee_payment')return 'Fee';if(v.source_type==='payroll_payment')return 'Payroll';return 'Manual';}
async function loadTransactions(){
  if(!canFinanceView){$('incomeRows').innerHTML='<tr><td colspan="6">No permission.</td></tr>';$('expenseRows').innerHTML='<tr><td colspan="6">No permission.</td></tr>';return;}
  const {data,error}=await supabase.from('qa_finance_transactions').select('transaction_id,transaction_date,direction,category,amount,account_name,reference,description,created_by').order('transaction_date',{ascending:false}).order('created_at',{ascending:false}).limit(300);
  if(error)throw error;
  const txs=data||[],ids=txs.map(x=>x.transaction_id);
  let voucherRows=[];
  if(ids.length){const {data:v,error:ve}=await supabase.from('qa_vouchers').select('voucher_id,voucher_no,voucher_type,source_type,source_id').eq('source_type','finance_transaction').in('source_id',ids);if(ve)throw ve;voucherRows=v||[];}
  const vouchers=Object.fromEntries(voucherRows.map(v=>[v.source_id,v]));
  const income=txs.filter(x=>x.direction==='income'),expense=txs.filter(x=>x.direction==='expense');
  $('incomeCount').textContent=income.length+' records';$('expenseCount').textContent=expense.length+' records';
  const renderRows=rows=>rows.map(x=>'<tr><td>'+esc(x.transaction_date)+'</td><td>'+esc(x.category)+'</td><td>৳'+money(x.amount)+'</td><td>'+esc(x.account_name)+'</td><td>'+esc(x.reference||'—')+'</td><td>'+voucherLink(vouchers[x.transaction_id])+'</td></tr>').join('');
  $('incomeRows').innerHTML=renderRows(income)||'<tr><td colspan="6">কোনো Income record পাওয়া যায়নি।</td></tr>';
  $('expenseRows').innerHTML=renderRows(expense)||'<tr><td colspan="6">কোনো Expense record পাওয়া যায়নি।</td></tr>';
  const totalIncome=income.reduce((a,x)=>a+Number(x.amount||0),0),totalExpense=expense.reduce((a,x)=>a+Number(x.amount||0),0);
  $('incomeTotal').textContent='৳'+money(totalIncome);$('expenseTotal').textContent='৳'+money(totalExpense);$('netTotal').textContent='৳'+money(totalIncome-totalExpense);
}
async function loadVouchers(){
  if(!canVoucherView){$('voucherRows').innerHTML='<tr><td colspan="8">No permission.</td></tr>';$('voucherTotal').textContent='—';return;}
  const {data,error}=await supabase.from('qa_vouchers').select('voucher_id,voucher_no,voucher_type,voucher_date,amount,account_name,party_name,status,source_type').order('created_at',{ascending:false}).limit(300);
  if(error)throw error;
  const vs=data||[];$('voucherTotal').textContent=vs.length;$('voucherCount').textContent=vs.length+' vouchers';
  $('voucherRows').innerHTML=vs.map(v=>'<tr><td><strong>'+esc(v.voucher_no)+'</strong></td><td>'+esc(v.voucher_date)+'</td><td>'+esc(v.voucher_type)+'</td><td>৳'+money(v.amount)+'</td><td>'+esc(v.party_name||'—')+'</td><td><span class="voucher-source">'+esc(sourceLabel(v))+'</span></td><td>'+esc(v.status)+'</td><td><a class="quick-link" target="_blank" rel="noopener" href="receipt.html?type=voucher&id='+encodeURIComponent(v.voucher_id)+'">Print</a></td></tr>').join('')||'<tr><td colspan="8">কোনো Voucher record পাওয়া যায়নি।</td></tr>';
}
async function refresh(){await Promise.all([loadTransactions(),loadVouchers()]);updateView();}
$('financeForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!canFinanceManage){msg('financeMessage','Income manage permission নেই।','error');return;}msg('financeMessage','Income saving হচ্ছে…');
  const row={transaction_date:$('transactionDate').value,direction:'income',category:$('category').value.trim(),amount:+$('amount').value,account_name:$('accountName').value,reference:$('reference').value.trim()||null,description:$('description').value.trim()};
  const {data,error}=await supabase.from('qa_finance_transactions').insert(row).select('transaction_id').single();
  if(error){console.error(error);msg('financeMessage','Income save করা যায়নি।','error');return;}
  try{const v=await findVoucher(data.transaction_id);if(v)msg('financeMessage','Income সফলভাবে save হয়েছে। Voucher: <strong>'+esc(v.voucher_no)+'</strong> &nbsp; <a class="quick-link" target="_blank" rel="noopener" href="receipt.html?type=voucher&id='+encodeURIComponent(v.voucher_id)+'">Open Voucher</a>','success');else msg('financeMessage','Income save হয়েছে; Voucher এখনো পাওয়া যায়নি।','error');}catch(error){console.error(error);msg('financeMessage','Income save হয়েছে, কিন্তু Voucher link load হয়নি।','error');}
  e.target.reset();$('transactionDate').value=today();await refresh();
});
$('expenseForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!canFinanceManage){msg('expenseMessage','Expense manage permission নেই।','error');return;}msg('expenseMessage','Expense saving হচ্ছে…');
  const row={transaction_date:$('expenseDate').value,direction:'expense',category:$('expenseCategory').value.trim(),amount:+$('expenseAmount').value,account_name:$('expenseAccount').value,reference:$('expenseReference').value.trim()||null,description:$('expenseDescription').value.trim()};
  const {data,error}=await supabase.from('qa_finance_transactions').insert(row).select('transaction_id').single();
  if(error){console.error(error);msg('expenseMessage','Expense save করা যায়নি।','error');return;}
  try{const v=await findVoucher(data.transaction_id);if(v)msg('expenseMessage','Expense সফলভাবে save হয়েছে। Voucher: <strong>'+esc(v.voucher_no)+'</strong> &nbsp; <a class="quick-link" target="_blank" rel="noopener" href="receipt.html?type=voucher&id='+encodeURIComponent(v.voucher_id)+'">Open Voucher</a>','success');else msg('expenseMessage','Expense save হয়েছে; Voucher এখনো পাওয়া যায়নি।','error');}catch(error){console.error(error);msg('expenseMessage','Expense save হয়েছে, কিন্তু Voucher link load হয়নি।','error');}
  e.target.reset();$('expenseDate').value=today();await refresh();
});
$('voucherForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!canVoucherManage){msg('voucherMessage','Vouchers manage permission নেই।','error');return;}msg('voucherMessage','Creating voucher…');
  const row={voucher_type:$('voucherType').value,voucher_date:$('voucherDate').value,amount:+$('voucherAmount').value,account_name:$('voucherAccount').value,party_name:$('partyName').value.trim(),reference:$('voucherReference').value.trim()||null,description:$('voucherDescription').value.trim()};
  const {data,error}=await supabase.from('qa_vouchers').insert(row).select('voucher_id,voucher_no').single();
  if(error){console.error(error);msg('voucherMessage','Voucher save করা যায়নি।','error');return;}
  msg('voucherMessage','Voucher তৈরি হয়েছে: <strong>'+esc(data.voucher_no)+'</strong> &nbsp; <a class="quick-link" target="_blank" rel="noopener" href="receipt.html?type=voucher&id='+encodeURIComponent(data.voucher_id)+'">Open Voucher</a>','success');
  e.target.reset();$('voucherDate').value=today();await refresh();
});
$('signOut').addEventListener('click',async()=>{await supabase.auth.signOut();location.replace('./')});
window.addEventListener('hashchange',updateView);
async function init(){
  access=await getAccess(supabase);if(!access){await supabase.auth.signOut();location.replace('./');return;}
  canFinanceView=access.can('finance.view')||access.can('finance.manage');canFinanceManage=access.can('finance.manage');canVoucherView=access.can('vouchers.view')||access.can('vouchers.manage');canVoucherManage=access.can('vouchers.manage');
  $('transactionDate').value=today();$('expenseDate').value=today();$('voucherDate').value=today();
  if(!canFinanceView&&!canVoucherView){$('loading').textContent='Finance/Voucher module-এর permission আপনার account-এ নেই।';return;}
  $('loading').classList.add('hidden');$('app').classList.remove('hidden');setFormEnabled('financeForm',false);setFormEnabled('expenseForm',false);setFormEnabled('voucherForm',false);
  try{await refresh()}catch(error){console.error(error);msg('financeMessage','Finance/Voucher data load করা যায়নি।','error')}
}
init();