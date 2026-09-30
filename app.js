const KEY='pachinko-v3-machines';
let machines=JSON.parse(localStorage.getItem(KEY)||'[]');
const $=id=>document.getElementById(id);
function save(){localStorage.setItem(KEY,JSON.stringify(machines));render()}
function render(){
  $('machineCount').textContent=machines.length;
  $('bestMachine').textContent=machines.length?machines.reduce((a,b)=>Number(b.rate||0)>Number(a.rate||0)?b:a).name:'—';
  $('updatedAt').textContent=new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
  $('empty').style.display=machines.length?'none':'block';
  $('machineList').innerHTML=machines.map((m,i)=>`<div class="machine"><div><b>${escapeHtml(m.name)}</b><small>回転 ${escapeHtml(m.spins||'0')} · 出玉 ${escapeHtml(m.rate||'0')}</small></div><button class="delete" onclick="removeMachine(${i})">Xóa</button></div>`).join('');
}
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
window.removeMachine=i=>{machines.splice(i,1);save()};
$('addBtn').onclick=()=>{const name=prompt('Nhập số/tên máy');if(!name)return;const spins=prompt('回転 (số vòng) hiện tại','0')||'0';const rate=prompt('Chỉ số 出玉','0')||'0';machines.push({name,spins,rate});save()};
$('refreshBtn').onclick=()=>render();
render();
