const KEY='pachinko-v3-machines';
const SOURCE='https://www.pscube.jp/dedamajyoho-P-townDMMpachi/c732920/cgi-bin/nc-v03-001.php?cd_ps=1&bai=0.89';
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
$('refreshBtn').onclick=async()=>{await refreshData();render()};
async function refreshData(){
  // Browser CORS may block direct reading from P'sCUBE. We keep the source URL
  // and use a public CORS proxy only as an optional fallback; if unavailable,
  // the dashboard remains usable with manually tracked machines.
  $('updatedAt').textContent='Đang cập nhật…';
  try{
    const proxy='https://api.allorigins.win/raw?url='+encodeURIComponent(SOURCE);
    const r=await fetch(proxy,{cache:'no-store'});
    if(!r.ok) throw new Error('HTTP '+r.status);
    const text=await r.text();
    const rows=parsePcube(text);
    if(rows.length){
      const incoming=rows.map(x=>({name:x.id+' '+x.name,spins:x.count,rate:x.point,auto:true}));
      const manual=machines.filter(m=>!m.auto);
      machines=[...incoming,...manual];
      save();
      return;
    }
    throw new Error('Không tìm thấy bảng dữ liệu');
  }catch(e){
    console.warn('P-CUBE refresh failed',e);
    $('updatedAt').textContent='Không lấy được dữ liệu tự động';
  }
}
function parsePcube(html){
  const doc=new DOMParser().parseFromString(html,'text/html');
  const out=[];
  doc.querySelectorAll('tr').forEach(tr=>{
    const cells=[...tr.querySelectorAll('th,td')].map(x=>x.textContent.replace(/\s+/g,' ').trim());
    if(cells.length>=3 && /^\d{3,4}$/.test(cells[0]) && /\d/.test(cells[1])){
      out.push({id:cells[0],name:cells[1],count:cells[2],point:cells[3]||'0'});
    }
  });
  return out.slice(0,100);
}
render();
