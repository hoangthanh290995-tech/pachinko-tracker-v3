const http=require('http'),https=require('https');
const HOST='https://www.pscube.jp';
const MODEL='e牙狼12 XX-MJ';
const ENCODED=encodeURIComponent(MODEL);
const PATHS=[
  `/dedamajyoho-P-townDMMpachi/c732920/cgi-bin/nc-v05-003.php?cd_ps=1&bai=0.89&nmk_kisyu=${ENCODED}`,
  '/dedamajyoho-P-townDMMpachi/c732920/cgi-bin/nc-v05-003.php?cd_ps=1&bai=0.89&nmk_kisyu=e%25E7%2589%2599%25E7%258B%25BC12%2BXX-MJ'
];
const DIRECTS=PATHS.flatMap(p=>[HOST+p,'https://pscube.jp'+p]);
function jina(target){return 'https://r.jina.ai/'+target.replace(/\?/g,'%3F').replace(/&/g,'%26').replace(/=/g,'%3D')}
const READERS=DIRECTS.map(jina);
function fetchText(url,timeout=9000,depth=0){return new Promise((resolve,reject)=>{if(depth>5)return reject(Error('Too many redirects'));let target;try{target=new URL(url)}catch(e){return reject(e)}const mod=target.protocol==='http:'?http:https;const req=mod.get(target,{headers:{'User-Agent':'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Safari/537.36','Accept':'text/html,application/xhtml+xml,text/plain,*/*','Accept-Language':'ja,en;q=0.8','Connection':'close'},timeout},r=>{if(r.statusCode>=300&&r.statusCode<400&&r.headers.location){r.resume();return fetchText(new URL(r.headers.location,target).href,timeout,depth+1).then(resolve).catch(reject)}let b='';r.setEncoding('utf8');r.on('data',x=>b+=x);r.on('end',()=>r.statusCode>=200&&r.statusCode<300?resolve({html:b,url:target.href,status:r.statusCode}):reject(Error('HTTP '+r.statusCode+' '+target.href)));r.on('error',reject)});req.on('timeout',()=>req.destroy(Error('Timeout '+target.href)));req.on('error',reject)})}
function clean(s){return s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&#x([0-9a-f]+);/gi,(_,x)=>String.fromCharCode(parseInt(x,16))).replace(/&#(\d+);/g,(_,x)=>String.fromCharCode(Number(x))).replace(/\s+/g,' ').trim()}
function nums(s){return (s.match(/[-+]?\d[\d,]*(?:\.\d+)?/g)||[]).map(x=>Number(x.replace(/,/g,''))).filter(Number.isFinite)}
function parse(html){const rows=[];const re=/<tr[\s\S]*?<\/tr>/gi;let m;while((m=re.exec(html))){const t=clean(m[0]);const id=(t.match(/\b\d{4}\b/)||[])[0];if(!id)continue;const values=nums(t);if(values.length)rows.push({id,values:values.slice(-20)})}if(rows.length)return dedupe(rows);for(const line of html.split(/\r?\n/)){const t=clean(line);const id=(t.match(/\b\d{4}\b/)||[])[0];if(!id)continue;const values=nums(t);if(values.length)rows.push({id,values:values.slice(-20)})}return dedupe(rows)}
function dedupe(rows){const seen=new Set();return rows.filter(x=>!seen.has(x.id)&&seen.add(x.id))}
async function getSource(){
  const urls=[...DIRECTS,...READERS];
  const results=await Promise.allSettled(urls.map(u=>fetchText(u,8500)));
  const errors=[];
  for(const r of results){if(r.status==='fulfilled'){if(/\b\d{4}\b/.test(r.value.html))return r.value;errors.push('No machine numbers')}else errors.push(r.reason?.message||String(r.reason))}
  throw Error('P\'sCUBE source unavailable: '+errors.slice(-3).join(' | '));
}
const server=http.createServer(async(req,res)=>{res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');const path=new URL(req.url,'http://localhost').pathname;try{if(path==='/health'){res.end(JSON.stringify({ok:true,version:'3.9.11',source:"P'sCUBE nc-v05-003",proxy:'parallel direct+jina'}));return}if(path==='/api/data'){const src=await getSource();const machines=parse(src.html);if(!machines.length)throw Error("P'sCUBE opened but no machine rows were found");res.end(JSON.stringify({ok:true,version:'3.9.11',source:src.url,model:MODEL,updated:new Date().toISOString(),machines}));return}res.statusCode=404;res.end(JSON.stringify({error:'not found'}))}catch(e){res.statusCode=502;res.end(JSON.stringify({ok:false,version:'3.9.11',error:e.message,source:PATHS[0]}))}});server.listen(process.env.PORT||10000,'0.0.0.0');