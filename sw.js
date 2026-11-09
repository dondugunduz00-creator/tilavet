/* Tilâvet çevrimdışı önbellek */
const V='tilavet-v13';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
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
  if(u.hostname==='api.qurancdn.com'){
    e.respondWith(caches.open('tilavet-zaman').then(c=>fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>c.match(r))));
  }
});
