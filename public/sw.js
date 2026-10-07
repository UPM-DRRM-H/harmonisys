/* Harmonisys public-shell worker. Authenticated pages, records and writes are NEVER cached. */
const CACHE='harmonisys-public-20261007-v3';
const PUBLIC_ASSETS=['/offline.html','/pwa/guide.json','/icons/app-192.png','/icons/app-512.png','/icons/apple-touch-icon.png'];
const LOCAL=['localhost','127.0.0.1','[::1]'].includes(self.location.hostname);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC_ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('harmonisys-public-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||request.headers.get('RSC')==='1'||url.searchParams.has('_rsc'))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).catch(async()=>{const cached=await caches.match('/offline.html');return cached||new Response('You are offline. Reconnect to continue.',{status:503,headers:{'Content-Type':'text/plain'}});}));return;
 }
 const publicAsset=PUBLIC_ASSETS.includes(url.pathname);
 const buildAsset=!LOCAL&&url.pathname.startsWith('/_next/static/')&&['script','style','font',''].includes(request.destination);
 if(!publicAsset&&!buildAsset)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);const existing=await cache.match(request);if(existing)return existing;
  const response=await fetch(request);
  if(response.ok&&response.type!=='opaque'&&!/private|no-store/i.test(response.headers.get('Cache-Control')||''))await cache.put(request,response.clone());
  return response;
 })());
});
