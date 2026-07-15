// Service worker: mette in cache SOLO i file statici della app (HTML/manifest/icone)
// così l'app si apre anche offline o con connessione debole.
// I dati (giorni assegnati, tariffe, ecc.) NON passano da qui: viaggiano sempre
// direttamente verso Google Apps Script (SCRIPT_URL), per restare sincronizzati
// in tempo reale tra i vari dispositivi.

const CACHE_NAME = "calendario-lavoro-v1";
const STATIC_ASSETS = [
  "./calendario-lavoro-mobile.html",
  "./manifest.json",
  "./logo.png",
  "./logo-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Non intercettare MAI le chiamate verso Google Apps Script:
  // devono sempre andare in rete per leggere/scrivere i dati aggiornati.
  if (url.includes("script.google.com")) {
    return;
  }

  // Per tutto il resto (file statici): cache-first, con aggiornamento in background.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
