/* Service worker do Painel ACQUA.
 * Objetivo: garantir que TODOS sempre vejam a versão mais nova, sem precisar
 * limpar cache, mesmo com o app adicionado à tela inicial.
 *
 * Estratégia: NETWORK-FIRST para a navegação (o HTML).
 *   - Com internet  -> busca sempre do servidor (cache:'reload' fura o cache
 *                      velho do navegador) e guarda uma cópia.
 *   - Sem internet  -> mostra a última cópia guardada (continua funcionando).
 *
 * Requisições de dados (Supabase, acumulo.csv, dia.csv, logo) NÃO são
 * 'navigate', então passam direto — este SW não interfere nelas.
 */
var CACHE = 'painel-acqua-v1';

self.addEventListener('install', function () {
  self.skipWaiting();                 // novo SW assume sem ficar "esperando"
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.map(function (k) {       // limpa caches antigos
      return k === CACHE ? null : caches.delete(k);
    }));
    await self.clients.claim();        // passa a controlar as abas já abertas
  })());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return;   // só o documento HTML
  e.respondWith((async function () {
    try {
      var fresh = await fetch(req, { cache: 'reload' });          // ignora cache velho
      var cache = await caches.open(CACHE);
      cache.put(req, fresh.clone());                             // guarda p/ uso offline
      return fresh;
    } catch (err) {
      var cached = await caches.match(req) || await caches.match('./index.html');
      return cached || new Response('Sem conexão e sem cópia salva.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
