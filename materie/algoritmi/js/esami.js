/* =====================================================================
   Pagina «Esami svolti»: archivio filtrabile, statistiche per argomento,
   simulazione a tempo. I dati arrivano da esami/*.js (window.ESAMI).
   Questo file si carica PRIMA di core.js e registra APPUNTI_PRIMA, così
   l'archivio esiste già quando il motore attiva quiz e soluzioni a passi.
   ===================================================================== */
(function () {
  "use strict";

  const NOMI_TAG = {
    notazione: "Analisi del costo", ricorrenze: "Ricorrenze", ordinamento: "Ordinamento", selezione: "Selezione",
    "strutture-elementari": "Liste, pile e code", alberi: "Alberi e visite", bst: "Alberi binari di ricerca", avl: "Alberi AVL",
    hash: "Tabelle hash", heap: "Heap e code con priorità", "union-find": "Union-Find", "divide-et-impera": "Divide et impera",
    greedy: "Greedy", "programmazione-dinamica": "Programmazione dinamica", grafi: "Grafi e visite", mst: "Alberi di copertura minimi",
    "cammini-minimi": "Cammini minimi", np: "NP-completezza", java: "Java"
  };
  const CAPITOLO = {
    notazione: "02-notazione-asintotica", ricorrenze: "02-notazione-asintotica", ordinamento: "03-ordinamento", selezione: "03-ordinamento",
    "strutture-elementari": "04-strutture-elementari", alberi: "05-alberi", bst: "05-alberi", avl: "05-alberi", hash: "06-tabelle-hash",
    heap: "07-heap", "union-find": "08-union-find", "divide-et-impera": "09-tecniche-algoritmiche", greedy: "09-tecniche-algoritmiche",
    "programmazione-dinamica": "09-tecniche-algoritmiche", grafi: "10-grafi", mst: "11-mst-cammini-minimi", "cammini-minimi": "11-mst-cammini-minimi",
    np: "12-np-completezza", java: "java"
  };
  const ORDINE_TIPI = ["analisi", "simulazione", "progettazione", "teoria"];

  window.APPUNTI_PRIMA = function (A) {
    const { $, $$, esc, esercizioEsame, dataIt, NOMI_TIPO } = A;
    const esami = (window.ESAMI || []).slice().sort((a, b) => (b.data + (b.turno || b.id)).localeCompare(a.data + (a.turno || a.id)));
    const tutti = [];
    esami.forEach((e) => (e.esercizi || []).forEach((x) => tutti.push({ e, x })));

    // ------------------------------------------------ totali e statistiche
    const anni = [...new Set(esami.map((e) => (e.data || "").slice(0, 4)).filter(Boolean))].sort().reverse();
    $("#ex-totali").textContent = esami.length
      ? `${esami.length} prove · ${tutti.length} esercizi · ${anni.length ? anni[anni.length - 1] + "–" + anni[0] : ""}`
      : "Le prove sono in preparazione: l'archivio si riempie man mano.";

    const conta = {};
    tutti.forEach(({ x }) => (x.argomenti || []).forEach((t) => (conta[t] = (conta[t] || 0) + 1)));
    const ordTag = Object.keys(conta).sort((a, b) => conta[b] - conta[a]);
    const max = Math.max(1, ...Object.values(conta));
    $("#ex-stat").innerHTML = ordTag.length
      ? ordTag.map((t) => `<div class="r"><a href="#archivio" data-vai-tag="${esc(t)}">${esc(NOMI_TAG[t] || t)}</a><span class="b" style="width:${(conta[t] / max) * 100}%" title="${conta[t]} esercizi"></span><span class="v">${conta[t]}</span></div>`).join("")
      : `<p class="avviso"><span class="etichetta">In arrivo</span><span>Le statistiche compaiono quando l'archivio contiene le prove.</span></p>`;

    // --------------------------------------------------------- archivio
    const tagSi = (x, t) => (x.argomenti || []).includes(t);
    $("#ex-prove").innerHTML = esami.map((e) => {
      const tags = [...new Set((e.esercizi || []).flatMap((x) => x.argomenti || []))];
      return `<details class="ex-prova" data-anno="${esc((e.data || "").slice(0, 4))}" data-id="${esc(e.id)}">
          <summary><span class="chip-data">${dataIt(e.data)}${e.turno ? " " + esc(e.turno) : ""}</span><b>${esc(e.titolo || "Prova del " + dataIt(e.data))}</b>
            ${e.ufficiale === false ? '<span class="ex-badge">soluzione non ufficiale</span>' : ""}
            <span class="ex-tags">${tags.map((t) => `<span class="chip-tag">${esc(t)}</span>`).join("")}</span></summary>
          <div class="ex-dentro">${(e.esercizi || []).map((x) => `<div class="ex-item" data-tag="${esc((x.argomenti || []).join(" "))}" data-tipo="${esc(x.tipo || "")}">${esercizioEsame(e, x, { aperto: true })}</div>`).join("")}</div>
        </details>`;
    }).join("") || `<p class="avviso"><span class="etichetta">In arrivo</span><span>Le prove stanno arrivando: ricarica la pagina tra un po'.</span></p>`;

    $("#ex-esercizi").innerHTML = tutti.map(({ e, x }) =>
      `<div class="ex-item" data-anno="${esc((e.data || "").slice(0, 4))}" data-tag="${esc((x.argomenti || []).join(" "))}" data-tipo="${esc(x.tipo || "")}">${esercizioEsame(e, x, { senzaDomanda: true })}</div>`).join("");

    // ---------------------------------------------------------- filtri
    const stato = { tag: new Set(), tipo: "", anno: "", testo: "", vista: "prove" };
    $("#f-tag").innerHTML = Object.keys(NOMI_TAG).filter((t) => conta[t]).map((t) =>
      `<button type="button" class="ex-chip" data-tag="${esc(t)}" aria-pressed="false">${esc(NOMI_TAG[t])}<small>${conta[t]}</small></button>`).join("");
    const contaTipo = {};
    tutti.forEach(({ x }) => { if (x.tipo) contaTipo[x.tipo] = (contaTipo[x.tipo] || 0) + 1; });
    $("#f-tipo").innerHTML = ORDINE_TIPI.filter((t) => contaTipo[t]).map((t) =>
      `<button type="button" class="ex-chip" data-tipo="${esc(t)}" aria-pressed="false">${esc(NOMI_TIPO[t] || t)}<small>${contaTipo[t]}</small></button>`).join("");
    $("#f-anno").insertAdjacentHTML("beforeend", anni.map((a) => `<option value="${a}">${a}</option>`).join(""));

    const testoDi = new Map();
    function testoItem(el) {
      if (!testoDi.has(el)) testoDi.set(el, el.textContent.toLowerCase());
      return testoDi.get(el);
    }
    function passa(el) {
      const tags = (el.dataset.tag || "").split(" ");
      if (stato.tag.size && ![...stato.tag].some((t) => tags.includes(t))) return false;
      if (stato.tipo && el.dataset.tipo !== stato.tipo) return false;
      if (stato.testo && !testoItem(el).includes(stato.testo)) return false;
      return true;
    }
    function applica() {
      let visibili = 0;
      $$("#ex-prove .ex-prova").forEach((p) => {
        const annoOk = !stato.anno || p.dataset.anno === stato.anno;
        let n = 0;
        $$(".ex-item", p).forEach((it) => { const ok = annoOk && passa(it); it.hidden = !ok; if (ok) n++; });
        p.hidden = n === 0;
        if (stato.vista === "prove") visibili += n;
      });
      $$("#ex-esercizi .ex-item").forEach((it) => {
        const ok = (!stato.anno || it.dataset.anno === stato.anno) && passa(it);
        it.hidden = !ok;
        if (ok && stato.vista === "esercizi") visibili++;
      });
      const filtrato = stato.tag.size || stato.tipo || stato.anno || stato.testo;
      $("#f-conteggio").textContent = tutti.length ? `${visibili} esercizi${filtrato ? " con questi filtri" : ""}` : "";
      $("#ex-prove").hidden = stato.vista !== "prove";
      $("#ex-esercizi").hidden = stato.vista !== "esercizi";
      $("#v-prove").setAttribute("aria-pressed", String(stato.vista === "prove"));
      $("#v-esercizi").setAttribute("aria-pressed", String(stato.vista === "esercizi"));
      $$("#f-tag .ex-chip").forEach((b) => b.setAttribute("aria-pressed", String(stato.tag.has(b.dataset.tag))));
      $$("#f-tipo .ex-chip").forEach((b) => b.setAttribute("aria-pressed", String(stato.tipo === b.dataset.tipo)));
    }
    $("#ex-filtri").addEventListener("click", (ev) => {
      const t = ev.target.closest("[data-tag]"), ti = ev.target.closest("[data-tipo]");
      if (t) { stato.tag.has(t.dataset.tag) ? stato.tag.delete(t.dataset.tag) : stato.tag.add(t.dataset.tag); if (stato.tag.size) stato.vista = "esercizi"; }
      if (ti) stato.tipo = stato.tipo === ti.dataset.tipo ? "" : ti.dataset.tipo;
      if (ev.target.id === "v-prove") stato.vista = "prove";
      if (ev.target.id === "v-esercizi") stato.vista = "esercizi";
      if (ev.target.id === "f-azzera") { stato.tag.clear(); stato.tipo = ""; stato.anno = ""; stato.testo = ""; $("#f-anno").value = ""; $("#f-testo").value = ""; }
      applica();
    });
    $("#f-anno").addEventListener("change", (ev) => { stato.anno = ev.target.value; applica(); });
    let attesa = null;
    $("#f-testo").addEventListener("input", (ev) => {
      clearTimeout(attesa);
      attesa = setTimeout(() => { stato.testo = ev.target.value.trim().toLowerCase(); applica(); }, 160);
    });
    $("#ex-stat").addEventListener("click", (ev) => {
      const a = ev.target.closest("[data-vai-tag]"); if (!a) return;
      stato.tag = new Set([a.dataset.vaiTag]); stato.vista = "esercizi"; applica();
    });
    // link diretto a un argomento: esami.html#tag-hash
    function daHash() {
      const m = /^#tag-([a-z-]+)$/.exec(location.hash || "");
      if (m && NOMI_TAG[m[1]]) { stato.tag = new Set([m[1]]); stato.vista = "esercizi"; applica(); document.getElementById("archivio").scrollIntoView(); }
    }
    window.addEventListener("hashchange", daHash);
    applica();
    setTimeout(daHash, 0);

    // ------------------------------------------------------ simulazione
    const sim = $("#ex-sim");
    let timer = null, resto = 0, inPausa = false;
    function mmss(s) { const m = Math.floor(Math.max(0, s) / 60), r = Math.max(0, s) % 60; return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`; }
    function disegnaTempo() {
      const t = $(".tempo", sim); if (!t) return;
      t.textContent = mmss(resto); t.classList.toggle("scaduto", resto <= 0);
    }
    function avviaTimer() {
      clearInterval(timer);
      timer = setInterval(() => {
        if (inPausa) return;
        resto--; disegnaTempo();
        if (resto <= 0) { clearInterval(timer); const m = $(".msg-tempo", sim); if (m) m.textContent = "Tempo scaduto: consegna e confronta con le soluzioni."; }
      }, 1000);
    }
    function candidati() {
      const soloRecenti = $("#sim-recenti").checked;
      return esami.filter((e) => !soloRecenti || (e.data || "") >= "2023");
    }
    function mostra(titolo, voci) {
      resto = 120 * 60; inPausa = false;
      sim.hidden = false;
      sim.innerHTML = `
        <div class="ex-timer">
          <span class="tempo" aria-live="off">120:00</span>
          <button class="btn piccolo" type="button" data-sim="pausa">Pausa</button>
          <button class="btn piccolo" type="button" data-sim="soluzioni">Mostra tutte le soluzioni</button>
          <button class="btn piccolo" type="button" data-sim="chiudi">Chiudi la simulazione</button>
          <span class="msg-tempo etichetta" style="text-transform:none;letter-spacing:0">${esc(titolo)}</span>
        </div>
        <div class="foglio-sim">${voci.map(({ e, x }, i) => `
          ${i === 2 ? '<p class="sep-fogli">Secondo gruppo di fogli: esercizi 3–4</p>' : i === 0 ? '<p class="sep-fogli">Primo gruppo di fogli: esercizi 1–2</p>' : ""}
          <div class="ex-sim-voce">
            ${esercizioEsame(e, Object.assign({}, x, { n: i + 1 }), { aperto: true, senzaDomanda: true, nascondiSoluzione: true })}
            <p><button class="btn piccolo" type="button" data-sim="una">Mostra la soluzione di questo esercizio</button>
            <span class="piccolo-meta">dalla prova del ${dataIt(e.data)}${e.turno ? " " + esc(e.turno) : ""}, esercizio ${x.n}</span></p>
          </div>`).join("")}</div>`;
      disegnaTempo(); avviaTimer();
      sim.scrollIntoView({ behavior: A.motoRidotto.matches ? "auto" : "smooth", block: "start" });
    }
    sim.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-sim]"); if (!b) return;
      const k = b.dataset.sim;
      if (k === "pausa") { inPausa = !inPausa; b.textContent = inPausa ? "Riprendi" : "Pausa"; }
      if (k === "soluzioni") $$(".soluzione", sim).forEach((s) => (s.hidden = false));
      if (k === "una") { const v = b.closest(".ex-sim-voce"); const s = $(".soluzione", v); if (s) s.hidden = false; b.remove(); }
      if (k === "chiudi") { clearInterval(timer); sim.hidden = true; sim.innerHTML = ""; }
    });
    const caso = (arr) => arr[Math.floor(Math.random() * arr.length)];
    $("#sim-reale").addEventListener("click", () => {
      const lista = candidati().filter((e) => (e.esercizi || []).length >= 3);
      if (!lista.length) return;
      const e = caso(lista);
      mostra(`Prova del ${dataIt(e.data)}${e.turno ? " " + e.turno : ""}`, e.esercizi.map((x) => ({ e, x })));
    });
    $("#sim-mista").addEventListener("click", () => {
      const lista = candidati();
      const per = (pos) => lista.flatMap((e) => (e.esercizi || []).filter((x) => x.n === pos).map((x) => ({ e, x })));
      const voci = [1, 2, 3, 4].map((p) => per(p)).filter((l) => l.length).map((l) => caso(l));
      if (!voci.length) return;
      mostra("Prova mista: esercizi 1–4 presi da prove diverse", voci);
    });
    if (!esami.length) { $("#sim-reale").disabled = true; $("#sim-mista").disabled = true; }
  };
})();
