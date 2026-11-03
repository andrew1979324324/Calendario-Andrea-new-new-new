// Service worker: mette in cache SOLO i file statici della app (HTML/manifest/icone/loghi)
// così l'app si apre anche offline o con connessione debole.
// I dati (giorni assegnati, tariffe, ecc.) NON passano da qui: viaggiano sempre
// direttamente verso Google Apps Script (SCRIPT_URL), per restare sincronizzati
// in tempo reale tra i vari dispositivi.

// Cambiando il numero di versione, i telefoni scaricano di nuovo tutti i file.
const CACHE_NAME = "calendario-lavoro-v8";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.png",
  "./logo-512.png",
  // Loghi delle società: ogni file elencato qui DEVE esistere nella cartella "logos",
  // altrimenti l'installazione della cache fallisce.
  "./logos/airone.png",
  "./logos/anteprima-video.png",
  "./logos/av-set.png",
  "./logos/b-nomio.png",
  "./logos/centro-pilota.png",
  "./logos/ciccarelli.png",
  "./logos/dafral-soundvision.png",
  "./logos/de-simoni.png",
  "./logos/dhs.png",
  "./logos/digital-network.png",
  "./logos/fare-servizi.png",
  "./logos/gruppo-planet.png",
  "./logos/ifet.png",
  "./logos/livon.png",
  "./logos/lvs.png",
  "./logos/milani-group.png",
  "./logos/mondialtecnica.png",
  "./logos/niutek.png",
  "./logos/onegroup.png",
  "./logos/sincronismi.png",
  "./logos/studiovisio.png",
  "./logos/tcs-2000.png",
  "./logos/tecnoconference-roma.png",
  "./logos/tecnomeeting.png",
  "./logos/vms.png"
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
