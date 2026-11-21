/* Tilâvet çevrimdışı önbellek */
const V='tilavet-v34';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./vendor/pdfjs/pdf.min.mjs','./vendor/pdfjs/pdf.worker.min.mjs'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('tilavet-v')&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    // sayfa: önce ağ (güncelleme gelsin), yoksa önbellek
    if(r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html')){
      e.respondWith(fetch(r,{cache:'no-store'}).then(res=>{const c=res.clone(); caches.open(V).then(x=>x.put('./index.html',c)); return res}).catch(()=>caches.match('./index.html')));
      return;
    }
    e.respondWith(caches.match(r).then(m=>m||fetch(r)));
    return;
  }
  if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.open('tilavet-fonts').then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{c.put(r,res.clone());return res}))));
    return;
  }
  // indirilmiş ayet kayıtları: telefondan çal (ileri sarma için parça parça yanıt)
  if(u.hostname==='everyayah.com'){
    const name='tilavet-ses-'+u.pathname.split('/')[2];
    e.respondWith(caches.open(name).then(c=>c.match(u.origin+u.pathname)).then(m=>m?ranged(m,r):fetch(r)).catch(()=>fetch(r)));
    return;
  }
  if(u.hostname==='api.qurancdn.com'){
    e.respondWith(caches.open('tilavet-zaman').then(c=>fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>c.match(r))));
  }
});

async function ranged(m,r){
  const b=await m.blob(), n=b.size, h=r.headers.get('range');
  const base={'Content-Type':'audio/mpeg','Accept-Ranges':'bytes'};
  const x=h&&/bytes=(\d*)-(\d*)/.exec(h);
  if(!x) return new Response(b,{status:200,headers:Object.assign({'Content-Length':String(n)},base)});
  let a=x[1]===''?Math.max(0,n-(+x[2])):+x[1], z=x[2]===''||x[1]===''?n-1:Math.min(+x[2],n-1);
  if(a>=n) return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+n}});
  return new Response(b.slice(a,z+1),{status:206,headers:Object.assign({'Content-Range':'bytes '+a+'-'+z+'/'+n,'Content-Length':String(z-a+1)},base)});
}
