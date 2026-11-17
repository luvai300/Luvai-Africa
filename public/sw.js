const CACHE='luvai-africa-offline-v1';
const OFFLINE='/offline.html';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([OFFLINE,'/logo-mark.svg'])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('luvai-africa-offline-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(url.pathname==='/logo-mark.svg'){event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(cache=>cache.match('/logo-mark.svg'))));return;}
 if(event.request.mode!=='navigate'||/^\/(api|auth|signin-with-chatgpt|signout-with-chatgpt|callback)(\/|$)/.test(url.pathname))return;
 // Always use the network for app pages. Never cache sessions, APIs, or user listings.
 event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(async cache=>(await cache.match(OFFLINE))||new Response('You are offline. Reconnect and try again.',{status:503,headers:{'Content-Type':'text/plain'}}))));
});
