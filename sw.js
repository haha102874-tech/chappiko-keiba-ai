const CACHE="chappiko-slot-v11.2.0";
const ASSETS=["./","./index.html","./styles.css?v=11.2.0","./app.js?v=11.2.0","./manifest.webmanifest","./machine-registry.js?v=11.2.0","./machines/sao2.js?v=11.2.0","./machines/tokyo-ghoul.js?v=11.2.0","./machines/otome5.js?v=11.2.0","./machines/vividred.js?v=11.2.0","./machines/generic.js?v=11.2.0"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
});
