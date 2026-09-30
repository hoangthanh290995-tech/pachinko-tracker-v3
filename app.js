const KEY='pachinko-v3-machines', HIST='pachinko-v3-history';
const SOURCE='https://www.pscube.jp/dedamajyoho-P-townDMMpachi/c732920/cgi-bin/nc-v03-001.php?cd_ps=1&bai=0.89';
let machines=JSON.parse(localStorage.getItem(KEY)||'[]');let history=JSON.parse(localStorage.getItem(HIST)||'[]');
const $=id=>document.getElementById(id),num=v=>{const n=parseFloat(String(v).replace(/,/g,''));return Number.isFinite(n)?n:0};
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function score(m){const h=history.filter(x=>x.name===m.name);if(h.length<2)return 0;return num(h[h.length-1].rate)-num(h[h.length-2].rate)}
function render(){
 $('machineCount').textContent=machines.length;$('trendCount').textContent=machines.filter(m=>score(m)>0).length+' tăng';$('updatedAt').textContent=new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
 $('empty').style.display=history.length?'none':'block';
 $('analysis').innerHTML=machines.length?machines.map(m=>{const d=score(m),h=history.filter(x=>x.name===m.name),change=h.length>1?num(h[h.length-1].rate)-num(h[0].rate):0;const label=d>0?'Đang tăng':d<0?'Đang giảm':'Ổn định';return `<div class="machine"><div><b>${escapeHtml(m.name)}</b><small>回転 ${escapeHtml(m.spins||0)} · 出玉 ${escapeHtml(m.rate||0)}</small><small>${label} · thay đổi: ${change>=0?'+':''}${change}</small></div></div>`}).join(''):'<div class="empty">Chưa có máy.</div>';
 $('history').innerHTML=history.slice(-30).reverse().map(x=>`<div class="historyRow"><b>${escapeHtml(x.name)}</b><span>${escapeHtml(x.rate)} · ${escapeHtml(x.spins)}回 · ${new Date(x.time).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</span></div>`).join('');
}
function addSnapshot(m){history.push({name:m.name,spins:m.spins||0,rate:m.rate||0,time:Date.now()});if(history.length>1000)history=history.slice(-1000)}
window.removeMachine=i=>{machines.splice(i,1);localStorage.setItem(KEY,JSON.stringify(machines));render()};
$('addBtn').onclick=()=>{const name=prompt('Nhập số/tên máy');if(!name)return;const spins=prompt('回転 (số vòng)','0')||'0',rate=prompt('出玉','0')||'0',m={name,spins,rate,auto:false};machines.push(m);addSnapshot(m);save()};
function save(){localStorage.setItem(KEY,JSON.stringify(machines));localStorage.setItem(HIST,JSON.stringify(history));render()}
$('refreshBtn').onclick=async()=>{await refreshData();render()};
async function refreshData(){$('status').textContent='Đang lấy dữ liệu…';try{const r=await fetch('https://api.allorigins.win/raw?url='+encodeURIComponent(SOURCE),{cache:'no-store'});if(!r.ok)throw Error(r.status);const rows=parsePcube(await r.text());if(!rows.length)throw Error('Không tìm thấy bảng');machines=rows.map(x=>({name:x.id+' '+x.name,spins:x.count,rate:x.point,auto:true}));machines.forEach(addSnapshot);save();$('status').textContent=`Đã cập nhật ${machines.length} máy`;}catch(e){$('status').textContent='Không đọc được nguồn tự động; có thể nhập dữ liệu thủ công.';}}
function parsePcube(html){const doc=new DOMParser().parseFromString(html,'text/html'),out=[];doc.querySelectorAll('tr').forEach(tr=>{const c=[...tr.querySelectorAll('th,td')].map(x=>x.textContent.replace(/\s+/g,' ').trim());if(c.length>=3&&/^\d{3,4}$/.test(c[0]))out.push({id:c[0],name:c[1]||'Máy',count:c[2]||0,point:c[3]||0})});return out.slice(0,100)}
render();
