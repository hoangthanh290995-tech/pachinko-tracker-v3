const API='https://pachinko-data-api.onrender.com/api/data';
const HISTORY_KEY='pachinko-tracker-v3919-history-v1';
const $=id=>document.getElementById(id);let data=[];
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function status(t){$('status').textContent=t}
function fmt(n){return n==null||n===''?'—':Number(n).toLocaleString('ja-JP')}
function dayKey(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo'}).format(new Date())}
function loadHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}')}catch{return {}}}
function saveHistory(){try{localStorage.setItem(HISTORY_KEY,JSON.stringify(history))}catch{}}
let history=loadHistory();
function snapshotMachine(m){
 const d=m.days?.[0]||{};const s=m.detailStats||{};const live=m.live||{};
 const maxPayout=d.maxPayout??s.maxPayout;
 const big=d.big??s.big;
 const start=d.start??s.start;
 const continuation=d.continuation??s.continuation;
 const probability=d.probability??s.probability;
 if(maxPayout==null&&big==null&&start==null&&continuation==null&&probability==null)return null;
 return {day:dayKey(),maxPayout:maxPayout==null?null:Number(String(maxPayout).replace(/,/g,'')),big:big==null?null:Number(String(big).replace(/,/g,'')),start:start==null?null:Number(String(start).replace(/,/g,'')),continuation:continuation==null?null:Number(String(continuation).replace(/,/g,'')),probability:probability??null,updatedAt:new Date().toISOString(),source:live?'P\'sCUBE':'stored'};
}
function recordHistory(){
 for(const m of data){const snap=snapshotMachine(m);if(!snap)continue;const id=String(m.id);const arr=Array.isArray(history[id])?history[id]:[];const i=arr.findIndex(x=>x.day===snap.day);if(i>=0)arr[i]=snap;else arr.unshift(snap);history[id]=arr.slice(0,30)}
 saveHistory();
}
function historyDays(m){
 const stored=(history[String(m.id)]||[]).map(x=>({...x}));
 const server=Array.isArray(m.days)?m.days.map(x=>({...x})):[];
 const map=new Map();
 for(const d of server){const key=d.day===0?dayKey():String(d.day);map.set(key,d)}
 for(const d of stored){if(!map.has(d.day))map.set(d.day,d)}
 return [...map.values()].slice(0,30);
}
function render(){
 $('machineCount').textContent=data.length;$('trendCount').textContent=data.filter(x=>historyDays(x).length>1).length;$('updatedAt').textContent=dataUpdated?new Date(dataUpdated).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}):'—';
 const s=$('machineSelect');s.innerHTML=data.map(x=>`<option value="${esc(x.id)}">${esc(x.id)} · ${esc(x.model||'')}</option>`).join('');
 $('analysis').innerHTML=data.map(x=>{const days=historyDays(x),d=days[0]||{};return `<div class="machine"><div><b>台 ${esc(x.id)}</b><small>${esc(x.model||'')} · ${days.length}日</small><small>${x.detailUrl?'P\'sCUBE詳細取得済み':x.live?'P\'sCUBE一覧取得済み':'スクリーンショット基準データ'}</small></div><div class="machineMetric">本日 ${d.big??'—'}回<br><span>最大 ${d.maxPayout!=null?fmt(d.maxPayout):'—'} pt</span></div><button class="delete" onclick="pick('${esc(x.id)}')">見る</button></div>`}).join('')||'<div class="empty">データなし</div>';
 if(data.length)draw(data[0]);
}
window.pick=id=>{const m=data.find(x=>x.id===id);if(!m)return;$('machineSelect').value=id;draw(m)};
$('machineSelect').onchange=e=>draw(data.find(x=>x.id===e.target.value));$('range').onchange=()=>draw(data.find(x=>x.id===$('machineSelect').value));
function draw(m){
 const c=$('chart'),ctx=c.getContext('2d'),w=c.clientWidth||320,h=300,p=34;c.width=w*devicePixelRatio;c.height=h*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);ctx.clearRect(0,0,w,h);if(!m){$('chartInfo').textContent='';return}
 const days=historyDays(m).slice(0,Number($('range').value)||7).reverse();if(!days.length){$('chartInfo').textContent='日別データがありません。';return}
 const vals=days.map(d=>Number(d.maxPayout)||0),max=Math.max(...vals,1);
 ctx.beginPath();vals.forEach((v,i)=>{const x=p+i*(w-2*p)/Math.max(1,vals.length-1),y=h-p-v/max*(h-2*p);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
 vals.forEach((v,i)=>{const x=p+i*(w-2*p)/Math.max(1,vals.length-1),y=h-p-v/max*(h-2*p);ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();const label=String(days[i].day||'').match(/^\d{4}-\d{2}-\d{2}$/)?days[i].day.slice(5):days[i].day===0?'今日':days[i].day+'日前';ctx.fillText(label,Math.max(2,x-18),h-8)});
 $('chartInfo').textContent=`台 ${m.id} · 日別最大放出数（P'sCUBE記録） · 最新 ${fmt(vals[vals.length-1])} pt · ${days.length}日分`;
 const d=days[0]||{},ls=m.detailStats||{};$('detail').innerHTML=`<div class="detailGrid"><div><span>本日大当り</span><b>${d.big??ls.big??'—'}</b></div><div><span>継続回数</span><b>${d.continuation??ls.continuation??'—'}</b></div><div><span>最大継続</span><b>${d.maxContinuation??ls.maxContinuation??'—'}</b></div><div><span>大当り確率</span><b>${esc(d.probability||ls.probability||'—')}</b></div><div><span>累計スタート</span><b>${d.start??ls.start??'—'}</b></div><div><span>最大放出</span><b>${d.maxPayout!=null?fmt(d.maxPayout):(ls.maxPayout!=null?fmt(ls.maxPayout):'—')} pt</b></div></div>${m.detailUrl?`<p class="hint"><a href="${esc(m.detailUrl)}" target="_blank" rel="noopener">P'sCUBEの台 ${esc(m.id)} 詳細ページを開く ↗</a></p>`:''}`;
 $('hits').innerHTML=(m.todayHits||[]).map(h=>`<tr><td>${h.no}</td><td>${esc(h.time)}</td><td>${h.start??'—'}</td><td>${h.payout==null?'↑':fmt(h.payout)}</td><td>${esc(h.status)}</td></tr>`).join('')||'<tr><td colspan="5">履歴なし</td></tr>';
 const imgs=(m.graphAssets||[]).slice(0,12);$('graphAssets').innerHTML=imgs.length?imgs.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(u)}" alt="P'sCUBE graph"><small>${esc(u.split('/').pop()?.split('?')[0]||'graph')}</small></a>`).join(''):'<div class="hint">P\'sCUBEの実グラフ画像URLをまだ検出できていません。</div>';
}
let dataUpdated=null;
$('refreshBtn').onclick=load;
async function load(){status('P\'sCUBEからデータ取得中…');try{const r=await fetch(API+'?t='+Date.now(),{cache:'no-store'});const j=await r.json();if(!r.ok)throw Error(j.error||('HTTP '+r.status));if(!j.ok||!Array.isArray(j.machines))throw Error(j.error||'データ形式エラー');data=j.machines;dataUpdated=j.updated;recordHistory();status(j.liveOk?`P\'sCUBE接続済み · ${new Date(j.updated).toLocaleString('ja-JP')}`:`基準データ表示 · P\'sCUBE自動取得待ち`);render()}catch(e){status('取得エラー: '+e.message);if(!data.length)$('analysis').innerHTML='<div class="empty">'+esc(e.message)+'</div>'}}
load();setInterval(load,600000);
