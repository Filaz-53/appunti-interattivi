/* =====================================================================
   Algoritmi — widget interattivi (grafi, simulatori, animazioni)
   Ogni widget si aggancia a un elemento con data-widget="nome".
   Dipende da assets/js/core.js (window.Appunti).
   ===================================================================== */
(function () {
  "use strict";
  const { $, $$, Player, fly, esc } = window.Appunti;
  const NS = "http://www.w3.org/2000/svg";
  const nodoSvg = (tag, attrs, padre) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (padre) padre.appendChild(e);
    return e;
  };
  const fmt = (x) => x.toLocaleString("it-IT");

  /* ------------------------------------------------------------ grafi */
  const GRAFI = {
    A: {
      nome: "Esempio del PDF",
      vb: [540, 222],
      nodi: [["0", 60, 60], ["1", 190, 60], ["3", 360, 60], ["4", 480, 60], ["2", 60, 168], ["5", 480, 168]],
      ordine: ["0", "1", "2", "3", "4", "5"],
      archi: [["0", "1"], ["1", "2"], ["1", "3"], ["2", "0"], ["2", "3"], ["3", "4"], ["4", "5"], ["5", "4"]]
    },
    B: {
      nome: "Grafo B",
      vb: [540, 230],
      nodi: [["a", 60, 60], ["b", 190, 60], ["c", 330, 60], ["d", 470, 60], ["e", 60, 172], ["f", 190, 172], ["g", 330, 172], ["h", 470, 172]],
      ordine: ["a", "b", "c", "d", "e", "f", "g", "h"],
      archi: [["a", "b"], ["b", "c"], ["b", "e"], ["b", "f"], ["c", "d"], ["c", "g"], ["d", "c"], ["d", "h"], ["e", "a"], ["e", "f"], ["f", "g"], ["g", "f"], ["g", "h"]]
    }
  };
  function prepara(G) {
    if (G._ok) return G;
    G.pos = {};
    G.nodi.forEach(([id, x, y]) => (G.pos[id] = { x, y }));
    G.n = G.nodi.length;
    G._ok = true;
    return G;
  }
  function adiacenza(ids, archi, trasposto) {
    const a = {};
    ids.forEach((id) => (a[id] = []));
    archi.forEach(([u, v]) => (trasposto ? a[v].push(u) : a[u].push(v)));
    return a;
  }
  const chiave = (u, v) => u + ">" + v;

  /* SCC con Tarjan (serve ai widget, non è il simulatore). Gli indici sono
     rinumerati nell'ordine in cui compare il primo vertice di ogni componente. */
  function calcolaSCC(ordine, archi) {
    const adj = adiacenza(ordine, archi, false);
    const d = {}, low = {}, suS = {}, S = [], grezzo = {};
    let t = 0, k = 0;
    function visita(u) {
      d[u] = low[u] = t++; S.push(u); suS[u] = true;
      for (const w of adj[u]) {
        if (d[w] == null) { visita(w); low[u] = Math.min(low[u], low[w]); }
        else if (suS[w]) low[u] = Math.min(low[u], d[w]);
      }
      if (low[u] === d[u]) {
        let w;
        do { w = S.pop(); suS[w] = false; grezzo[w] = k; } while (w !== u);
        k++;
      }
    }
    ordine.forEach((u) => { if (d[u] == null) visita(u); });
    const rin = {}, comp = {};
    let c = 0;
    ordine.forEach((u) => { if (rin[grezzo[u]] == null) rin[grezzo[u]] = c++; comp[u] = rin[grezzo[u]]; });
    return { comp, k: c };
  }
  function cammino(ordine, archi, da, a) {
    if (da === a) return [da];
    const adj = adiacenza(ordine, archi, false);
    const prec = { [da]: null }, coda = [da];
    while (coda.length) {
      const u = coda.shift();
      for (const w of adj[u]) {
        if (!(w in prec)) {
          prec[w] = u;
          if (w === a) { const p = [a]; let x = a; while (prec[x] != null) { x = prec[x]; p.unshift(x); } return p; }
          coda.push(w);
        }
      }
    }
    return null;
  }

  /* ---------------------------------------------------- vista di un grafo */
  class Vista {
    constructor(svg, G, opz = {}) {
      this.svg = svg; this.G = prepara(G); this.r = 18;
      this.opz = opz;
      svg.classList.add("vg");
      svg.setAttribute("viewBox", `0 0 ${G.vb[0]} ${G.vb[1]}`);
      svg.setAttribute("role", "img");
      svg.innerHTML = "";
      this.gArchi = nodoSvg("g", {}, svg);
      this.gNodi = nodoSvg("g", {}, svg);
      this.nodi = {};
      G.nodi.forEach(([id, x, y]) => {
        const g = nodoSvg("g", { class: "nodo", "data-id": id }, this.gNodi);
        nodoSvg("circle", { class: "alone-n", cx: x, cy: y, r: this.r + 8 }, g);
        const c = nodoSvg("circle", { class: "corpo", cx: x, cy: y, r: this.r }, g);
        nodoSvg("text", { class: "lab", x, y }, g).textContent = id;
        const sopra = y < G.vb[1] / 2;
        const ann = nodoSvg("text", { class: "ann", x, y: sopra ? y - this.r - 10 : y + this.r + 22 }, g);
        this.nodi[id] = { g, c, ann };
      });
      this.impostaArchi(G.archi);
    }
    impostaArchi(archi) {
      this.archi = archi.slice();
      this.gArchi.innerHTML = "";
      const insieme = new Set(archi.map(([u, v]) => chiave(u, v)));
      this.el = archi.map(([u, v]) => {
        const g = nodoSvg("g", { class: "a" }, this.gArchi);
        const alone = nodoSvg("path", { class: "alone" }, g);
        const p = nodoSvg("path", { class: "arco" }, g);
        const h = nodoSvg("path", { class: "punta" }, g);
        return { u, v, g, alone, p, h, curvo: insieme.has(chiave(v, u)) };
      });
      this.el.forEach((e) => this.disegna(e, false));
    }
    disegna(e, inverso) {
      const P = this.G.pos, r = this.r;
      const a = P[e.u], b = P[e.v];
      let ctrl = null;
      if (e.curvo) {
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
        ctrl = { x: (a.x + b.x) / 2 - (dy / L) * 22, y: (a.y + b.y) / 2 + (dx / L) * 22 };
      }
      const da = inverso ? b : a, verso = inverso ? a : b;
      const unit = (p, q) => { const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1; return { x: dx / L, y: dy / L }; };
      const dirS = unit(da, ctrl || verso), dirE = unit(ctrl || da, verso);
      const s = { x: da.x + dirS.x * r, y: da.y + dirS.y * r };
      const tip = { x: verso.x - dirE.x * (r + 1), y: verso.y - dirE.y * (r + 1) };
      const fine = { x: tip.x - dirE.x * 8, y: tip.y - dirE.y * 8 };
      const d = ctrl ? `M${s.x},${s.y} Q${ctrl.x},${ctrl.y} ${fine.x},${fine.y}` : `M${s.x},${s.y} L${fine.x},${fine.y}`;
      e.p.setAttribute("d", d); e.alone.setAttribute("d", d);
      const px = -dirE.y, py = dirE.x, bx = tip.x - dirE.x * 10, by = tip.y - dirE.y * 10;
      e.h.setAttribute("d", `M${tip.x},${tip.y} L${bx + px * 5},${by + py * 5} L${bx - px * 5},${by - py * 5} Z`);
      e.inverso = inverso;
    }
    inverti(tutti) { this.el.forEach((e) => { if (!!e.inverso !== !!tutti) this.disegna(e, tutti); }); }
    indice(u, v) { return this.el.findIndex((e) => e.u === u && e.v === v); }
    nodo(id, classi, comp, ann) {
      const n = this.nodi[id];
      n.g.setAttribute("class", "nodo " + (classi || ""));
      if (comp == null || comp === "") n.g.removeAttribute("data-c");
      else n.g.setAttribute("data-c", String(comp % 6));
      n.ann.textContent = ann || "";
    }
    arco(i, classi) { if (this.el[i]) this.el[i].g.setAttribute("class", "a " + (classi || "")); }
    pulisci() {
      Object.keys(this.nodi).forEach((id) => this.nodo(id, "", null, ""));
      this.el.forEach((_, i) => this.arco(i, ""));
    }
  }

  /* ===================================================================
     1) Esploratore della definizione (§1)
     =================================================================== */
  function esploratore(box) {
    const G = prepara(GRAFI.A);
    box.innerHTML = `
      <svg aria-label="Grafo dell'esempio del PDF: tocca due vertici"></svg>
      <div class="msg" aria-live="polite"></div>
      <div class="fig-ctrl">
        <button class="btn toggle" type="button" data-t="colori" aria-pressed="false">Colora le SCC</button>
        <button class="btn toggle" type="button" data-t="extra" aria-pressed="false">Aggiungi l'arco 4 → 1</button>
        <button class="btn" type="button" data-t="reset">Ricomincia</button>
      </div>
      <div class="corsia">
        <span class="etichetta"><span>Grafo delle componenti</span><span>ogni SCC compressa in un nodo</span></span>
        <svg class="cond" aria-label="Grafo delle componenti"></svg>
      </div>`;
    const v = new Vista($("svg", box), G);
    const msg = $(".msg", box);
    let archi = G.archi.slice(), colori = false, sel = [];
    Object.entries(v.nodi).forEach(([id, n]) => {
      n.g.classList.add("cliccabile");
      n.g.setAttribute("tabindex", "0");
      n.g.setAttribute("role", "button");
      n.g.setAttribute("aria-label", "Vertice " + id);
    });
    function scegli(id) {
      if (sel.length >= 2) sel = [];
      sel.push(id);
      disegna();
    }
    v.gNodi.addEventListener("click", (e) => { const g = e.target.closest(".nodo"); if (g) scegli(g.dataset.id); });
    v.gNodi.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const g = e.target.closest(".nodo"); if (g) { e.preventDefault(); scegli(g.dataset.id); }
    });
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-t]"); if (!b) return;
      if (b.dataset.t === "colori") { colori = !colori; b.setAttribute("aria-pressed", String(colori)); }
      if (b.dataset.t === "extra") {
        const on = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", String(on));
        archi = on ? G.archi.concat([["4", "1"]]) : G.archi.slice();
        v.impostaArchi(archi);
      }
      if (b.dataset.t === "reset") { sel = []; }
      disegna();
    });
    function testoCammino(p) { return p ? p.join(" → ") : "nessun cammino"; }
    function disegna() {
      const { comp, k } = calcolaSCC(G.ordine, archi);
      G.ordine.forEach((id) => v.nodo(id, (sel.includes(id) ? "scelto cliccabile" : "cliccabile"), colori ? comp[id] : null, ""));
      v.el.forEach((e, i) => v.arco(i, e.u === "4" && e.v === "1" ? "a-nuovo" : ""));
      if (sel.length === 0) {
        msg.innerHTML = `Tocca un vertice <b>u</b>, poi un vertice <b>v</b>. Ti mostro se esiste un cammino da u a v <i>e</i> uno da v a u. Il grafo ha ${G.n} vertici, ${archi.length} archi e <b>${k} SCC</b>.`;
      } else if (sel.length === 1) {
        msg.innerHTML = `u = <b>${sel[0]}</b>. Ora tocca il secondo vertice v.`;
      } else {
        const [u, w] = sel;
        if (u === w) {
          msg.innerHTML = `Hai scelto due volte <b>${u}</b>. Un vertice raggiunge sempre se stesso con il cammino vuoto (lunghezza 0): ogni vertice sta nella propria SCC. Tocca un altro vertice per ricominciare.`;
        } else {
          const p1 = cammino(G.ordine, archi, u, w), p2 = cammino(G.ordine, archi, w, u);
          const segna = (p, cls) => { if (!p) return; for (let i = 0; i + 1 < p.length; i++) { const j = v.indice(p[i], p[i + 1]); const vecchio = v.el[j].g.getAttribute("class"); v.arco(j, (vecchio.includes("a-cammino") ? "a-cammino" : cls)); } };
          segna(p1, "a-cammino"); segna(p2, "a-cammino2");
          const stessa = p1 && p2;
          msg.innerHTML = `Da <b>${u}</b> a <b>${w}</b>: ${testoCammino(p1)} <span class="etichetta">linea piena</span><br>Da <b>${w}</b> a <b>${u}</b>: ${testoCammino(p2)} <span class="etichetta">tratteggio</span><br>` +
            (stessa ? `<b>Stessa SCC.</b> I due cammini insieme formano un giro chiuso che passa per ${u} e ${w}.`
                    : `<b>SCC diverse.</b> Manca il cammino ${p1 ? `da ${w} a ${u}` : `da ${u} a ${w}`}: basta un verso mancante per separarli.`);
        }
      }
      condensa($(".cond", box), G, archi, comp, k);
    }
    disegna();
  }

  /* grafo delle componenti: un rettangolo per SCC, in ordine topologico */
  function condensa(svg, G, archi, comp, k) {
    const membri = Array.from({ length: k }, () => []);
    G.ordine.forEach((u) => membri[comp[u]].push(u));
    const succ = Array.from({ length: k }, () => new Set());
    archi.forEach(([u, v]) => { if (comp[u] !== comp[v]) succ[comp[u]].add(comp[v]); });
    const liv = new Array(k).fill(0);
    for (let giro = 0; giro < k; giro++) succ.forEach((s, c) => s.forEach((d) => { liv[d] = Math.max(liv[d], liv[c] + 1); }));
    const perLiv = {};
    liv.forEach((l, c) => (perLiv[l] = perLiv[l] || []).push(c));
    const nl = Math.max(...liv) + 1, W = 540, H = 92;
    const pos = {};
    Object.entries(perLiv).forEach(([l, cs]) => cs.forEach((c, j) => {
      pos[c] = { x: nl === 1 ? W / 2 : 70 + (+l) * ((W - 140) / (nl - 1)), y: H / 2 + (j - (cs.length - 1) / 2) * 40 };
    }));
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.classList.add("vg");
    svg.innerHTML = "";
    succ.forEach((s, c) => s.forEach((d) => {
      const a = pos[c], b = pos[d];
      const g = nodoSvg("g", { class: "a" }, svg);
      const x1 = a.x + 52, x2 = b.x - 60;
      nodoSvg("path", { class: "arco", d: `M${x1},${a.y} L${x2},${b.y}` }, g);
      const dx = x2 - x1, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const tx = x2 + ux * 8, ty = b.y + uy * 8;
      nodoSvg("path", { class: "punta", d: `M${tx},${ty} L${x2 - uy * 5},${b.y + ux * 5} L${x2 + uy * 5},${b.y - ux * 5} Z` }, g);
    }));
    membri.forEach((m, c) => {
      const p = pos[c];
      const g = nodoSvg("g", { class: "nodo", "data-c": String(c % 6) }, svg);
      nodoSvg("rect", { class: "corpo comp-box", x: p.x - 52, y: p.y - 16, width: 104, height: 32, rx: 16, style: "fill: color-mix(in oklch, var(--cc) 30%, var(--paper-solid)); stroke: var(--cc)" }, g);
      nodoSvg("text", { class: "comp-lab", x: p.x, y: p.y }, g).textContent = "{" + m.join(",") + "}";
    });
  }

  /* ===================================================================
     2) Verificatore della mappa (§3)
     =================================================================== */
  function verificatore(box) {
    const G = prepara(GRAFI.A);
    const vere = calcolaSCC(G.ordine, G.archi).comp;
    const PRESET = {
      "Tabella 1": [0, 0, 0, 1, 2, 2],
      "Altri numeri, stesse SCC": [7, 7, 7, 42, 0, 0],
      "Componente spezzata": [0, 0, 0, 1, 2, 3],
      "Componenti fuse": [0, 0, 0, 1, 1, 1],
      "Chiave mancante": [0, 0, 0, 1, "", 2],
      "Indice negativo": [0, 0, 0, -1, 2, 2]
    };
    box.innerHTML = `
      <div class="fig-ctrl" role="group" aria-label="Esempi pronti">${Object.keys(PRESET).map((p) => `<button class="btn piccolo" type="button" data-p="${esc(p)}">${esc(p)}</button>`).join("")}</div>
      <div class="sim-corpo">
        <div class="sim-sx">
          <div class="tab-wrap"><table class="tab"><thead><tr><th>Vertice</th>${G.ordine.map((id) => `<th class="num">${id}</th>`).join("")}</tr></thead>
          <tbody><tr><td>Indice SCC</td>${G.ordine.map((id) => `<td><input type="number" id="vm-${id}" inputmode="numeric" style="width:4.2em;font:600 0.95rem var(--f-mono);padding:4px 6px;border:1px solid var(--rule);border-radius:6px;background:var(--paper-solid);color:var(--ink)" aria-label="Indice del vertice ${id}"></td>`).join("")}</tr></tbody></table></div>
          <svg aria-label="Il grafo colorato secondo la mappa"></svg>
        </div>
        <div class="sim-dx">
          <div class="corsia"><span class="etichetta"><span>Le tre proprietà della post-condizione</span></span>
            <ul class="checklist esiti" style="gap:6px"></ul></div>
          <div class="risultato" aria-live="polite"></div>
        </div>
      </div>`;
    const v = new Vista($("svg", box), G);
    const inputs = G.ordine.map((id) => $("#vm-" + id, box));
    function imposta(vals) { vals.forEach((x, i) => (inputs[i].value = x)); valuta(); }
    box.addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (b) imposta(PRESET[b.dataset.p]); });
    inputs.forEach((i) => i.addEventListener("input", valuta));
    function valuta() {
      const val = {};
      G.ordine.forEach((id, i) => { const s = inputs[i].value.trim(); val[id] = s === "" || isNaN(+s) ? null : Math.trunc(+s); });
      const distinti = [...new Set(G.ordine.map((id) => val[id]).filter((x) => x != null))];
      G.ordine.forEach((id) => v.nodo(id, "", val[id] == null ? null : distinti.indexOf(val[id]), val[id] == null ? "manca" : "→ " + val[id]));
      const mancanti = G.ordine.filter((id) => val[id] == null);
      const negativi = G.ordine.filter((id) => val[id] != null && val[id] < 0);
      const spezzate = [], fuse = [];
      for (let i = 0; i < G.ordine.length; i++) for (let j = i + 1; j < G.ordine.length; j++) {
        const a = G.ordine[i], b = G.ordine[j];
        if (val[a] == null || val[b] == null) continue;
        const stessaSCC = vere[a] === vere[b], stessoIdx = val[a] === val[b];
        if (stessaSCC && !stessoIdx) spezzate.push(`${a} e ${b} stanno nella stessa SCC ma hanno indici diversi (${val[a]} e ${val[b]})`);
        if (!stessaSCC && stessoIdx) fuse.push(`${a} e ${b} hanno lo stesso indice (${val[a]}) ma stanno in SCC diverse`);
      }
      const righe = [
        [mancanti.length === 0, "Tutti i vertici sono chiavi della mappa", mancanti.length ? `Manca ${mancanti.join(", ")}: il test stamperebbe «${mancanti[0]} , null».` : "Ci sono tutti e 6."],
        [!spezzate.length && !fuse.length, "Stesso indice se e solo se stessa SCC", spezzate.concat(fuse).slice(0, 3).join("; ") + (spezzate.length ? ". Hai spezzato una componente." : fuse.length ? ". Hai fuso componenti diverse." : "") || "Vale in entrambi i versi."],
        [negativi.length === 0, "Indici interi non negativi", negativi.length ? `${negativi.map((x) => `${x} → ${val[x]}`).join(", ")}: gli indici devono essere ≥ 0.` : "Nessun indice negativo."]
      ];
      $(".esiti", box).innerHTML = righe.map(([ok, t, d]) =>
        `<li style="display:grid;grid-template-columns:22px minmax(0,1fr);gap:8px;padding:8px 10px;border:1px solid ${ok ? "var(--ok)" : "var(--ko)"};border-radius:8px;background:${ok ? "var(--ok-tint)" : "var(--ko-tint)"}">
          <b style="color:${ok ? "var(--ok)" : "var(--ko)"};font-family:var(--f-display)">${ok ? "✓" : "✕"}</b>
          <span><b>${t}</b><br><span style="color:var(--ink-2);font-size:0.95rem">${esc(d)}</span></span></li>`).join("");
      const tutto = righe.every((r) => r[0]);
      $(".risultato", box).innerHTML = tutto ? "Mappa valida: rispetta la post-condizione." : "Mappa non valida: guarda la proprietà segnata in rosso.";
      $(".risultato", box).style.borderColor = tutto ? "var(--ok)" : "var(--ko)";
    }
    imposta(PRESET["Tabella 1"]);
  }

  /* ===================================================================
     3) Simulatore Kosaraju / Tarjan (Approfondimenti A e B)
     =================================================================== */
  const copia = (o) => JSON.parse(JSON.stringify(o));

  function genKosaraju(G) {
    prepara(G);
    const passi = [], m = G.archi.length;
    const st = { fase: 1, inv: false, ns: {}, d: {}, f: {}, comp: {}, es: {}, cur: null, ce: null, call: [], fin: [], usati: {}, cnt: { v: 0, e: 0 }, riga: 1 };
    G.ordine.forEach((u) => (st.ns[u] = "w"));
    const foto = (msg, voli) => passi.push(Object.assign(copia(st), { msg, voli: voli || [] }));
    const adj = adiacenza(G.ordine, G.archi, false), adjT = adiacenza(G.ordine, G.archi, true);
    const idx = (u, v) => G.archi.findIndex(([a, b]) => a === u && b === v);
    let t = 0;
    foto(`Tutti i vertici sono <b>bianchi</b> (non scoperti). <b>Fase 1</b>: visita in profondità di G, con un orologio t che avanza a ogni scoperta e a ogni fine visita.`);
    function visita(u) {
      st.d[u] = ++t; st.ns[u] = "g"; st.call.push(u); st.cur = u; st.ce = null; st.cnt.v++;
      foto(`Scopro <b>${u}</b>: d[${u}] = ${t}. Diventa grigio e la chiamata DFS-VISIT(${u}) va in cima alla pila delle chiamate.`, [{ da: "nodo", a: "call", id: u }]);
      for (const w of adj[u]) {
        const ei = idx(u, w); st.ce = ei; st.cur = u; st.cnt.e++;
        if (st.ns[w] === "w") {
          st.es[ei] = "a-albero";
          foto(`Esamino <b>${u} → ${w}</b>: ${w} è bianco, quindi è un arco dell'albero DFS. Scendo in ${w}.`);
          visita(w); st.cur = u;
        } else if (st.ns[w] === "g") {
          st.es[ei] = "a-indietro";
          foto(`Esamino <b>${u} → ${w}</b>: ${w} è grigio, cioè è ancora sulla pila delle chiamate. È un <b>arco all'indietro</b>: ${w} e ${u} stanno su un ciclo.`);
        } else {
          st.es[ei] = "a-visto";
          foto(`Esamino <b>${u} → ${w}</b>: ${w} è nero, la sua visita è già finita. Non c'è niente da fare.`);
        }
      }
      st.f[u] = ++t; st.ns[u] = "b"; st.call.pop(); st.fin.push(u); st.cur = u; st.ce = null;
      foto(`${u} non ha altri archi: f[${u}] = ${t}. Diventa nero e passa dalla pila delle chiamate alla <b>lista dei tempi di fine</b>.`, [{ da: "call", a: "fin", id: u }]);
    }
    let prima = true;
    for (const u of G.ordine) if (st.ns[u] === "w") {
      if (!prima) { st.cur = u; st.ce = null; foto(`La visita precedente è finita, ma <b>${u}</b> è ancora bianco: parte un nuovo albero da ${u}.`); }
      prima = false; visita(u);
    }
    st.fase = 2; st.riga = 2; st.inv = true; st.cur = null; st.ce = null; st.es = {};
    foto(`<b>Fase 2</b>: costruisco G<sup>T</sup> invertendo tutti gli ${m} archi. Le SCC non cambiano: se u e v si raggiungono a vicenda in G, si raggiungono anche con le frecce girate.`);
    st.fase = 3; st.riga = 3; G.ordine.forEach((u) => (st.ns[u] = "w")); st.cnt = { v: 0, e: 0 };
    const ordine = st.fin.slice().reverse();
    foto(`<b>Fase 3</b>: visito G<sup>T</sup> prendendo i vertici in ordine <b>decrescente di f</b>: ${ordine.join(", ")}. È la lista dei tempi di fine letta dalla fine.`);
    let k = 0;
    function visita2(u) {
      st.comp[u] = k; st.ns[u] = "c"; st.call.push(u); st.cur = u; st.ce = null; st.cnt.v++; st.usati[u] = true;
      foto(`${u} entra nella componente <b>C${k}</b>: lo scrivo nella mappa.`, [{ da: "fin", a: "mappa", id: u }]);
      for (const w of adjT[u]) {
        const ei = idx(w, u); st.ce = ei; st.cur = u; st.cnt.e++;
        if (st.comp[w] == null) {
          st.es[ei] = "a-albero";
          foto(`In G<sup>T</sup> esamino <b>${u} → ${w}</b> (in G era ${w} → ${u}): ${w} non ha ancora una componente, lo visito.`);
          visita2(w); st.cur = u;
        } else {
          st.es[ei] = "a-visto";
          foto(`In G<sup>T</sup> esamino <b>${u} → ${w}</b>: ${w} ha già una componente (C${st.comp[w]}). Lo salto.`);
        }
      }
      st.call.pop();
    }
    for (const u of ordine) {
      if (st.comp[u] != null) { st.cur = u; st.ce = null; foto(`Prossimo nella lista: <b>${u}</b>. Ha già una componente (C${st.comp[u]}), lo salto.`); continue; }
      st.riga = 3; st.cur = u; st.ce = null;
      foto(`Prossimo nella lista: <b>${u}</b>, senza componente. Inizia un nuovo albero: sarà la componente C${k}.`);
      visita2(u);
      const mem = G.ordine.filter((x) => st.comp[x] === k);
      st.riga = 4; st.cur = null; st.ce = null;
      foto(`L'albero partito da ${u} è finito: <b>C${k} = {${mem.join(", ")}}</b>. In G<sup>T</sup> la visita non poteva uscire da questa componente: gli archi verso le altre componenti ancora bianche, in G<sup>T</sup>, non esistono.`);
      k++;
    }
    st.fase = 4; st.cur = null;
    foto(`<b>Fatto: ${k} componenti.</b> Ogni vertice ha un indice e due vertici hanno lo stesso indice solo se stanno nella stessa SCC. Le due visite hanno esaminato ognuna ${G.n} vertici e ${m} archi: in totale Θ(n + m).`);
    return passi;
  }

  function genTarjan(G) {
    prepara(G);
    const passi = [], m = G.archi.length;
    const st = { alg: "t", ns: {}, d: {}, low: {}, comp: {}, es: {}, cur: null, ce: null, call: [], S: [], cnt: { v: 0, e: 0 }, riga: 1 };
    G.ordine.forEach((u) => (st.ns[u] = "w"));
    const foto = (msg, voli) => passi.push(Object.assign(copia(st), { msg, voli: voli || [] }));
    const adj = adiacenza(G.ordine, G.archi, false);
    const idx = (u, v) => G.archi.findIndex(([a, b]) => a === u && b === v);
    let t = 0, k = 0;
    foto(`Tutti i vertici sono bianchi. Tarjan fa <b>una sola</b> visita in profondità. Per ogni vertice tiene d (quando l'ho scoperto) e low (il d più piccolo che riesco a raggiungere da lì), più una pila S dei vertici visitati che non hanno ancora una componente.`);
    function visita(u) {
      t++; st.d[u] = t; st.low[u] = t; st.ns[u] = "g"; st.call.push(u); st.S.push(u); st.cur = u; st.ce = null; st.cnt.v++; st.riga = 2;
      foto(`Scopro <b>${u}</b>: d[${u}] = low[${u}] = ${t}. Entra nella pila delle chiamate e nella pila S.`, [{ da: "nodo", a: "S", id: u }]);
      for (const w of adj[u]) {
        const ei = idx(u, w); st.ce = ei; st.cur = u; st.cnt.e++;
        if (st.d[w] == null) {
          st.es[ei] = "a-albero"; st.riga = 4;
          foto(`Esamino <b>${u} → ${w}</b>: ${w} non è ancora visitato. Scendo in ${w}.`);
          visita(w);
          st.cur = u; st.ce = ei; st.riga = 4;
          const vecchio = st.low[u]; st.low[u] = Math.min(st.low[u], st.low[w]);
          foto(`Torno in <b>${u}</b> da ${w}: low[${u}] = min(${vecchio}, low[${w}] = ${st.low[w]}) = <b>${st.low[u]}</b>.`);
        } else if (st.S.includes(w)) {
          st.es[ei] = "a-indietro"; st.riga = 5;
          const vecchio = st.low[u]; st.low[u] = Math.min(st.low[u], st.d[w]);
          foto(`Esamino <b>${u} → ${w}</b>: ${w} è ancora nella pila S, quindi sta nella stessa componente di ${u}. low[${u}] = min(${vecchio}, d[${w}] = ${st.d[w]}) = <b>${st.low[u]}</b>.`);
        } else {
          st.es[ei] = "a-visto"; st.riga = 5;
          foto(`Esamino <b>${u} → ${w}</b>: ${w} ha già una componente chiusa (C${st.comp[w]}). Lo ignoro.`);
        }
      }
      st.ce = null; st.call.pop(); st.cur = u;
      if (st.low[u] === st.d[u]) {
        const mem = []; let w;
        do { w = st.S.pop(); st.comp[w] = k; st.ns[w] = "c"; mem.push(w); } while (w !== u);
        st.riga = 7;
        foto(`Visita di ${u} finita con low[${u}] = d[${u}] = ${st.d[u]}: ${u} è la <b>radice</b> della sua componente. Estraggo da S fino a ${u}: <b>C${k} = {${mem.join(", ")}}</b>.`, mem.map((x) => ({ da: "S", a: "mappa", id: x })));
        k++;
      } else {
        st.ns[u] = "s"; st.riga = 6;
        foto(`Visita di ${u} finita con low[${u}] = ${st.low[u]} < d[${u}] = ${st.d[u]}: da ${u} si risale a un vertice scoperto prima. ${u} <b>resta in S</b>, la sua componente si chiuderà più in alto.`);
      }
    }
    for (const u of G.ordine) if (st.d[u] == null) { st.riga = 1; visita(u); }
    st.cur = null; st.riga = 0;
    foto(`<b>Fatto: ${k} componenti</b> con una sola visita: ${G.n} vertici e ${m} archi esaminati una volta, Θ(n + m). Gli indici escono in un ordine diverso da Kosaraju e dalla Tabella 1, ma la mappa è valida lo stesso: conta solo che stessa SCC ⇔ stesso indice.`);
    return passi;
  }

  const PSEUDO = {
    k: `<li class="titolo">Kosaraju(G)</li>
        <li data-r="1">esegui <span class="sc">Dfs</span>(G) e calcola il tempo di fine <i>f</i>[<i>u</i>] di ogni vertice</li>
        <li data-r="2">costruisci G<sup>T</sup>, cioè G con tutti gli archi invertiti</li>
        <li data-r="3">esegui <span class="sc">Dfs</span>(G<sup>T</sup>) prendendo i vertici in ordine decrescente di <i>f</i>[<i>u</i>]</li>
        <li data-r="4">ogni albero della seconda visita è una SCC: dai lo stesso indice ai suoi vertici</li>`,
    t: `<li class="titolo">Tarjan(G)</li>
        <li data-r="1"><b>per ogni</b> <i>u</i> ∈ V <b>se</b> <i>d</i>[<i>u</i>] non è definito <b>allora</b> <span class="sc">Visita</span>(<i>u</i>)</li>
        <li class="titolo">Visita(u)</li>
        <li data-r="2"><i>d</i>[<i>u</i>] = <i>low</i>[<i>u</i>] = <i>t</i>; <i>t</i> = <i>t</i> + 1; metti <i>u</i> su S</li>
        <li data-r="3"><b>per ogni</b> arco <i>u</i> → <i>w</i></li>
        <li data-r="4" class="rientro1"><b>se</b> <i>d</i>[<i>w</i>] non è definito: <span class="sc">Visita</span>(<i>w</i>); <i>low</i>[<i>u</i>] = min(<i>low</i>[<i>u</i>], <i>low</i>[<i>w</i>])</li>
        <li data-r="5" class="rientro1"><b>altrimenti se</b> <i>w</i> è su S: <i>low</i>[<i>u</i>] = min(<i>low</i>[<i>u</i>], <i>d</i>[<i>w</i>])</li>
        <li data-r="6"><b>se</b> <i>low</i>[<i>u</i>] = <i>d</i>[<i>u</i>]</li>
        <li data-r="7" class="rientro1">estrai da S fino a <i>u</i> compreso: è una nuova SCC</li>`
  };

  function simulatore(box) {
    let alg = box.dataset.alg || "k", gid = box.dataset.grafo || "A", passi = [], vista = null, player = null;
    box.innerHTML = `
      <div class="fig-ctrl">
        <div class="seg" role="group" aria-label="Algoritmo">
          <button type="button" data-alg="k">Kosaraju</button><button type="button" data-alg="t">Tarjan</button>
        </div>
        <div class="seg" role="group" aria-label="Grafo">
          <button type="button" data-g="A">Esempio del PDF</button><button type="button" data-g="B">Grafo B</button>
        </div>
      </div>
      <div class="sim-corpo">
        <div class="sim-sx">
          <svg aria-label="Grafo del simulatore"></svg>
          <div class="legenda"></div>
          <div class="msg" aria-live="polite"></div>
          <div class="pl"></div>
          <div class="contatori"></div>
        </div>
        <div class="sim-dx">
          <ol class="pseudo"></ol>
          <div class="corsie"></div>
        </div>
      </div>`;
    const pl = $(".pl", box), msg = $(".msg", box), pseudo = $(".pseudo", box), corsie = $(".corsie", box), contatori = $(".contatori", box);
    function monta() {
      const G = prepara(GRAFI[gid]);
      $$("[data-alg]", box).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.alg === alg)));
      $$("[data-g]", box).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.g === gid)));
      vista = new Vista($("svg", box), G);
      passi = alg === "k" ? genKosaraju(G) : genTarjan(G);
      pseudo.innerHTML = PSEUDO[alg];
      $(".legenda", box).innerHTML = alg === "k"
        ? `<span><i class="l-bianco"></i>bianco: non scoperto</span><span><i class="l-grigio"></i>grigio: sulla pila delle chiamate</span><span><i class="l-nero"></i>nero: finito</span><span><i class="l-linea"></i>arco dell'albero</span><span><i class="l-trat"></i>arco all'indietro</span>`
        : `<span><i class="l-bianco"></i>non visitato</span><span><i class="l-grigio"></i>sulla pila delle chiamate</span><span><i class="l-pila"></i>finito, ancora in S</span><span><i class="l-linea"></i>arco dell'albero</span><span><i class="l-trat"></i>arco verso un vertice in S</span>`;
      corsie.innerHTML = `
        <div class="corsia"><span class="etichetta"><span>Pila delle chiamate</span><span>cima in alto</span></span><div class="fila pila" data-corsia="call"></div></div>
        ${alg === "k"
          ? `<div class="corsia"><span class="etichetta"><span>Lista dei tempi di fine</span><span>in ordine di f</span></span><div class="fila" data-corsia="fin"></div></div>`
          : `<div class="corsia"><span class="etichetta"><span>Pila S</span><span>cima a destra</span></span><div class="fila" data-corsia="S"></div></div>`}
        <div class="corsia"><span class="etichetta"><span>Map&lt;Vertex, Integer&gt; risultato</span></span><div class="mappa" data-corsia="mappa"></div></div>`;
      if (!player) player = Player(pl, { passi: passi.length, render, radice: box, intervallo: 1500 });
      else player.nuovo(passi.length);
      render(0, false);
    }
    box.addEventListener("click", (e) => {
      const a = e.target.closest("button[data-alg]"), g = e.target.closest("button[data-g]");
      if (a && a.dataset.alg !== alg) { alg = a.dataset.alg; monta(); }
      if (g && g.dataset.g !== gid) { gid = g.dataset.g; monta(); }
    });
    function render(i, avanti) {
      const G = GRAFI[gid], s = passi[i];
      // posizioni di partenza dei voli, prese prima di ridisegnare
      const partenze = avanti ? (s.voli || []).map((v) => {
        const sorgente = v.da === "nodo" ? vista.nodi[v.id].c : $(`[data-corsia="${v.da}"] [data-id="${v.id}"]`, box);
        return sorgente ? sorgente.getBoundingClientRect() : null;
      }) : [];
      // grafo
      if (alg === "k") vista.inverti(!!s.inv);
      G.ordine.forEach((u) => {
        let cls = "", comp = null, ann = "";
        if (alg === "k") {
          if (s.fase <= 2) { cls = { w: "", g: "s-grigio", b: "s-nero" }[s.ns[u]]; ann = s.d[u] ? `${s.d[u]}/${s.f[u] || "–"}` : ""; }
          else { comp = s.comp[u]; ann = `f=${s.f[u]}` + (s.comp[u] != null ? ` · C${s.comp[u]}` : ""); }
        } else {
          cls = { w: "", g: "s-grigio", s: "s-pila", c: "" }[s.ns[u]];
          comp = s.ns[u] === "c" ? s.comp[u] : null;
          ann = s.d[u] ? `${s.d[u]} · low ${s.low[u]}` : "";
        }
        if (s.cur === u) cls += " corrente";
        vista.nodo(u, cls, comp, ann);
      });
      vista.el.forEach((e, j) => vista.arco(j, (s.es[j] || "") + (s.ce === j ? " a-corrente" : "")));
      // pseudocodice
      $$("li[data-r]", pseudo).forEach((li) => li.classList.toggle("attiva", +li.dataset.r === s.riga));
      msg.innerHTML = s.msg;
      // strutture dati
      const cima = s.call[s.call.length - 1];
      $('[data-corsia="call"]', box).innerHTML = s.call.length
        ? s.call.slice().reverse().map((u) => `<span class="chip${u === cima ? " cima" : ""}" data-id="${u}">${alg === "k" && s.fase === 3 ? "DFS-VISIT<sup>T</sup>" : alg === "k" ? "DFS-VISIT" : "VISITA"}(${u})</span>`).join("")
        : '<span class="vuoto">vuota</span>';
      if (alg === "k") {
        $('[data-corsia="fin"]', box).innerHTML = s.fin.length
          ? s.fin.map((u) => `<span class="chip${s.usati[u] ? " usato" : ""}" data-id="${u}">${u}<small>f=${s.f[u]}</small></span>`).join("")
          : '<span class="vuoto">vuota</span>';
      } else {
        $('[data-corsia="S"]', box).innerHTML = s.S.length
          ? s.S.map((u) => `<span class="chip" data-id="${u}">${u}<small>low ${s.low[u]}</small></span>`).join("")
          : '<span class="vuoto">vuota</span>';
      }
      $('[data-corsia="mappa"]', box).innerHTML = G.ordine.map((u) =>
        `<div class="cella" data-id="${u}"${s.comp[u] != null ? ` data-c="${s.comp[u] % 6}"` : ""}><span class="k">${u}</span><span class="v">${s.comp[u] != null ? s.comp[u] : "—"}</span></div>`).join("");
      // contatori: il cuore dell'analisi Θ(n + m)
      const fase = alg === "k" ? (s.fase === 1 ? "Fase 1 · DFS su G" : s.fase === 2 ? "Fase 2 · trasposto" : s.fase === 3 ? "Fase 3 · DFS su Gᵀ" : "Fine") : "Unica visita";
      contatori.innerHTML = `<span>${fase}</span><span>vertici visitati <b>${s.cnt.v}/${G.n}</b></span><span>archi esaminati <b>${s.cnt.e}/${G.archi.length}</b></span>`;
      // voli
      if (avanti) (s.voli || []).forEach((v, j) => {
        const arrivo = $(`[data-corsia="${v.a}"] [data-id="${v.id}"]`, box);
        if (partenze[j] && arrivo) fly(partenze[j], arrivo, v.id, j * 140);
      });
    }
    monta();
  }

  /* ===================================================================
     4) Costruzione del grafo trasposto, arco per arco
     =================================================================== */
  function trasposto(box) {
    const G = prepara(GRAFI.A);
    const codice = $(box.dataset.codice);
    box.innerHTML = `
      <div class="sim-corpo">
        <div class="sim-sx">
          <svg aria-label="Il grafo mentre gli archi vengono girati"></svg>
          <div class="msg" aria-live="polite"></div>
          <div class="pl"></div>
          <div class="contatori"></div>
        </div>
        <div class="sim-dx">
          <div class="corsia"><span class="etichetta"><span>G · graph.outEdges(v)</span><span>destinazioni</span></span>
            <div class="liste-g" style="display:grid;gap:4px"></div></div>
          <div class="corsia"><span class="etichetta"><span>Gᵀ · trasposto.get(v)</span><span>HashMap di liste</span></span>
            <div class="liste-t" style="display:grid;gap:4px"></div></div>
        </div>
      </div>`;
    const vista = new Vista($("svg", box), G);
    const adj = adiacenza(G.ordine, G.archi, false);
    const passi = [];
    const st = { creati: [], lt: {}, fatti: [], cur: null, put: 0, add: 0, riga: 0, evG: null };
    const foto = (msg, volo) => passi.push(Object.assign(copia(st), { msg, volo }));
    foto(`G ha ${G.n} vertici e ${G.archi.length} archi. La libreria dà solo gli archi <i>uscenti</i> (outEdges), quindi G<sup>T</sup> va costruito a mano.`);
    G.ordine.forEach((v) => {
      st.creati.push(v); st.lt[v] = []; st.put++; st.riga = 2;
      foto(`<code>trasposto.put(${v}, new ArrayList&lt;&gt;())</code>: lista vuota per ${v}. Costa O(1) in media.`);
    });
    G.ordine.forEach((v) => adj[v].forEach((w) => {
      st.lt[w].push(v); st.fatti.push(chiave(v, w)); st.cur = chiave(v, w); st.add++; st.riga = 5; st.evG = chiave(v, w);
      foto(`Arco <b>${v} → ${w}</b> di G: aggiungo <b>${v}</b> alla lista di <b>${w}</b>. Ora in G<sup>T</sup> c'è l'arco ${w} → ${v}.`, { da: chiave(v, w), a: w, id: v });
    }));
    st.cur = null; st.riga = 0; st.evG = null;
    foto(`Fatto: ${st.put} put + ${st.add} add, ognuna O(1) in media. Il costo è <b>Θ(n + m)</b>: n per le liste vuote, m per gli archi.`);

    function render(i, avanti) {
      const s = passi[i];
      const da = avanti && s.volo ? $(`.liste-g [data-k="${s.volo.da}"]`, box) : null;
      const rDa = da ? da.getBoundingClientRect() : null;
      vista.el.forEach((e, j) => {
        const k = chiave(e.u, e.v), fatto = s.fatti.includes(k);
        vista.disegna(e, fatto);
        vista.arco(j, (fatto ? "a-fatto" : "") + (s.cur === k ? " a-corrente" : ""));
      });
      G.ordine.forEach((u) => vista.nodo(u, "", null, ""));
      $(".liste-g", box).innerHTML = G.ordine.map((v) =>
        `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="chip" style="min-width:2.2em;justify-content:center">${v}</span><span style="color:var(--ink-3)">→</span>${adj[v].map((w) => `<span class="chip${s.evG === chiave(v, w) ? " cima" : ""}${s.fatti.includes(chiave(v, w)) ? " usato" : ""}" data-k="${chiave(v, w)}">${w}</span>`).join("")}</div>`).join("");
      $(".liste-t", box).innerHTML = G.ordine.map((v) => {
        if (!s.creati.includes(v)) return `<div style="display:flex;gap:6px;align-items:center"><span class="chip usato" style="min-width:2.2em;justify-content:center">${v}</span><span class="vuoto" style="color:var(--ink-3);font-style:italic">non ancora nella mappa</span></div>`;
        return `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap" data-riga="${v}"><span class="chip" style="min-width:2.2em;justify-content:center">${v}</span><span style="color:var(--ink-3)">→</span>${s.lt[v].length ? s.lt[v].map((x, j) => `<span class="chip" data-id="${v}-${x}" data-c="0">${x}</span>`).join("") : '<span style="color:var(--ink-3);font-style:italic">[ ]</span>'}</div>`;
      }).join("");
      $(".msg", box).innerHTML = s.msg;
      $(".contatori", box).innerHTML = `<span>put <b>${s.put}/${G.n}</b></span><span>add <b>${s.add}/${G.archi.length}</b></span><span>operazioni totali <b>${s.put + s.add}</b> = n + m</span>`;
      const attive = s.riga === 2 ? [1, 2] : s.riga === 5 ? [4, 5] : [];
      if (codice) $$(".riga", codice).forEach((r) => r.classList.toggle("attiva", attive.includes(+r.dataset.l)));
      if (avanti && s.volo && rDa) {
        const a = $(`.liste-t [data-id="${s.volo.a}-${s.volo.id}"]`, box);
        if (a) fly(rDa, a, s.volo.id);
      }
    }
    Player($(".pl", box), { passi: passi.length, render, radice: box, intervallo: 1300 });
    render(0, false);
  }

  /* ===================================================================
     5) DFS iterativa con pila esplicita (§5)
     =================================================================== */
  function dfsIterativa(box) {
    const G = prepara(GRAFI.A);
    const codice = $(box.dataset.codice);
    box.innerHTML = `
      <div class="sim-corpo">
        <div class="sim-sx">
          <svg aria-label="Grafo visitato con la pila esplicita"></svg>
          <div class="msg" aria-live="polite"></div>
          <div class="pl"></div>
        </div>
        <div class="sim-dx">
          <div class="corsia"><span class="etichetta"><span>pilaV + pilaIt (ArrayDeque)</span><span>cima in alto</span></span><div class="fila pila" data-corsia="pila"></div></div>
          <div class="corsia"><span class="etichetta"><span>visitati (HashSet)</span></span><div class="fila" data-corsia="vis"></div></div>
          <div class="corsia"><span class="etichetta"><span>ordineFine (ArrayList)</span></span><div class="fila" data-corsia="fine"></div></div>
        </div>
      </div>`;
    const vista = new Vista($("svg", box), G);
    const adj = adiacenza(G.ordine, G.archi, false);
    const idx = (u, v) => G.archi.findIndex(([a, b]) => a === u && b === v);
    const passi = [];
    const st = { pila: [], vis: [], fine: [], righe: [], cur: null, ce: null, es: {} };
    const foto = (msg, righe, volo) => passi.push(Object.assign(copia(st), { msg, righe, volo }));
    foto(`La pila esplicita sostituisce la ricorsione: ogni elemento è un vertice insieme al suo iteratore sugli archi uscenti, cioè il punto in cui la chiamata ricorsiva si era fermata.`, []);
    for (const s of G.ordine) {
      st.cur = s; st.ce = null;
      if (st.vis.includes(s)) { foto(`Ciclo esterno, s = <b>${s}</b>: è già in visitati, <code>continue</code>.`, [1, 2]); continue; }
      st.vis.push(s); st.pila.push({ v: s, it: 0 });
      foto(`s = <b>${s}</b> non è visitato: lo aggiungo a visitati e faccio push di ${s} con un iteratore nuovo su outEdges(${s}).`, [1, 2, 3, 4, 5], { da: "nodo", a: "pila", id: s });
      while (st.pila.length) {
        const top = st.pila[st.pila.length - 1];
        st.cur = top.v;
        if (top.it < adj[top.v].length) {
          const w = adj[top.v][top.it]; top.it++;
          const ei = idx(top.v, w); st.ce = ei;
          if (!st.vis.includes(w)) {
            st.es[ei] = "a-albero"; st.vis.push(w); st.pila.push({ v: w, it: 0 });
            foto(`In cima c'è ${top.v}: <code>it.next()</code> dà l'arco <b>${top.v} → ${w}</b>. ${w} non è visitato: add e push. È la «chiamata ricorsiva» su ${w}.`, [7, 8, 9, 10, 11, 12, 13], { da: "nodo", a: "pila", id: w });
          } else {
            if (!st.es[ei]) st.es[ei] = "a-visto";
            foto(`In cima c'è ${top.v}: <code>it.next()</code> dà l'arco <b>${top.v} → ${w}</b>. ${w} è già in visitati: non faccio niente.`, [7, 8, 9, 10]);
          }
        } else {
          st.pila.pop(); st.fine.push(top.v); st.ce = null;
          foto(`L'iteratore di <b>${top.v}</b> non ha altri archi: pop di ${top.v}, che finisce in ordineFine. È il «return» della chiamata ricorsiva.`, [7, 8, 15, 16, 17], { da: "pila", a: "fine", id: top.v });
        }
      }
    }
    st.cur = null; st.ce = null;
    foto(`Fine della fase 1: ordineFine = [${st.fine.join(", ")}]. È lo stesso ordine della versione ricorsiva, ma la pila sta nello heap e non nello stack del thread: niente StackOverflowError.`, []);

    function render(i, avanti) {
      const s = passi[i];
      let rDa = null;
      if (avanti && s.volo) {
        const el = s.volo.da === "nodo" ? vista.nodi[s.volo.id].c : $(`[data-corsia="${s.volo.da}"] [data-id="${s.volo.id}"]`, box);
        rDa = el ? el.getBoundingClientRect() : null;
      }
      G.ordine.forEach((u) => {
        const inPila = s.pila.some((f) => f.v === u), finito = s.fine.includes(u);
        vista.nodo(u, (finito ? "s-nero" : inPila ? "s-grigio" : "") + (s.cur === u ? " corrente" : ""), null, "");
      });
      vista.el.forEach((e, j) => vista.arco(j, (s.es[j] || "") + (s.ce === j ? " a-corrente" : "")));
      $(".msg", box).innerHTML = s.msg;
      $('[data-corsia="pila"]', box).innerHTML = s.pila.length ? s.pila.slice().reverse().map((f, j) =>
        `<span class="chip${j === 0 ? " cima" : ""}" data-id="${f.v}">${f.v}<small>archi: ${adj[f.v].map((w, q) => (q < f.it ? `<s>${f.v}→${w}</s>` : `${f.v}→${w}`)).join(" ") || "nessuno"}</small></span>`).join("") : '<span class="vuoto">vuota</span>';
      $('[data-corsia="vis"]', box).innerHTML = s.vis.length ? s.vis.map((u) => `<span class="chip" data-id="${u}">${u}</span>`).join("") : '<span class="vuoto">vuoto</span>';
      $('[data-corsia="fine"]', box).innerHTML = s.fine.length ? s.fine.map((u) => `<span class="chip" data-id="${u}">${u}</span>`).join("") : '<span class="vuoto">vuota</span>';
      if (codice) $$(".riga", codice).forEach((r) => r.classList.toggle("attiva", s.righe.includes(+r.dataset.l)));
      if (avanti && s.volo && rDa) {
        const a = $(`[data-corsia="${s.volo.a}"] [data-id="${s.volo.id}"]`, box);
        if (a) fly(rDa, a, s.volo.id);
      }
    }
    Player($(".pl", box), { passi: passi.length, render, radice: box, intervallo: 1300 });
    render(0, false);
  }

  /* ===================================================================
     6) Conteggio aggregato: Σ δ(v) = m
     =================================================================== */
  function contaArchi(box) {
    const G = prepara(GRAFI.A);
    box.innerHTML = `<div class="sim-corpo">
        <div class="sim-sx"><svg aria-label="Archi uscenti di ogni vertice"></svg><div class="pl"></div></div>
        <div class="sim-dx"><div class="tab-wrap"><table class="tab"><thead><tr><th>v</th><th class="num">δ(v)</th><th class="num">archi esaminati finora</th></tr></thead><tbody></tbody></table></div>
        <div class="msg" aria-live="polite"></div></div></div>`;
    const vista = new Vista($("svg", box), G);
    const adj = adiacenza(G.ordine, G.archi, false);
    const tot = G.ordine.length + 1;
    function render(i) {
      const fatti = G.ordine.slice(0, i);
      let somma = 0;
      $("tbody", box).innerHTML = G.ordine.map((v, j) => {
        const vis = j < i;
        if (vis) somma += adj[v].length;
        return `<tr style="${vis ? "" : "opacity:.4"}"><td><code>${v}</code></td><td class="num">${vis ? adj[v].length : "·"}</td><td class="num">${vis ? somma : "·"}</td></tr>`;
      }).join("");
      const cur = G.ordine[i - 1];
      G.ordine.forEach((u) => vista.nodo(u, (fatti.includes(u) ? "s-nero" : "") + (u === cur ? " corrente" : ""), null, fatti.includes(u) ? `δ=${adj[u].length}` : ""));
      vista.el.forEach((e, j) => vista.arco(j, fatti.includes(e.u) ? (e.u === cur ? "a-albero a-corrente" : "a-albero") : ""));
      $(".msg", box).innerHTML = i === 0
        ? `Il ciclo esterno gira su ${G.n} vertici, quello interno sugli archi uscenti. Moltiplicare n per il grado massimo sovrastima: conta invece quanti archi vengono toccati <i>in tutto</i>.`
        : i < tot - 1 ? `Vertice <b>${cur}</b>: il ciclo interno gira δ(${cur}) = ${adj[cur].length} volte. Totale finora: ${somma}.`
        : `Ogni arco ha esattamente un vertice di partenza, quindi Σ δ(v) = m = <b>${somma}</b>. Il doppio ciclo costa Θ(n + m), non Θ(n · m).`;
    }
    Player($(".pl", box), { passi: tot, render, radice: box, intervallo: 1100 });
    render(0);
  }

  /* ===================================================================
     7) Widget della complessità: triangolo, dimezzamento, albero ricorsione
     =================================================================== */
  function triangolo(box) {
    box.innerHTML = `<div class="fig-ctrl"><label for="tri-n" class="etichetta">n</label>
        <input type="range" id="tri-n" min="3" max="10" value="6" style="accent-color:var(--pen)"><b class="num tri-nv">6</b>
        <span class="sep"></span><button class="btn primario" type="button" data-a="anima">Anima il conteggio</button><button class="btn" type="button" data-a="tutto">Mostra tutto</button></div>
      <div style="overflow-x:auto"><div class="quadretti"></div></div>
      <div class="msg" aria-live="polite"></div>`;
    const r = $("#tri-n", box), q = $(".quadretti", box), msg = $(".msg", box);
    let timer = null;
    function griglia(n) {
      q.style.gridTemplateColumns = `2.2em repeat(${n}, 26px) 5.5em`;
      let h = `<span class="q lab"></span>` + Array.from({ length: n }, (_, j) => `<span class="q lab" style="color:var(--ink-3)">j=${j}</span>`).join("") + `<span class="q lab"></span>`;
      for (let i = 0; i < n; i++) {
        h += `<span class="q lab" style="color:var(--ink-3)">i=${i}</span>`;
        for (let j = 0; j < n; j++) h += `<span class="q${j >= i ? " conta" : ""}" data-i="${i}" data-j="${j}"></span>`;
        h += `<span class="q lab riga-tot" data-i="${i}" style="text-align:left;color:var(--ink-2);width:auto"></span>`;
      }
      q.innerHTML = h;
      msg.innerHTML = `Le celle con il bordo colorato sono le coppie (i, j) con j ≥ i: sono quelle che il ciclo interno visita. Premi «Anima» per vederle contare una a una.`;
    }
    function ferma() { if (timer) clearInterval(timer); timer = null; }
    function anima(subito) {
      ferma();
      const n = +r.value, celle = $$(".q.conta", q);
      celle.forEach((c) => { c.classList.remove("pieno"); c.textContent = ""; });
      $$(".riga-tot", q).forEach((x) => (x.textContent = ""));
      let k = 0;
      const passo = () => {
        if (k >= celle.length) {
          ferma();
          msg.innerHTML = `conta = ${celle.length} = n(n+1)/2 = ${n}·${n + 1}/2. Il quadrato ha n² = ${n * n} celle: ne abbiamo contate poco più della metà. Una costante (1/2) non cambia la crescita: <b>Θ(n²)</b>.`;
          return;
        }
        const c = celle[k++]; c.classList.add("pieno"); c.textContent = k;
        const i = +c.dataset.i;
        const tot = $$(`.q.conta.pieno[data-i="${i}"]`, q).length;
        $(`.riga-tot[data-i="${i}"]`, q).textContent = `${tot} volte`;
        msg.innerHTML = `i = ${i}, j = ${c.dataset.j}: <code>conta++</code> → conta = <b>${k}</b>. La riga i fa n − i = ${n - i} iterazioni.`;
      };
      if (subito || window.Appunti.motoRidotto.matches) { while (k < celle.length) passo(); passo(); }
      else timer = setInterval(passo, Math.max(70, 2400 / celle.length));
    }
    r.addEventListener("input", () => { ferma(); $(".tri-nv", box).textContent = r.value; griglia(+r.value); });
    box.addEventListener("click", (e) => { const b = e.target.closest("[data-a]"); if (b) anima(b.dataset.a === "tutto"); });
    griglia(6);
  }

  function dimezza(box) {
    const valori = [16, 100, 1000, 1379917];
    box.innerHTML = `<div class="fig-ctrl"><span class="etichetta">n</span><div class="seg" role="group" aria-label="Valore di n">${valori.map((v, i) => `<button type="button" data-n="${v}" aria-pressed="${i === 3}">${fmt(v)}</button>`).join("")}</div>
        <span class="sep"></span><button class="btn primario" type="button" data-a="anima">Anima</button></div>
      <div class="barre"></div><div class="msg" aria-live="polite"></div>`;
    let n = 1379917, timer = null;
    const barre = $(".barre", box), msg = $(".msg", box);
    function ferma() { if (timer) clearInterval(timer); timer = null; }
    function anima() {
      ferma(); barre.innerHTML = "";
      let i = n, k = 0;
      const riga = (val, et) => { barre.insertAdjacentHTML("beforeend", `<div class="r"><span>${et}</span><span class="b" style="width:${Math.max(0.3, (val / n) * 100)}%"></span><span class="val">i = ${fmt(val)}</span></div>`); };
      riga(i, "inizio");
      const passo = () => {
        if (i <= 1) {
          ferma();
          msg.innerHTML = `Il ciclo si ferma dopo <b>${k} iterazioni</b> = ⌊log₂ ${fmt(n)}⌋. Raddoppiare n aggiunge <i>una sola</i> iterazione: <b>Θ(log n)</b>.${n === 1379917 ? " È il numero di vertici del grafo del Texas: 20 giri bastano." : ""}`;
          return;
        }
        i = Math.floor(i / 2); k++;
        riga(i, `giro ${k}`);
        msg.innerHTML = `Giro ${k}: i = i / 2 = ${fmt(i)}.`;
      };
      if (window.Appunti.motoRidotto.matches) { while (i > 1) passo(); passo(); }
      else timer = setInterval(passo, 380);
    }
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-n]");
      if (b) { n = +b.dataset.n; $$("[data-n]", box).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); anima(); }
      if (e.target.closest('[data-a="anima"]')) anima();
    });
    msg.innerHTML = "Ogni giro dimezza i. Premi «Anima» per vedere quante volte si può dimezzare n prima di arrivare a 1.";
  }

  function alberoRicorsione(box) {
    box.innerHTML = `<div class="fig-ctrl"><span class="etichetta">n</span><div class="seg" role="group" aria-label="Valore di n">${[8, 16, 32].map((v) => `<button type="button" data-n="${v}" aria-pressed="${v === 16}">${v}</button>`).join("")}</div>
        <span class="sep"></span><button class="btn primario" type="button" data-a="avanti">Scendi di un livello</button><button class="btn" type="button" data-a="tutto">Tutto l'albero</button></div>
      <div class="albero-ric"></div><div class="msg" aria-live="polite"></div>`;
    let n = 16, liv = 0;
    const box2 = $(".albero-ric", box), msg = $(".msg", box);
    const L = () => Math.log2(n) + 1;
    function disegna() {
      let h = "";
      for (let k = 0; k < liv; k++) {
        const quanti = 2 ** k, size = n / quanti;
        h += `<div class="livello"><div class="blocchi">${Array.from({ length: quanti }, () => `<span class="blocco" style="flex:1 1 0">${quanti <= 16 ? size : ""}</span>`).join("")}</div><span class="somma">${quanti} × ${size} = <b>${n}</b></span></div>`;
      }
      box2.innerHTML = h;
      if (liv === 0) msg.innerHTML = `Ogni chiamata su un problema di taglia k fa k operazioni (per esempio la fusione di Merge Sort) e poi chiama se stessa su due metà. Scendi un livello alla volta.`;
      else if (liv < L()) msg.innerHTML = `Livello ${liv - 1}: ${2 ** (liv - 1)} sottoproblemi di taglia ${n / 2 ** (liv - 1)}. Il lavoro del livello è sempre <b>${n}</b>.`;
      else msg.innerHTML = `${L()} livelli (log₂ ${n} + 1), ognuno con lavoro ${n}: totale ${n} · ${L()} = ${n * L()}. <b>T(n) = Θ(n log n)</b>.`;
      $('[data-a="avanti"]', box).disabled = liv >= L();
    }
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-n]");
      if (b) { n = +b.dataset.n; liv = 0; $$("[data-n]", box).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }
      const a = e.target.closest("[data-a]");
      if (a && a.dataset.a === "avanti") liv = Math.min(L(), liv + 1);
      if (a && a.dataset.a === "tutto") liv = L();
      disegna();
    });
    disegna();
  }

  /* ===================================================================
     8) Calcolatore dei costi sul grafo del Texas (§7)
     =================================================================== */
  function costi(box) {
    const n = 1379917, m = 3843320;
    const SCELTE = [
      { id: "vis", titolo: "Come segni i vertici visitati", op: [
        { t: "HashSet / HashMap: contains in O(1) medio", c: 0 },
        { t: "ArrayList con contains: scorre la lista, O(n)", c: n * m, f: "n · m" }] },
      { id: "ver", titolo: "Come prendi l'elenco dei vertici", op: [
        { t: "graph.vertexes() una volta, salvato in una variabile", c: 0 },
        { t: "graph.vertexes().get(i) dentro il ciclo", c: n * n, f: "n²" }] },
      { id: "tra", titolo: "Come costruisci il trasposto", op: [
        { t: "una passata sugli archi con outEdges", c: 0 },
        { t: "areAdjacent(w, u) su tutte le coppie", c: n * m, f: "n · m" }] }
    ];
    box.innerHTML = `<div class="sim-corpo">
        <div class="scelte">${SCELTE.map((s) => `<fieldset><legend>${s.titolo}</legend>${s.op.map((o, j) =>
          `<label><input type="radio" name="costo-${s.id}" id="costo-${s.id}-${j}" value="${j}"${j === 0 ? " checked" : ""}><span>${o.t}</span></label>`).join("")}</fieldset>`).join("")}</div>
        <div class="grafico-costi"><svg aria-label="Operazioni stimate, scala logaritmica"></svg>
          <div class="msg" aria-live="polite"></div></div></div>`;
    const svg = $("svg", box), msg = $(".msg", box);
    const base = 3 * (n + m);
    const sci = (x) => { const e = Math.floor(Math.log10(x)); const mnt = x / 10 ** e; return `${mnt.toFixed(1).replace(".", ",")}·10${String(e).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]).join("")}`; };
    const tempo = (ops) => {
      const s = ops / 1e9;
      if (s < 1) return "meno di un secondo";
      if (s < 120) return `${Math.round(s)} secondi`;
      if (s < 7200) return `circa ${Math.round(s / 60)} minuti`;
      if (s < 172800) return `circa ${Math.round(s / 3600)} ore`;
      return `circa ${Math.round(s / 86400)} giorni`;
    };
    function calcola() {
      let ops = base; const formule = ["3(n + m)"];
      SCELTE.forEach((s) => { const j = +$(`input[name="costo-${s.id}"]:checked`, box).value; const o = s.op[j]; if (o.c) { ops += o.c; formule.push(o.f); } });
      const peggio = base + SCELTE.reduce((a, s) => a + s.op[1].c, 0);
      const righe = [["Tutto efficiente", base, false], ["La tua versione", ops, true], ["Tutto inefficiente", peggio, false]];
      const W = 520, H = 150, x0 = 132, x1 = W - 128, lo = 6, hi = 14;
      const X = (v) => x0 + ((Math.log10(v) - lo) / (hi - lo)) * (x1 - x0);
      let g = `<line class="asse" x1="${x0}" y1="10" x2="${x0}" y2="${H - 24}"/>`;
      for (let e = lo; e <= hi; e += 2) g += `<line class="griglia" x1="${X(10 ** e)}" y1="10" x2="${X(10 ** e)}" y2="${H - 24}"/><text class="tick" x="${X(10 ** e)}" y="${H - 8}" text-anchor="middle">10${String(e).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]).join("")}</text>`;
      righe.forEach(([nome, v, tua], i) => {
        const y = 18 + i * 38, w = Math.max(3, X(v) - x0);
        g += `<text class="nome" x="${x0 - 10}" y="${y + 11}" text-anchor="end">${nome}</text>`;
        g += `<rect class="barra-c${tua ? " tua" : ""}" x="${x0}" y="${y}" width="${w}" height="16" rx="3"><title>${nome}: ${sci(v)} operazioni, ${tempo(v)}</title></rect>`;
        g += `<text class="valore" x="${x0 + w + 6}" y="${y + 12}">${sci(v)}</text>`;
      });
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.innerHTML = g;
      msg.innerHTML = `Operazioni stimate: <b>${formule.join(" + ")}</b> ≈ ${sci(ops)}. A un miliardo di operazioni semplici al secondo (stima ottimistica) fanno <b>${tempo(ops)}</b>${ops > base ? `, contro ${tempo(base)} della versione efficiente` : ""}. Scala logaritmica: ogni tacca è 100 volte la precedente.`;
    }
    box.addEventListener("change", calcola);
    calcola();
  }

  /* ------------------------------------------------------------- avvio */
  const WIDGET = { "esplora-scc": esploratore, "verifica-mappa": verificatore, "simulatore-scc": simulatore, "trasposto": trasposto, "dfs-iterativa": dfsIterativa, "conta-archi": contaArchi, "triangolo": triangolo, "dimezza": dimezza, "albero-ricorsione": alberoRicorsione, "costi": costi };
  $$("[data-widget]").forEach((el) => {
    const f = WIDGET[el.dataset.widget];
    if (!f) return;
    try { f(el); } catch (err) {
      console.error("Widget", el.dataset.widget, err);
      el.insertAdjacentHTML("beforeend", `<p class="avviso">Questo widget non è riuscito a partire: ${esc(err.message)}</p>`);
    }
  });
})();
