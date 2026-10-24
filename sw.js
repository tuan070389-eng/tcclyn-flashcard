const SHELL='tcclyn-shell-6a03cfe7', AUDIO='tcclyn-audio-v3';
const FILES=["./", "index.html", "cards.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('tcclyn-')&&k!==SHELL&&k!==AUDIO).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function rangeResponse(req,res){
  const range=req.headers.get('range');if(!range)return res;
  const buf=await res.arrayBuffer();const size=buf.byteLength;
  const m=/bytes=(\d*)-(\d*)/.exec(range)||[];let start=m[1]?parseInt(m[1]):0;let end=m[2]?parseInt(m[2]):size-1;
  if(!m[1]&&m[2]){start=size-parseInt(m[2]);end=size-1}
  end=Math.min(end,size-1);
  return new Response(buf.slice(start,end+1),{status:206,statusText:'Partial Content',headers:{'Content-Type':'audio/mpeg','Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  if(url.pathname.includes('/audio/')){
    e.respondWith((async()=>{const c=await caches.open(AUDIO);const key=new URL(url.pathname,location.origin).href;
      let r=await c.match(key);
      if(!r){try{const full=await fetch(key);if(full.ok){await c.put(key,full.clone());r=full}else return full}catch(err){return new Response('',{status:504})}}
      return rangeResponse(e.request,r)})());
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(res=>{if(res.ok&&e.request.method==='GET'){const cl=res.clone();caches.open(SHELL).then(c=>c.put(e.request,cl))}return res}).catch(()=>caches.match('index.html'))));
});
