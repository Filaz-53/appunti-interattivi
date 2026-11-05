/* =====================================================================
   Algoritmi — simulatori dei capitoli 1–12
   Ogni widget si aggancia a un elemento con data-widget="nome".
   Dipende da assets/js/core.js (window.Appunti); gli stili sono in
   assets/css/base.css, sezione «Simulatori dei capitoli di Algoritmi».
   Gli strumenti comuni (array, alberi, grafi, player) stanno in cima;
   i widget sono raggruppati per capitolo.
   ===================================================================== */
(function () {
  "use strict";
  const { $, $$, Player, esc } = window.Appunti;
  const NS = "http://www.w3.org/2000/svg";
  const S = (tag, attrs, padre) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (padre) padre.appendChild(e);
    return e;
  };
  const fmt = (x) => (typeof x === "bigint" ? x.toLocaleString("it-IT") : Number(x).toLocaleString("it-IT"));
  const numeri = (s) => (String(s).match(/-?\d+/g) || []).map(Number);
  const casuali = (n, lo, hi) => Array.from({ length: n }, () => lo + Math.floor(Math.random() * (hi - lo + 1)));
  const apice = (s) => String(s).split("").map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"["0123456789".indexOf(c)] || (c === "-" ? "⁻" : c === "." ? "·" : c)).join("");

  /* --------------------------------------------------- vista di un array
     a: valori (null = cella vuota); o.cls[i]: classi della cella i;
     o.tag[i]: annotazione a penna sopra la cella; o.barre: barre in scala;
     o.base: indice della prima cella (1 come nello pseudocodice).        */
  function vistaArray(el, a, o = {}) {
    const nums = a.filter((v) => typeof v === "number");
    const max = o.max || Math.max(1, ...nums.map(Math.abs));
    el.classList.add("arr");
    el.classList.toggle("piccolo", !!o.piccolo);
    const base = o.base == null ? 1 : o.base;
    el.innerHTML = a.map((v, i) => {
      const cls = (o.cls && o.cls[i]) || "";
      const bar = o.barre ? `<span class="b" style="height:${typeof v === "number" ? Math.round(6 + (70 * Math.abs(v)) / max) : 0}px"></span>` : "";
      const tag = o.tag ? `<span class="t">${o.tag[i] || ""}</span>` : "";
      return `<div class="c ${cls}">${tag}${bar}<span class="v">${v == null ? "·" : esc(v)}</span><span class="i">${o.indici ? esc(o.indici[i]) : i + base}</span></div>`;
    }).join("");
  }

  /* ---------------------------------------------------- vista di un albero
     Nodo binario: { k, l, r, a, cls } (disposizione simmetrica, come un BST)
     Nodo generico: { k, f: [figli], a, cls } (disposizione per foglie)
     radici: un nodo o un array di nodi (foresta).                         */
  function vistaAlbero(svg, radici, o = {}) {
    const lista = (Array.isArray(radici) ? radici : [radici]).filter(Boolean);
    svg.setAttribute("class", "va");
    svg.innerHTML = "";
    if (!lista.length) {
      svg.setAttribute("viewBox", "0 0 320 60");
      S("text", { class: "vuoto", x: 160, y: 34 }, svg).textContent = o.vuoto || "albero vuoto";
      return;
    }
    const dx = o.dx || 46, dy = o.dy || 60, r = o.r || 17, pad = r + 18;
    const pos = new Map();
    let col = 0, prof = 0;
    const binario = (n) => n && (("l" in n) || ("r" in n));
    function simm(n, d) {
      if (!n) return;
      simm(n.l, d + 1);
      pos.set(n, { x: col++, d });
      prof = Math.max(prof, d);
      simm(n.r, d + 1);
    }
    function foglie(n, d) {
      prof = Math.max(prof, d);
      const f = (n.f || []).filter(Boolean);
      if (!f.length) { pos.set(n, { x: col++, d }); return; }
      f.forEach((c) => foglie(c, d + 1));
      const xs = f.map((c) => pos.get(c).x);
      pos.set(n, { x: (Math.min(...xs) + Math.max(...xs)) / 2, d });
    }
    lista.forEach((rad, j) => {
      if (j) col += o.spazio == null ? 0.6 : o.spazio;
      binario(rad) || o.binario ? simm(rad, 0) : foglie(rad, 0);
    });
    const W = Math.max((col - 1) * dx, 0) + 2 * pad, H = prof * dy + 2 * pad + (o.extraH || 0);
    svg.setAttribute("viewBox", `0 0 ${Math.max(W, o.minW || 0)} ${H}`);
    const sh = Math.max(0, ((o.minW || 0) - W) / 2);
    const X = (p) => sh + pad + p.x * dx, Y = (p) => pad + p.d * dy;
    const gR = S("g", {}, svg), gN = S("g", {}, svg);
    pos.forEach((p, n) => {
      const figli = binario(n) ? [n.l, n.r] : n.f || [];
      figli.filter(Boolean).forEach((c) => {
        const q = pos.get(c);
        S("line", { class: "ramo" + (c.ramo ? " " + c.ramo : ""), x1: X(p), y1: Y(p), x2: X(q), y2: Y(q) }, gR);
      });
    });
    pos.forEach((p, n) => {
      const g = S("g", { class: "n " + (n.cls || "") }, gN);
      S("circle", { cx: X(p), cy: Y(p), r }, g);
      S("text", { class: "k", x: X(p), y: Y(p) }, g).textContent = n.k;
      if (n.a != null && n.a !== "") {
        const t = S("text", { class: "a" + (n.aSx ? " sx" : ""), x: n.aSx ? X(p) - r - 3 : X(p) + r + 3, y: Y(p) - r + 2 }, g);
        if (!n.aSx) t.setAttribute("style", "text-anchor:start");
        t.textContent = n.a;
      }
      if (o.click) {
        g.classList.add("cliccabile");
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", String(n.k));
        g.addEventListener("click", () => o.click(n));
        g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); o.click(n); } });
      }
    });
  }

  /* ----------------------------------------------------- vista di un grafo
     G = { vb: [w, h], nodi: [[id, x, y]], archi: [[u, v, peso?]] }
     o.orientato: frecce; o.pesi: etichette dei pesi sugli archi.          */
  class VistaGrafo {
    constructor(svg, G, o = {}) {
      this.svg = svg; this.G = G; this.o = o; this.r = o.r || 18;
      svg.setAttribute("class", "vg");
      svg.setAttribute("viewBox", `0 0 ${G.vb[0]} ${G.vb[1]}`);
      svg.setAttribute("role", "img");
      svg.innerHTML = "";
      this.pos = {};
      G.nodi.forEach(([id, x, y]) => (this.pos[id] = { x, y }));
      const gA = S("g", {}, svg), gP = S("g", {}, svg), gN = S("g", {}, svg);
      const coppie = new Set(G.archi.map(([u, v]) => u + ">" + v));
      this.archi = G.archi.map(([u, v, w], i) => {
        const g = S("g", { class: "a" }, gA);
        const alone = S("path", { class: "alone" }, g), p = S("path", { class: "arco" }, g);
        const h = o.orientato ? S("path", { class: "punta" }, g) : null;
        const curvo = o.orientato && coppie.has(v + ">" + u);
        const geo = this.geometria(u, v, curvo);
        p.setAttribute("d", geo.d); alone.setAttribute("d", geo.d);
        if (h) h.setAttribute("d", geo.punta);
        let t = null;
        if (o.pesi && w != null) {
          t = S("text", { class: "peso", x: geo.mx, y: geo.my }, gP);
          t.textContent = w;
        }
        return { u, v, w, g, t, i };
      });
      this.nodi = {};
      G.nodi.forEach(([id, x, y]) => {
        const g = S("g", { class: "nodo", "data-id": id }, gN);
        S("circle", { class: "alone-n", cx: x, cy: y, r: this.r + 8 }, g);
        S("circle", { class: "corpo", cx: x, cy: y, r: this.r }, g);
        S("text", { class: "lab", x, y }, g).textContent = id;
        const sopra = y < G.vb[1] / 2;
        const ann = S("text", { class: "ann", x, y: sopra ? y - this.r - 9 : y + this.r + 21 }, g);
        this.nodi[id] = { g, ann };
      });
    }
    geometria(u, v, curvo) {
      const a = this.pos[u], b = this.pos[v], r = this.r;
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
      const ctrl = curvo ? { x: (a.x + b.x) / 2 - (dy / L) * 22, y: (a.y + b.y) / 2 + (dx / L) * 22 } : null;
      const unit = (p, q) => { const ex = q.x - p.x, ey = q.y - p.y, l = Math.hypot(ex, ey) || 1; return { x: ex / l, y: ey / l }; };
      const dS = unit(a, ctrl || b), dE = unit(ctrl || a, b);
      const s = { x: a.x + dS.x * r, y: a.y + dS.y * r };
      const tip = { x: b.x - dE.x * (r + 1), y: b.y - dE.y * (r + 1) };
      const fine = this.o.orientato ? { x: tip.x - dE.x * 8, y: tip.y - dE.y * 8 } : tip;
      const d = ctrl ? `M${s.x},${s.y} Q${ctrl.x},${ctrl.y} ${fine.x},${fine.y}` : `M${s.x},${s.y} L${fine.x},${fine.y}`;
      const px = -dE.y, py = dE.x, bx = tip.x - dE.x * 10, by = tip.y - dE.y * 10;
      const punta = `M${tip.x},${tip.y} L${bx + px * 5},${by + py * 5} L${bx - px * 5},${by - py * 5} Z`;
      const mx = ctrl ? (a.x + 2 * ctrl.x + b.x) / 4 : (a.x + b.x) / 2 - (dy / L) * 10;
      const my = ctrl ? (a.y + 2 * ctrl.y + b.y) / 4 : (a.y + b.y) / 2 + (dx / L) * 10;
      return { d, punta, mx, my };
    }
    trova(u, v) {
      return this.archi.find((e) => (e.u === u && e.v === v) || (!this.o.orientato && e.u === v && e.v === u));
    }
    nodo(id, cls, ann, comp) {
      const n = this.nodi[id];
      if (!n) return;
      n.g.setAttribute("class", "nodo " + (cls || ""));
      n.ann.textContent = ann == null ? "" : ann;
      if (comp == null) n.g.removeAttribute("data-c"); else n.g.setAttribute("data-c", String(comp % 6));
    }
    arco(u, v, cls) { const e = this.trova(u, v); if (e) e.g.setAttribute("class", "a " + (cls || "")); }
    pulisci() {
      Object.keys(this.nodi).forEach((id) => this.nodo(id, "", ""));
      this.archi.forEach((e) => e.g.setAttribute("class", "a"));
    }
  }

  /* --------------------------------------- passi pre-calcolati + player
     disegna(passo, i) disegna uno stato; carica(passi) cambia la sequenza. */
  function conPlayer(contenitore, disegna, o = {}) {
    const el = document.createElement("div");
    contenitore.appendChild(el);
    let passi = [{}];
    const p = Player(el, { passi: 1, intervallo: o.intervallo || 1100, radice: o.radice || contenitore, render: (i) => disegna(passi[i], i) });
    return {
      carica(nuovi) { passi = nuovi.length ? nuovi : [{}]; p.nuovo(passi.length); },
      get passi() { return passi; },
      player: p
    };
  }

  /* evidenzia le righe (numerate da 1) di un blocco .pseudo */
  function righe(pseudo, quali) {
    if (!pseudo) return;
    const li = $$("li", pseudo).filter((x) => !x.classList.contains("titolo"));
    const set = new Set([].concat(quali == null ? [] : quali));
    li.forEach((x, i) => x.classList.toggle("attiva", set.has(i + 1)));
  }
  const pseudoDi = (box) => (box.dataset.pseudo ? $(box.dataset.pseudo) : null);

  function seg(nome, opzioni, scelto) {
    return `<div class="seg" role="group" aria-label="${esc(nome)}">${opzioni.map(([v, t]) => `<button type="button" data-v="${esc(v)}" aria-pressed="${String(v) === String(scelto)}">${t}</button>`).join("")}</div>`;
  }
  function suSeg(box, sel, f) {
    const g = $(sel, box);
    g.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]");
      if (!b) return;
      $$("button", g).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      f(b.dataset.v);
    });
  }

  /* ===================================================================
     Capitolo 1 — Introduzione: Fibonacci
     =================================================================== */
  const fibBig = (n) => { let a = 0n, b = 1n; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; };

  /* albero delle chiamate di Fib2: clic su un nodo = stessi sottoproblemi */
  function fibAlbero(box) {
    box.classList.add("sim");
    box.innerHTML = `<div class="sim-riga"><span class="etichetta">Fib2(n) con n =</span>${seg("Valore di n", [3, 4, 5, 6, 7].map((n) => [n, n]), 6)}</div>
      <svg aria-label="Albero delle chiamate ricorsive di Fib2"></svg>
      <p class="msg" aria-live="polite"></p>`;
    const svg = $("svg", box), msg = $(".msg", box);
    let n = 6, scelto = null;
    const albero = (k) => (k <= 2 ? { k: "F" + k, v: k, f: [] } : { k: "F" + k, v: k, f: [albero(k - 1), albero(k - 2)] });
    function disegna() {
      const rad = albero(n), conta = {};
      let tot = 0;
      (function vis(x) { tot++; conta[x.v] = (conta[x.v] || 0) + 1; x.cls = scelto === x.v ? "dup" : ""; x.f.forEach(vis); })(rad);
      vistaAlbero(svg, rad, { dx: n >= 7 ? 36 : 44, r: 15, dy: 52, click: (x) => { scelto = scelto === x.v ? null : x.v; disegna(); } });
      const Fn = fibBig(n);
      msg.innerHTML = scelto == null
        ? `Fib2(${n}) fa <b>${tot} chiamate</b>, cioè 2F<sub>${n}</sub> − 1 = 2·${Fn} − 1. Le foglie sono F<sub>${n}</sub> = ${Fn}: ogni foglia restituisce 1 e il risultato è la loro somma. <b>Clicca un nodo</b> per vedere quante volte si ricalcola lo stesso valore.`
        : `Dentro Fib2(${n}) il valore F<sub>${scelto}</sub> viene ricalcolato <b>${conta[scelto]} ${conta[scelto] === 1 ? "volta" : "volte"}</b>. La ricorsione non ricorda i risultati: è qui che si perde il tempo, e il numero di nodi cresce come φⁿ.`;
    }
    suSeg(box, ".seg", (v) => { n = +v; scelto = null; disegna(); });
    disegna();
  }

  /* gara tra i sei algoritmi per un n scelto */
  function fibGara(box) {
    box.classList.add("sim");
    box.innerHTML = `<div class="sim-riga"><label>n = <input type="number" min="3" max="200" value="40" aria-label="Valore di n"></label>
        <span class="etichetta">a 10⁹ operazioni al secondo</span></div>
      <div class="tab-wrap"><table class="tab"><thead><tr><th>Algoritmo</th><th>Lavoro</th><th class="num">Quanto</th><th>Tempo stimato</th></tr></thead><tbody></tbody></table></div>
      <p class="msg" aria-live="polite"></p>`;
    const inp = $("input", box), tb = $("tbody", box), msg = $(".msg", box);
    const tempo = (ops) => {
      const s = ops / 1e9;
      if (s < 1e-6) return "meno di un microsecondo";
      if (s < 1e-3) return `${(s * 1e6).toFixed(1)} µs`;
      if (s < 1) return `${(s * 1e3).toFixed(1)} ms`;
      if (s < 120) return `${s.toFixed(1)} secondi`;
      if (s < 7200) return `circa ${Math.round(s / 60)} minuti`;
      if (s < 172800) return `circa ${Math.round(s / 3600)} ore`;
      if (s < 3.15e7 * 2) return `circa ${Math.round(s / 86400)} giorni`;
      const anni = s / 3.156e7;
      if (anni < 1e9) return `circa ${fmt(Math.round(anni))} anni`;
      return "più dell'età dell'universo";
    };
    function fib6(n) { // conta chiamate e prodotti di FibMatPow(M, n − 1)
      let chiamate = 0, prodotti = 0;
      (function pow(k) { chiamate++; if (k > 1) { pow(Math.floor(k / 2)); prodotti += k % 2 === 0 ? 1 : 2; } })(n - 1);
      return { chiamate, prodotti };
    }
    function calcola() {
      let n = Math.round(+inp.value || 3);
      n = Math.max(3, Math.min(200, n));
      const Fn = fibBig(n);
      const phi = 1.618, phih = -0.618;
      const fib1 = (Math.pow(phi, n) - Math.pow(phih, n)) / Math.sqrt(5);
      const fib1Ok = BigInt(Math.round(fib1)) === Fn;
      const t2 = 2n * Fn - 1n, t2n = Number(t2);
      const f6 = fib6(n);
      const righe = [
        ["Fib1 · formula chiusa", "una formula con φ ≈ 1.618", fib1 < 1e15 ? fib1.toLocaleString("it-IT", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : fib1.toExponential(3), fib1Ok ? "istantaneo, e qui il risultato è giusto" : `istantaneo ma <b>sbagliato</b>: arrotonda a ${fmt(BigInt(Math.round(Math.min(fib1, 9e15))))}${fib1 >= 9e15 ? "…" : ""}`],
        ["Fib2 · ricorsivo", "chiamate = 2F<sub>n</sub> − 1", fmt(t2), tempo(t2n * 4)],
        ["Fib3 · array", "operazioni = 3n − 2", fmt(3 * n - 2), tempo(3 * n - 2) + ", memoria n celle"],
        ["Fib4 · tre variabili", "operazioni = 5n − 7", fmt(5 * n - 7), tempo(5 * n - 7) + ", memoria costante"],
        ["Fib5 · matrici", "prodotti 2×2 = n − 2", fmt(n - 2), tempo((n - 2) * 12)],
        ["Fib6 · potenza veloce", "chiamate di FibMatPow", `${f6.chiamate} (${f6.prodotti} prodotti)`, tempo(f6.prodotti * 12)]
      ];
      tb.innerHTML = righe.map((r) => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="num">${r[2]}</td><td>${r[3]}</td></tr>`).join("");
      msg.innerHTML = `F<sub>${n}</sub> = <b>${fmt(Fn)}</b>${n > 78 ? " (non sta più in un <code>long</code> di Java: servono i <code>BigInteger</code>)" : ""}. Fib2 è esponenziale: a ogni +1 su n le chiamate si moltiplicano per circa φ ≈ 1.618. Fib6 invece fa un passo in più solo quando n raddoppia.`;
    }
    inp.addEventListener("input", calcola);
    calcola();
  }

  /* ===================================================================
     Capitolo 2 — Notazione asintotica e ricorrenze
     =================================================================== */
  /* crescita delle funzioni: log10 di f(n), barre in scala logaritmica */
  function crescita(box) {
    box.classList.add("sim", "crescita");
    const N = [10, 20, 50, 100, 1000, 10000, 1000000];
    box.innerHTML = `<div class="sim-riga"><span class="etichetta">n =</span>${seg("Dimensione dell'input", N.map((n) => [n, fmt(n)]), 50)}</div>
      <svg aria-label="Valore delle funzioni di costo per l'n scelto"></svg><p class="msg" aria-live="polite"></p>`;
    const svg = $("svg", box), msg = $(".msg", box);
    const lgFatt = (n) => { let s = 0; for (let i = 2; i <= Math.min(n, 2e6); i++) s += Math.log10(i); return s; };
    const F = [
      ["log n", (n) => Math.log10(Math.log2(n))],
      ["√n", (n) => 0.5 * Math.log10(n)],
      ["n", (n) => Math.log10(n)],
      ["n log n", (n) => Math.log10(n * Math.log2(n))],
      ["n²", (n) => 2 * Math.log10(n)],
      ["n³", (n) => 3 * Math.log10(n)],
      ["2ⁿ", (n) => n * Math.log10(2)],
      ["n!", (n) => lgFatt(n)]
    ];
    const scrivi = (lg) => (lg < 6 ? fmt(Math.round(Math.pow(10, lg))) : `10${apice(Math.floor(lg))}`);
    const tempo = (lg) => {
      const s = lg - 9; // secondi in log10, a 10⁹ operazioni al secondo
      if (s < -6) return "< 1 µs";
      if (s < -3) return `${Math.round(Math.pow(10, s + 6))} µs`;
      if (s < 0) return `${Math.round(Math.pow(10, s + 3))} ms`;
      if (s < Math.log10(120)) return `${Math.round(Math.pow(10, s))} s`;
      if (s < Math.log10(7200)) return `${Math.round(Math.pow(10, s) / 60)} min`;
      if (s < Math.log10(172800)) return `${Math.round(Math.pow(10, s) / 3600)} ore`;
      if (s < Math.log10(6.3e7)) return `${Math.round(Math.pow(10, s) / 86400)} giorni`;
      if (s < 17.6) return `10${apice(Math.floor(s - 7.5))} anni`;
      return "> età dell'universo";
    };
    function disegna(n) {
      const W = 560, x0 = 74, x1 = W - 150, alto = F.length * 30 + 30, hi = 24;
      const X = (lg) => x0 + (Math.min(Math.max(lg, 0), hi) / hi) * (x1 - x0);
      let g = `<line class="asse" x1="${x0}" y1="6" x2="${x0}" y2="${alto - 22}"/>`;
      for (let e = 0; e <= hi; e += 6) g += `<line class="griglia" x1="${X(e)}" y1="6" x2="${X(e)}" y2="${alto - 22}"/><text class="tick" x="${X(e)}" y="${alto - 6}" text-anchor="middle">10${apice(e)}</text>`;
      F.forEach(([nome, f], i) => {
        const lg = f(n), y = 10 + i * 30, w = Math.max(2, X(lg) - x0);
        g += `<text class="nome" x="${x0 - 10}" y="${y + 12}" text-anchor="end">${nome}</text>`;
        g += `<rect class="barra-c${lg > hi ? " troppo" : ""}" x="${x0}" y="${y}" width="${w}" height="16" rx="3"><title>${nome} = ${scrivi(lg)}</title></rect>`;
        g += `<text class="valore" x="${x0 + w + 6}" y="${y + 12}">${scrivi(lg)} · ${tempo(lg)}</text>`;
      });
      svg.setAttribute("viewBox", `0 0 ${W} ${alto}`);
      svg.innerHTML = g;
      const lg2 = F[6][1](n);
      msg.innerHTML = `Con n = ${fmt(n)}, a 10⁹ operazioni al secondo: n log n richiede ${tempo(F[3][1](n))}, n² ${tempo(F[4][1](n))}, 2ⁿ <b>${tempo(lg2)}</b>. Scala logaritmica: ogni tacca vale un milione di volte la precedente${lg2 > hi ? "; le barre rosse escono dal grafico" : ""}.`;
    }
    suSeg(box, ".seg", (v) => disegna(+v));
    disegna(50);
  }

  /* Master Theorem nella versione semplificata dei lucidi */
  function master(box) {
    box.classList.add("sim");
    const ESEMPI = [["Ricerca binaria", 1, 2, 0], ["MergeSort", 2, 2, 1], ["3T(n/4) + n²", 3, 4, 2], ["2T(n/4) + c", 2, 4, 0], ["8T(n/4) + c", 8, 4, 0], ["Strassen", 7, 2, 2]];
    box.innerHTML = `<p class="formula">T(n) = <input type="number" min="1" step="1" value="2" aria-label="a" style="width:4.2em"> · T(n / <input type="number" min="2" step="1" value="2" aria-label="b" style="width:4.2em">) + c · n^<input type="number" min="0" step="0.5" value="1" aria-label="beta" style="width:4.2em"></p>
      <div class="sim-riga"><span class="etichetta">Esempi</span>${ESEMPI.map((e, i) => `<button type="button" class="btn piccolo" data-e="${i}">${e[0]}</button>`).join("")}</div>
      <div class="numeri"><div><b class="m-alfa">1</b><span>α = log<sub>b</sub> a</span></div><div><b class="m-beta">1</b><span>β, esponente di f(n)</span></div><div><b class="m-q">1</b><span>q = a / b<sup>β</sup>: come cambia il costo da un livello al successivo</span></div><div><b class="m-ris">Θ(n log n)</b><span>soluzione</span></div></div>
      <div class="albero-ric m-livelli"></div>
      <p class="msg" aria-live="polite"></p>`;
    const [ia, ib, ibeta] = $$("input", box), msg = $(".msg", box), liv = $(".m-livelli", box);
    const bello = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : Math.abs(x * 2 - Math.round(x * 2)) < 1e-9 ? `${Math.round(x * 2)}/2` : x.toFixed(2));
    const pot = (e) => (e === "0" ? "1" : e === "1" ? "n" : `n${e.includes("/") || e.includes(".") ? "^" + e : apice(e)}`);
    function calcola() {
      const a = Math.max(1, Math.round(+ia.value || 1)), b = Math.max(2, Math.round(+ib.value || 2)), beta = Math.max(0, +ibeta.value || 0);
      const alfa = Math.log(a) / Math.log(b), q = a / Math.pow(b, beta);
      const eq = Math.abs(alfa - beta) < 1e-9;
      let ris, caso, spiega;
      if (eq) { ris = `Θ(${pot(bello(alfa)) === "1" ? "log n" : pot(bello(alfa)) + " log n"})`; caso = "α = β"; spiega = "tutti i livelli dell'albero di ricorsione costano uguale (q = 1): costo di un livello per numero di livelli, cioè n<sup>β</sup> · log n."; }
      else if (alfa > beta) { ris = `Θ(${pot(bello(alfa))})`; caso = "α > β"; spiega = "il costo cresce scendendo nell'albero (q > 1): dominano le foglie, che sono a<sup>log<sub>b</sub> n</sup> = n<sup>α</sup>."; }
      else { ris = `Θ(${pot(bello(beta))})`; caso = "α < β"; spiega = "il costo cala scendendo nell'albero (q < 1): domina la radice, cioè f(n) = c·n<sup>β</sup>."; }
      $(".m-alfa", box).textContent = bello(alfa);
      $(".m-beta", box).textContent = bello(beta);
      $(".m-q", box).textContent = q < 100 ? bello(q) : q.toExponential(1);
      $(".m-ris", box).textContent = ris;
      msg.innerHTML = `a = ${a}, b = ${b}: α = log<sub>${b}</sub> ${a} = <b>${bello(alfa)}</b>, β = <b>${bello(beta)}</b>. Caso <b>${caso}</b> ⇒ T(n) = <b>${ris}</b>: ${spiega}`;
      // livelli dell'albero: costo del livello i = q^i · n^β, mostrato in proporzione
      const L = 5, costi = Array.from({ length: L }, (_, i) => Math.pow(q, i)), mx = Math.max(...costi);
      liv.innerHTML = costi.map((c, i) => {
        const nodi = Math.pow(a, i);
        return `<div class="livello"><div class="blocchi"><div class="blocco" style="width:${Math.max(3, (c / mx) * 100)}%">${nodi <= 64 ? nodi + (nodi === 1 ? " nodo" : " nodi") : ""}</div></div><span class="somma">livello ${i}: ${q === 1 ? "" : bello(Math.pow(q, i)) + " · "}n<sup>β</sup></span></div>`;
      }).join("");
    }
    box.addEventListener("input", calcola);
    box.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-e]");
      if (!btn) return;
      const [, a, b, be] = ESEMPI[+btn.dataset.e];
      ia.value = a; ib.value = b; ibeta.value = be; calcola();
    });
    calcola();
  }

  /* contatore binario con il metodo degli accantonamenti */
  function contatore(box) {
    box.classList.add("sim");
    const k = +(box.dataset.k || 5);
    box.innerHTML = `<div class="sim-riga"><button type="button" class="btn primario" data-b="inc">increment</button><button type="button" class="btn" data-b="otto">8 incrementi</button><button type="button" class="btn" data-b="zero">Azzera</button></div>
      <div class="bit" aria-live="polite"></div>
      <div class="contatori"><span>valore <b class="c-val">0</b></span><span>incrementi n <b class="c-n">0</b></span><span>costo dell'ultimo <b class="c-ult">0</b></span><span>costo totale <b class="c-tot">0</b></span><span>totale / n <b class="c-media">–</b></span><span>credito residuo <b class="c-cred">0 €</b></span></div>
      <p class="msg"></p>`;
    const A = Array(k).fill(0);
    let n = 0, tot = 0, ult = 0, cambiati = [], credito = 0;
    function inc() {
      cambiati = [];
      let i = k - 1;
      while (i >= 0 && A[i] === 1) { A[i] = 0; cambiati.push(i); i--; }
      if (i >= 0) { A[i] = 1; cambiati.push(i); }
      ult = cambiati.length; tot += ult; n++;
      // 2 € per ogni bit portato a 1: 1 € paga il cambio, 1 € resta sul bit
      // e pagherà il suo ritorno a 0. Il credito è quindi il numero di 1.
      credito = A.reduce((s, x) => s + x, 0);
    }
    function disegna() {
      $(".bit", box).innerHTML = A.map((b, i) => `<span class="${b ? "uno" : ""}${cambiati.includes(i) ? " cambiato" : ""}">${b}${b ? "<i>1€</i>" : ""}</span>`).join("");
      $(".c-val", box).textContent = parseInt(A.join(""), 2);
      $(".c-n", box).textContent = n;
      $(".c-ult", box).textContent = ult;
      $(".c-tot", box).textContent = tot;
      $(".c-media", box).textContent = n ? (tot / n).toFixed(2) : "–";
      $(".c-cred", box).textContent = credito + " €";
      $(".msg", box).innerHTML = n
        ? `L'ultimo incremento ha cambiato <b>${ult} bit</b>: ${cambiati.filter((i) => A[i] === 0).length} da 1 a 0 e ${cambiati.some((i) => A[i] === 1) ? "uno" : "nessuno (overflow)"} da 0 a 1. Ogni 1 conserva 1 € di credito, che paga il suo ritorno a 0: per questo 2 € a incremento bastano sempre e il costo totale resta ≤ 2n.`
        : `Ogni incremento costa 1 per ogni bit cambiato. Prova a fare 7 incrementi e poi l'ottavo: costa ${Math.min(k, 4)}, ma la media resta sotto 2.`;
    }
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-b]");
      if (!b) return;
      if (b.dataset.b === "inc") inc();
      if (b.dataset.b === "otto") for (let j = 0; j < 8; j++) inc();
      if (b.dataset.b === "zero") { A.fill(0); n = tot = ult = credito = 0; cambiati = []; }
      disegna();
    });
    disegna();
  }

  /* ===================================================================
     Capitolo 3 — Ordinamento e selezione
     =================================================================== */
  const PSEUDO_ORD = {
    selection: { nome: "SelectionSort", righe: [
      [0, "<b>for</b> <i>k</i> = 1 <b>to</b> <i>n</i> − 1 <b>do</b>"],
      [1, "<i>m</i> = <i>k</i>"],
      [1, "<b>for</b> <i>j</i> = <i>k</i> + 1 <b>to</b> <i>n</i> <b>do</b>"],
      [2, "<b>if</b> <i>A</i>[<i>j</i>] &lt; <i>A</i>[<i>m</i>] <b>then</b> <i>m</i> = <i>j</i>"],
      [1, "<b>if</b> <i>m</i> ≠ <i>k</i> <b>then</b> scambia <i>A</i>[<i>k</i>] e <i>A</i>[<i>m</i>]"]] },
    insertion: { nome: "InsertionSort (versione dei lucidi)", righe: [
      [0, "<b>for</b> <i>k</i> = 2 <b>to</b> <i>n</i> <b>do</b>"],
      [1, "<i>x</i> = <i>A</i>[<i>k</i>];  <i>j</i> = 1"],
      [1, "<b>while</b> <i>j</i> &lt; <i>k</i> <b>and</b> <i>A</i>[<i>j</i>] ≤ <i>x</i> <b>do</b> <i>j</i> = <i>j</i> + 1"],
      [1, "<b>for</b> <i>t</i> = <i>k</i> <b>downto</b> <i>j</i> + 1 <b>do</b> <i>A</i>[<i>t</i>] = <i>A</i>[<i>t</i> − 1]"],
      [1, "<i>A</i>[<i>j</i>] = <i>x</i>"]] },
    bubble: { nome: "BubbleSort", righe: [
      [0, "<b>for</b> <i>i</i> = 1 <b>to</b> <i>n</i> − 1 <b>do</b>"],
      [1, "<i>scambi</i> = false"],
      [1, "<b>for</b> <i>j</i> = 2 <b>to</b> <i>n</i> − <i>i</i> + 1 <b>do</b>"],
      [2, "<b>if</b> <i>A</i>[<i>j</i> − 1] &gt; <i>A</i>[<i>j</i>] <b>then</b> scambia; <i>scambi</i> = true"],
      [1, "<b>if not</b> <i>scambi</i> <b>then break</b>"]] },
    quick: { nome: "QuickSort(A, i, f)", righe: [
      [0, "<b>if</b> <i>i</i> ≥ <i>f</i> <b>then return</b>"],
      [0, "<i>m</i> = Partition(<i>A</i>, <i>i</i>, <i>f</i>)"],
      [0, "QuickSort(<i>A</i>, <i>i</i>, <i>m</i> − 1);  QuickSort(<i>A</i>, <i>m</i> + 1, <i>f</i>)"],
      [0, "<span class=\"sc\">Partition(A, i, f):</span> <i>x</i> = <i>A</i>[<i>i</i>]; <i>inf</i> = <i>i</i>; <i>sup</i> = <i>f</i> + 1"],
      [1, "<b>repeat</b> <i>inf</i>++ <b>while</b> <i>inf</i> ≤ <i>f</i> <b>and</b> <i>A</i>[<i>inf</i>] ≤ <i>x</i>"],
      [1, "<b>repeat</b> <i>sup</i>−− <b>while</b> <i>A</i>[<i>sup</i>] &gt; <i>x</i>"],
      [1, "<b>if</b> <i>inf</i> &lt; <i>sup</i> <b>then</b> scambia <i>A</i>[<i>inf</i>], <i>A</i>[<i>sup</i>] e ripeti"],
      [1, "<b>else</b> scambia <i>A</i>[<i>i</i>], <i>A</i>[<i>sup</i>]; <b>return</b> <i>sup</i>"]] },
    merge: { nome: "MergeSort(A, i, f)", righe: [
      [0, "<b>if</b> <i>i</i> ≥ <i>f</i> <b>then return</b>"],
      [0, "<i>m</i> = ⌊(<i>i</i> + <i>f</i>)/2⌋"],
      [0, "MergeSort(<i>A</i>, <i>i</i>, <i>m</i>);  MergeSort(<i>A</i>, <i>m</i> + 1, <i>f</i>)"],
      [0, "<span class=\"sc\">Merge:</span> <b>while</b> entrambe le metà hanno elementi"],
      [1, "copia in <i>X</i> il minore tra <i>A</i>[<i>i1</i>] e <i>A</i>[<i>i2</i>] (a parità, quello di sinistra)"],
      [0, "copia in <i>X</i> la metà rimasta, poi ricopia <i>X</i> in <i>A</i>[<i>i</i>..<i>f</i>]"]] },
    counting: { nome: "CountingSort(A, k)", righe: [
      [0, "<b>for</b> <i>i</i> = 0 <b>to</b> <i>k</i> − 1 <b>do</b> <i>Y</i>[<i>i</i>] = 0"],
      [0, "<b>for</b> <i>i</i> = 1 <b>to</b> <i>n</i> <b>do</b> <i>Y</i>[<i>A</i>[<i>i</i>]]++"],
      [0, "<i>j</i> = 1;  <b>for</b> <i>i</i> = 0 <b>to</b> <i>k</i> − 1 <b>do</b>"],
      [1, "<b>while</b> <i>Y</i>[<i>i</i>] &gt; 0 <b>do</b> <i>A</i>[<i>j</i>] = <i>i</i>; <i>j</i>++; <i>Y</i>[<i>i</i>]−−"]] }
  };

  function tracciaOrdinamento(alg, A0) {
    const a = A0.slice(), n = a.length, P = [];
    let conf = 0, mosse = 0;
    const fatti = new Set();
    function snap(riga, msg, cls = {}, tag = {}, extra = {}) {
      const c = Array(n).fill(""), t = Array(n).fill("");
      fatti.forEach((i) => (c[i] = "ok"));
      for (const i in cls) c[i] = cls[i];
      for (const i in tag) t[i] = tag[i];
      P.push(Object.assign({ a: a.slice(), riga, msg, cls: c, tag: t, conf, mosse }, extra));
    }
    const scambia = (i, j) => { [a[i], a[j]] = [a[j], a[i]]; mosse++; };
    const fuori = (i, f) => { const o = {}; for (let x = 0; x < n; x++) if (x < i || x > f) o[x] = fatti.has(x) ? "ok fuori" : "fuori"; return o; };
    snap(null, "Array di partenza. Premi ▶ o usa le frecce.");
    if (alg === "selection") {
      for (let k = 0; k < n - 1; k++) {
        let m = k;
        snap(2, `Cerco il minimo in A[${k + 1}..${n}]: per ora m = ${k + 1}.`, { [k]: "piv" }, { [k]: "m" });
        for (let j = k + 1; j < n; j++) {
          conf++;
          const minore = a[j] < a[m];
          snap(4, `A[${j + 1}] = ${a[j]} ${minore ? "&lt;" : "≥"} A[m] = ${a[m]}${minore ? `: il nuovo minimo è in posizione ${j + 1}.` : "."}`, { [m]: "piv", [j]: "cmp" }, { [m]: "m", [j]: "j" });
          if (minore) m = j;
        }
        if (m !== k) { scambia(k, m); snap(5, `Scambio A[${k + 1}] e A[${m + 1}]: ${a[k]} va in posizione definitiva ${k + 1}.`, { [k]: "swp", [m]: "swp" }); }
        else snap(5, `Il minimo è già in posizione ${k + 1}: nessuno scambio.`, { [k]: "swp" });
        fatti.add(k);
      }
      fatti.add(n - 1);
    } else if (alg === "insertion") {
      fatti.add(0);
      for (let k = 1; k < n; k++) {
        const x = a[k];
        let j = 0;
        snap(2, `Inserisco x = A[${k + 1}] = ${x} nel prefisso ordinato A[1..${k}].`, { [k]: "piv" }, { [k]: "x" });
        while (j < k) {
          conf++;
          if (a[j] > x) { snap(3, `A[${j + 1}] = ${a[j]} &gt; ${x}: la posizione di x è ${j + 1}.`, { [j]: "cmp", [k]: "piv" }, { [j]: "j", [k]: "x" }); break; }
          snap(3, `A[${j + 1}] = ${a[j]} ≤ ${x}: vado avanti.`, { [j]: "cmp", [k]: "piv" }, { [j]: "j", [k]: "x" });
          j++;
        }
        if (j < k) {
          for (let t = k; t > j; t--) { a[t] = a[t - 1]; mosse++; }
          a[j] = x; mosse++;
          const c = {}; for (let t = j + 1; t <= k; t++) c[t] = "swp";
          c[j] = "piv";
          snap(5, `Sposto A[${j + 1}..${k}] di una posizione a destra e metto ${x} in posizione ${j + 1}.`, c, { [j]: "x" });
        } else snap(3, `Nessun elemento del prefisso è maggiore di ${x}: resta dov'è.`, { [k]: "piv" }, { [k]: "x" });
        fatti.add(k);
      }
    } else if (alg === "bubble") {
      for (let i = 1; i < n; i++) {
        let sc = false;
        snap(2, `Scansione ${i}: confronto le coppie adiacenti fino alla posizione ${n - i + 1}.`);
        for (let j = 1; j <= n - i; j++) {
          conf++;
          if (a[j - 1] > a[j]) { scambia(j - 1, j); sc = true; snap(4, `${a[j]} &gt; ${a[j - 1]}: scambio le posizioni ${j} e ${j + 1}.`, { [j - 1]: "swp", [j]: "swp" }); }
          else snap(4, `${a[j - 1]} ≤ ${a[j]}: nessuno scambio.`, { [j - 1]: "cmp", [j]: "cmp" });
        }
        fatti.add(n - i);
        if (!sc) { for (let x = 0; x < n; x++) fatti.add(x); snap(5, `Nessuno scambio in questa scansione: l'array è ordinato, mi fermo.`); break; }
        snap(5, `Il massimo della parte non ordinata è arrivato in fondo, in posizione ${n - i + 1}.`);
      }
      for (let x = 0; x < n; x++) fatti.add(x);
    } else if (alg === "quick") {
      (function qs(i, f) {
        if (i >= f) { if (i === f) fatti.add(i); return; }
        const x = a[i];
        let inf = i, sup = f + 1;
        snap(4, `Partition su A[${i + 1}..${f + 1}]: il pivot è il primo elemento, x = ${x}.`, Object.assign(fuori(i, f), { [i]: "piv" }), { [i]: "x" });
        while (true) {
          do { inf++; if (inf <= f) conf++; } while (inf <= f && a[inf] <= x);
          do { sup--; conf++; } while (a[sup] > x);
          const tg = { [i]: "x" }; if (inf <= f) tg[inf] = "inf"; tg[sup] = (tg[sup] ? tg[sup] + " " : "") + "sup";
          if (inf < sup) {
            snap(7, `inf si ferma su ${a[inf]} &gt; ${x}, sup su ${a[sup]} ≤ ${x}: li scambio.`, Object.assign(fuori(i, f), { [i]: "piv", [inf]: "cmp", [sup]: "cmp" }), tg);
            scambia(inf, sup);
            snap(7, `Scambiati: a sinistra di inf solo elementi ≤ ${x}, a destra di sup solo elementi &gt; ${x}.`, Object.assign(fuori(i, f), { [i]: "piv", [inf]: "swp", [sup]: "swp" }), tg);
          } else {
            snap(8, `inf e sup si sono incrociati (inf = ${inf + 1}, sup = ${sup + 1}): scambio il pivot con A[sup].`, Object.assign(fuori(i, f), { [i]: "piv", [sup]: "cmp" }), tg);
            break;
          }
        }
        scambia(i, sup);
        fatti.add(sup);
        snap(8, `Il pivot ${x} è nella sua posizione definitiva ${sup + 1}. Ora si ordinano ricorsivamente A[${i + 1}..${sup}] e A[${sup + 2}..${f + 1}].`, Object.assign(fuori(i, f), { [sup]: "piv ok" }));
        qs(i, sup - 1);
        qs(sup + 1, f);
      })(0, n - 1);
      for (let x = 0; x < n; x++) fatti.add(x);
    } else if (alg === "merge") {
      (function ms(i, f) {
        if (i >= f) return;
        const m = Math.floor((i + f) / 2);
        snap(2, `Divido A[${i + 1}..${f + 1}] in A[${i + 1}..${m + 1}] e A[${m + 2}..${f + 1}].`, fuori(i, f));
        ms(i, m);
        ms(m + 1, f);
        const X = [];
        let i1 = i, i2 = m + 1;
        while (i1 <= m && i2 <= f) {
          conf++;
          const sx = a[i1] <= a[i2];
          const c = Object.assign(fuori(i, f), { [i1]: "cmp", [i2]: "cmp" });
          X.push(sx ? a[i1] : a[i2]);
          snap(5, `${a[i1]} ${sx ? "≤" : "&gt;"} ${a[i2]}: copio ${sx ? a[i1] : a[i2]} in X.`, c, { [i1]: "i1", [i2]: "i2" }, { x: X.slice(), xa: i, xb: f });
          sx ? i1++ : i2++;
        }
        while (i1 <= m) X.push(a[i1++]);
        while (i2 <= f) X.push(a[i2++]);
        snap(6, `Una metà è finita: copio in X il resto dell'altra.`, fuori(i, f), {}, { x: X.slice(), xa: i, xb: f });
        for (let t = 0; t < X.length; t++) { a[i + t] = X[t]; mosse++; }
        const c = fuori(i, f); for (let t = i; t <= f; t++) c[t] = "swp";
        snap(6, `Ricopio X in A[${i + 1}..${f + 1}], che ora è ordinato.`, c);
      })(0, n - 1);
      for (let x = 0; x < n; x++) fatti.add(x);
    } else if (alg === "counting") {
      const k = Math.max(...a) + 1, Y = Array(k).fill(0);
      snap(1, `I valori stanno in [0, ${k - 1}]: k = ${k}. Azzero l'array dei contatori Y[0..${k - 1}].`, {}, {}, { y: Y.slice() });
      for (let i = 0; i < n; i++) { Y[a[i]]++; snap(2, `A[${i + 1}] = ${a[i]}: incremento Y[${a[i]}].`, { [i]: "cmp" }, {}, { y: Y.slice(), yi: a[i] }); }
      let j = 0;
      for (let v = 0; v < k; v++) {
        while (Y[v] > 0) { a[j] = v; mosse++; fatti.add(j); Y[v]--; snap(4, `Scrivo ${v} in A[${j + 1}] e decremento Y[${v}].`, { [j]: "swp" }, {}, { y: Y.slice(), yi: v }); j++; }
      }
    }
    for (let x = 0; x < n; x++) fatti.add(x);
    snap(null, `Ordinato: ${conf} confronti e ${mosse} ${alg === "merge" || alg === "insertion" || alg === "counting" ? "scritture" : "scambi"}.`);
    return P;
  }

  function ordina(box) {
    box.classList.add("sim");
    const ALG = [["selection", "Selection"], ["insertion", "Insertion"], ["bubble", "Bubble"], ["quick", "Quick"], ["merge", "Merge"], ["counting", "Counting"]];
    let alg = box.dataset.alg || "selection";
    box.innerHTML = `<div class="sim-riga">${seg("Algoritmo", ALG, alg)}</div>
      <div class="sim-riga"><label>Array <input type="text" value="12 7 3 2 14 22 1 3" aria-label="Valori dell'array"></label><button type="button" class="btn" data-b="usa">Usa</button><button type="button" class="btn" data-b="caso">Casuale</button></div>
      <div class="sim-due"><div><div class="o-arr"></div><div class="corsia o-riga2" hidden><span class="etichetta"><span class="o-nome2"></span></span><div class="o-arr2"></div></div><p class="msg" aria-live="polite"></p></div>
      <div><ol class="pseudo o-pseudo"></ol><div class="contatori"><span>confronti <b class="o-conf">0</b></span><span><span class="o-nm">scambi</span> <b class="o-mosse">0</b></span></div></div></div>`;
    const inp = $("input", box), arrEl = $(".o-arr", box), arr2 = $(".o-arr2", box), riga2 = $(".o-riga2", box), msg = $(".msg", box), ps = $(".o-pseudo", box);
    let A = numeri(inp.value);
    function pseudo() {
      const d = PSEUDO_ORD[alg];
      ps.innerHTML = `<li class="titolo">${d.nome}</li>` + d.righe.map(([r, t]) => `<li${r ? ` class="rientro${r}"` : ""}>${t}</li>`).join("");
      $(".o-nm", box).textContent = alg === "merge" || alg === "insertion" || alg === "counting" ? "scritture" : "scambi";
    }
    const pl = conPlayer(box, (s) => {
      if (!s.a) return;
      const max = Math.max(...s.a, 1);
      vistaArray(arrEl, s.a, { cls: s.cls, tag: s.tag, barre: true, max });
      if (s.x) {
        riga2.hidden = false; $(".o-nome2", box).textContent = `X, array di appoggio del merge di A[${s.xa + 1}..${s.xb + 1}]`;
        vistaArray(arr2, s.x, { piccolo: true, base: s.xa + 1 });
      } else if (s.y) {
        riga2.hidden = false; $(".o-nome2", box).textContent = "Y, contatori dei valori";
        vistaArray(arr2, s.y, { piccolo: true, base: 0, cls: s.y.map((_, i) => (i === s.yi ? "cmp" : "")) });
      } else riga2.hidden = true;
      msg.innerHTML = s.msg;
      righe(ps, s.riga);
      $(".o-conf", box).textContent = s.conf;
      $(".o-mosse", box).textContent = s.mosse;
    }, { intervallo: 900 });
    function carica() {
      A = A.slice(0, 14);
      const B = alg === "counting" ? A.map((v) => Math.max(0, Math.min(15, Math.abs(v)))) : A;
      inp.value = B.join(" ");
      pseudo();
      pl.carica(tracciaOrdinamento(alg, B));
    }
    suSeg(box, ".seg", (v) => { alg = v; carica(); });
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-b='usa'], [data-b='caso']");
      if (!b) return;
      if (b.dataset.b === "usa") { const v = numeri(inp.value); if (v.length >= 2) A = v; }
      if (b.dataset.b === "caso") A = casuali(9, alg === "counting" ? 0 : 1, alg === "counting" ? 9 : 30);
      carica();
    });
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { const v = numeri(inp.value); if (v.length >= 2) A = v; carica(); } });
    carica();
  }

  /* albero di decisione di un ordinamento per confronti su 3 elementi */
  function alberoDecisione(box) {
    box.classList.add("sim");
    box.innerHTML = `<svg aria-label="Albero di decisione per ordinare tre elementi"></svg><p class="msg">Ogni nodo interno è un confronto i:j tra A[i] e A[j], ogni foglia una permutazione: le foglie sono 3! = 6 e l'altezza è 3 ≥ ⌈log₂ 6⌉. Clicca una foglia per vedere i confronti che portano lì.</p>`;
    const L = (k, a, aSx) => ({ k, a, aSx, l: null, r: null });
    const N = (k, l, r, a, aSx) => ({ k, l, r, a, aSx });
    const rad = N("1:2",
      N("2:3", L("123", "<", true), N("1:3", L("132", "<", true), L("312", ">")), "<", true),
      N("1:3", L("213", "<", true), N("2:3", L("231", "<", true), L("321", ">")), ">"));
    const svg = $("svg", box), msg = $(".msg", box);
    function padri(n, p, m) { if (!n) return m; m.set(n, p); padri(n.l, n, m); padri(n.r, n, m); return m; }
    const P = padri(rad, null, new Map());
    function disegna(sel) {
      P.forEach((_, n) => { n.cls = n.l ? "" : "ok"; n.ramo = ""; });
      if (sel) { let x = sel; while (x) { x.cls = x === sel ? "cur" : "ok"; x.ramo = P.get(x) ? "cammino" : ""; x = P.get(x); } }
      vistaAlbero(svg, rad, { dx: 58, dy: 62, r: 19, click: (n) => { if (!n.l) disegna(n); } });
      if (sel) {
        const passi = []; let x = sel;
        while (P.get(x)) { const p = P.get(x); passi.unshift(`A[${p.k[0]}] ${p.l === x ? "&lt;" : "&gt;"} A[${p.k[2]}]`); x = p; }
        msg.innerHTML = `Per arrivare a <b>${sel.k.split("").join(", ")}</b> servono ${passi.length} confronti: ${passi.join(", ")}. Il caso pessimo dell'algoritmo è il cammino più lungo, cioè l'altezza dell'albero.`;
      }
    }
    disegna(null);
  }

  /* problema della bandiera nazionale (una scansione, tre indici) */
  function bandiera(box) {
    box.classList.add("sim");
    box.innerHTML = `<div class="sim-riga"><button type="button" class="btn" data-b="caso">Nuovo array</button><span class="legenda"><span><i style="background:var(--c2);border-color:var(--c2)"></i>verde</span><span><i class="l-bianco"></i>bianco</span><span><i style="background:var(--c1);border-color:var(--c1)"></i>rosso</span></span></div>
      <div class="b-arr"></div><p class="msg" aria-live="polite"></p>`;
    const el = $(".b-arr", box), msg = $(".msg", box);
    const NOME = { V: "verde", B: "bianco", R: "rosso" };
    function traccia(A) {
      const a = A.slice(), n = a.length, P = [];
      let i = 0, j = 0, k = n - 1;
      const snap = (m, ev) => P.push({ a: a.slice(), i, j, k, m, ev });
      snap("Invariante: prima di i solo verdi, prima di j niente rossi, dopo k solo rossi. All'inizio i = j = 1 e k = n.");
      while (j <= k) {
        if (a[j] === "V") {
          const s = i < j; if (s) [a[i], a[j]] = [a[j], a[i]];
          snap(`A[j] è verde: ${s ? "lo scambio con A[i], poi " : ""}incremento i e j.`, [i, j]);
          i++; j++;
        } else if (a[j] === "R") {
          [a[j], a[k]] = [a[k], a[j]];
          snap(`A[j] è rosso: lo scambio con A[k] e decremento k (j resta fermo: il valore arrivato da k va ancora esaminato).`, [j, k]);
          k--;
        } else { snap("A[j] è bianco: incremento solo j.", [j]); j++; }
      }
      snap(`j &gt; k: fine. Verdi in 1..${i}, bianchi in ${i + 1}..${j}, rossi in ${j + 1}..${n}. Una sola scansione, memoria O(1).`);
      return P;
    }
    const pl = conPlayer(box, (s) => {
      if (!s.a) return;
      const tag = s.a.map((_, x) => [x === s.i ? "i" : "", x === s.j ? "j" : "", x === s.k ? "k" : ""].filter(Boolean).join(" "));
      const cls = s.a.map((v, x) => (v === "V" ? "c2" : v === "R" ? "rossa" : "") + (s.ev && s.ev.includes(x) ? " swp" : ""));
      vistaArray(el, s.a.map((v) => NOME[v][0].toUpperCase()), { cls, tag });
      msg.innerHTML = s.m;
    }, { intervallo: 1000 });
    function nuovo() { pl.carica(traccia(Array.from({ length: 10 }, () => "VBR"[Math.floor(Math.random() * 3)]))); }
    $("[data-b='caso']", box).addEventListener("click", nuovo);
    pl.carica(traccia("RBVBRVVBRB".split("")));
  }

  /* ===================================================================
     Capitolo 4 — Strutture dati elementari
     =================================================================== */
  /* pila su array dinamico: raddoppio quando è piena, dimezzamento a 1/4 */
  function pilaDinamica(box) {
    box.classList.add("sim");
    box.innerHTML = `<div class="sim-riga"><button type="button" class="btn primario" data-p="push">push</button><button type="button" class="btn" data-p="pop">pop</button><button type="button" class="btn" data-p="dieci">10 push</button><button type="button" class="btn" data-p="alterna">push/pop alternati ×8</button><button type="button" class="btn" data-p="zero">Svuota</button></div>
      <div class="sim-riga"><span class="etichetta">Contrazione</span>${seg("Quando dimezzare", [["4", "a 1/4 (lucidi)"], ["2", "a 1/2 (sbagliata)"]], "4")}</div>
      <div class="p-arr"></div>
      <div class="contatori"><span>elementi n <b class="p-n">0</b></span><span>capacità <b class="p-cap">1</b></span><span>operazioni <b class="p-ops">0</b></span><span>costo dell'ultima <b class="p-ult">0</b></span><span>costo totale <b class="p-tot">0</b></span><span>totale / operazioni <b class="p-med">–</b></span></div>
      <p class="msg" aria-live="polite"></p>`;
    let S = [null], n = 0, ops = 0, tot = 0, ult = 0, prossimo = 1, soglia = 4, evento = "";
    function push() {
      let copie = 0;
      if (n === S.length) { const T = Array(2 * S.length).fill(null); for (let i = 0; i < n; i++) T[i] = S[i]; copie = n; S = T; evento = `Array pieno: raddoppio la capacità a ${S.length} copiando ${copie} elementi.`; }
      else evento = "C'è spazio: costo 1.";
      S[n++] = prossimo++;
      ops++; ult = 1 + copie; tot += ult;
    }
    function pop() {
      if (n === 0) { evento = "Pila vuota: <b>underflow</b>."; return; }
      n--; S[n] = null;
      let copie = 0;
      const limite = soglia === 4 ? n > 1 && n === S.length / 4 : n > 0 && n === S.length / 2;
      if (limite) { const T = Array(S.length / 2).fill(null); for (let i = 0; i < n; i++) T[i] = S[i]; copie = n; S = T; evento = `Occupazione scesa a 1/${soglia}: dimezzo la capacità a ${S.length} copiando ${copie} elementi.`; }
      else evento = "Nessuna contrazione: costo 1.";
      ops++; ult = 1 + copie; tot += ult;
    }
    function disegna() {
      vistaArray($(".p-arr", box), S, { cls: S.map((v, i) => (v == null ? "vuota" : i === n - 1 ? "piv" : "")), tag: S.map((_, i) => (i === n - 1 ? "top" : "")), piccolo: S.length > 16 });
      $(".p-n", box).textContent = n; $(".p-cap", box).textContent = S.length; $(".p-ops", box).textContent = ops;
      $(".p-ult", box).textContent = ult; $(".p-tot", box).textContent = tot; $(".p-med", box).textContent = ops ? (tot / ops).toFixed(2) : "–";
      $(".msg", box).innerHTML = (evento ? evento + " " : "") + (soglia === 4
        ? "Con raddoppio a pieno e dimezzamento a 1/4, dopo ogni ridimensionamento l'array è pieno a metà: servono molte operazioni economiche prima del prossimo. Il costo medio resta costante."
        : "Con il dimezzamento a 1/2, dopo una contrazione l'array è pieno: un push lo fa raddoppiare e il pop successivo lo fa dimezzare. Prova «push/pop alternati»: ogni operazione costa Θ(n).");
    }
    suSeg(box, ".seg", (v) => { soglia = +v; S = [null]; n = ops = tot = ult = 0; prossimo = 1; evento = ""; disegna(); });
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-p]");
      if (!b) return;
      const k = b.dataset.p;
      if (k === "push") push();
      if (k === "pop") pop();
      if (k === "dieci") for (let i = 0; i < 10; i++) push();
      if (k === "alterna") { for (let i = 0; i < 8; i++) { push(); pop(); } evento = "Otto coppie push/pop: guarda il costo totale. " + evento; }
      if (k === "zero") { S = [null]; n = ops = tot = ult = 0; prossimo = 1; evento = ""; }
      disegna();
    });
    disegna();
  }

  /* coda su array circolare con head, tail e size (indici da 1 come nei lucidi) */
  function codaCircolare(box) {
    box.classList.add("sim");
    const L = +(box.dataset.n || 8);
    box.innerHTML = `<div class="sim-riga"><button type="button" class="btn primario" data-q="enq">enqueue</button><button type="button" class="btn" data-q="deq">dequeue</button><button type="button" class="btn" data-q="zero">Svuota</button></div>
      <div class="q-arr"></div>
      <div class="contatori"><span>head <b class="q-h">1</b></span><span>tail <b class="q-t">1</b></span><span>size <b class="q-s">0</b></span><span>length <b>${L}</b></span></div>
      <p class="msg" aria-live="polite">enqueue scrive in buf[tail] e avanza tail; dequeue legge buf[head] e avanza head. Il modulo fa ripartire gli indici da 1 dopo l'ultima cella.</p>`;
    let buf = Array(L).fill(null), head = 1, tail = 1, size = 0, prossimo = 1, ultimo = null;
    function disegna(m) {
      vistaArray($(".q-arr", box), buf, {
        cls: buf.map((v, i) => (v == null ? "vuota" : "") + (i + 1 === ultimo ? " swp" : "")),
        tag: buf.map((_, i) => [i + 1 === head ? "head" : "", i + 1 === tail ? "tail" : ""].filter(Boolean).join(" "))
      });
      $(".q-h", box).textContent = head; $(".q-t", box).textContent = tail; $(".q-s", box).textContent = size;
      if (m) $(".msg", box).innerHTML = m;
    }
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-q]");
      if (!b) return;
      const k = b.dataset.q;
      if (k === "enq") {
        if (size === L) { disegna("size == length: <b>overflow</b>, la coda è piena."); return; }
        const t = tail;
        buf[tail - 1] = prossimo++;
        tail = (tail % L) + 1; size++; ultimo = t;
        disegna(`Scritto ${buf[t - 1]} in buf[${t}]; tail = (${t} mod ${L}) + 1 = ${tail}.`);
      }
      if (k === "deq") {
        if (size === 0) { disegna("size == 0: <b>underflow</b>, la coda è vuota."); return; }
        const h = head, x = buf[head - 1];
        buf[head - 1] = null;
        head = (head % L) + 1; size--; ultimo = h;
        disegna(`Estratto ${x} da buf[${h}]; head = (${h} mod ${L}) + 1 = ${head}. Il primo entrato è il primo a uscire.`);
      }
      if (k === "zero") { buf = Array(L).fill(null); head = tail = 1; size = 0; prossimo = 1; ultimo = null; disegna("Coda svuotata."); }
    });
    disegna();
  }

  /* ===================================================================
     Capitolo 5 — Alberi, BST e AVL
     =================================================================== */
  /* visite in profondità (pre, in, post-ordine) e in ampiezza */
  function visite(box) {
    box.classList.add("sim");
    const N = (k, l, r) => ({ k, l: l || null, r: r || null });
    const rad = N("F", N("B", N("A"), N("D", N("C"), N("E"))), N("G", null, N("I", N("H"))));
    box.innerHTML = `<div class="sim-riga">${seg("Visita", [["pre", "pre-ordine"], ["in", "in-ordine"], ["post", "post-ordine"], ["bfs", "ampiezza (BFS)"]], "pre")}</div>
      <svg aria-label="Albero binario visitato"></svg>
      <div class="corsia"><span class="etichetta"><span>Ordine di visita</span></span><div class="fila v-ord"></div></div>
      <div class="corsia v-coda" hidden><span class="etichetta"><span>Coda Q</span></span><div class="fila v-q"></div></div>
      <p class="msg" aria-live="polite"></p>`;
    const svg = $("svg", box);
    function traccia(tipo) {
      const P = [], ordine = [];
      const snap = (cur, m, q) => P.push({ cur, ord: ordine.slice(), m, q: q ? q.slice() : null });
      snap(null, "Premi ▶: il numero a penna accanto a ogni nodo è il suo turno di visita.");
      if (tipo === "bfs") {
        const Q = [rad];
        snap(null, "enqueue della radice.", Q.map((x) => x.k));
        while (Q.length) {
          const x = Q.shift();
          ordine.push(x.k);
          const figli = [x.l, x.r].filter(Boolean);
          figli.forEach((c) => Q.push(c));
          snap(x.k, `dequeue di ${x.k}, visita, enqueue dei figli${figli.length ? " " + figli.map((c) => c.k).join(" e ") : ": nessuno"}.`, Q.map((c) => c.k));
        }
      } else {
        (function vis(x) {
          if (!x) return;
          if (tipo === "pre") { ordine.push(x.k); snap(x.k, `Visito ${x.k} <b>prima</b> dei suoi sottoalberi.`); }
          vis(x.l);
          if (tipo === "in") { ordine.push(x.k); snap(x.k, `Finito il sottoalbero sinistro: visito ${x.k}, poi il destro.`); }
          vis(x.r);
          if (tipo === "post") { ordine.push(x.k); snap(x.k, `Visito ${x.k} <b>dopo</b> entrambi i sottoalberi.`); }
        })(rad);
      }
      snap(null, `Ordine ${tipo === "bfs" ? "per livelli" : tipo === "in" ? "simmetrico (in un BST darebbe le chiavi in ordine crescente)" : tipo === "pre" ? "anticipato" : "posticipato"}: ${ordine.join(" ")}. Ogni nodo è visitato una volta: Θ(n).`);
      return P;
    }
    const pl = conPlayer(box, (s) => {
      if (!s.ord) return;
      (function marca(x) { if (!x) return; const i = s.ord.indexOf(x.k); x.a = i >= 0 ? String(i + 1) : ""; x.cls = x.k === s.cur ? "cur" : i >= 0 ? "ok" : ""; marca(x.l); marca(x.r); })(rad);
      vistaAlbero(svg, rad, { dx: 50, dy: 58 });
      $(".v-ord", box).innerHTML = s.ord.length ? s.ord.map((k, i) => `<span class="chip${i === s.ord.length - 1 && s.cur ? " nuovo cima" : ""}">${k}</span>`).join("") : '<span class="vuoto">nessun nodo visitato</span>';
      $(".v-coda", box).hidden = !s.q;
      if (s.q) $(".v-q", box).innerHTML = s.q.length ? s.q.map((k) => `<span class="chip">${k}</span>`).join("") : '<span class="vuoto">vuota</span>';
      $(".msg", box).innerHTML = s.m;
    }, { intervallo: 1000 });
    suSeg(box, ".seg", (v) => pl.carica(traccia(v)));
    pl.carica(traccia("pre"));
  }

  /* BST e AVL: inserimento, cancellazione e ricerca, con le rotazioni passo per passo */
  function alberoRicerca(box) {
    box.classList.add("sim");
    let modo = box.dataset.modo || "bst";
    box.innerHTML = `<div class="sim-riga">${seg("Tipo di albero", [["bst", "BST"], ["avl", "AVL"]], modo)}</div>
      <div class="sim-riga"><label>Chiave <input type="number" value="45" aria-label="Chiave"></label><button type="button" class="btn primario" data-op="ins">insert</button><button type="button" class="btn" data-op="del">delete</button><button type="button" class="btn" data-op="cerca">search</button></div>
      <div class="sim-riga"><label>Sequenza <input type="text" value="${esc(box.dataset.seq || "50 20 10 60 40 45")}" aria-label="Sequenza di chiavi da inserire"></label><button type="button" class="btn" data-op="seq">Inserisci tutte</button><button type="button" class="btn" data-op="vuoto">Svuota</button></div>
      <svg aria-label="Albero di ricerca"></svg>
      <div class="contatori"><span>nodi <b class="t-n">0</b></span><span>altezza <b class="t-h">−1</b></span><span>altezza minima possibile <b class="t-min">−1</b></span></div>
      <p class="msg" aria-live="polite"></p>`;
    const svg = $("svg", box), [inpK, inpS] = $$("input", box);
    let root = null;
    const clona = (n) => n && { k: n.k, l: clona(n.l), r: clona(n.r) };
    const alt = (n) => (n ? 1 + Math.max(alt(n.l), alt(n.r)) : -1);
    const bil = (n) => alt(n.l) - alt(n.r);
    const conta = (n) => (n ? 1 + conta(n.l) + conta(n.r) : 0);
    const segnato = (b) => (b > 0 ? "+" + b : b < 0 ? "−" + -b : "0");
    function percorso(k) { const P = []; let x = root; while (x) { P.push(x); if (k === x.k) break; x = k < x.k ? x.l : x.r; } return P; }
    function aggancia(padre, vecchio, nuovo) { if (!padre) root = nuovo; else if (padre.l === vecchio) padre.l = nuovo; else padre.r = nuovo; }
    const rotDX = (u, p) => { const v = u.l; u.l = v.r; v.r = u; aggancia(p, u, v); return v; };
    const rotSX = (u, p) => { const v = u.r; u.r = v.l; v.l = u; aggancia(p, u, v); return v; };
    let passi = [];
    const snap = (m, evid = {}, cam = []) => passi.push({ t: clona(root), m, evid, cam: new Set(cam) });
    function ribilancia(u, p) {
      const b = bil(u);
      let caso, ops;
      if (b === 2) { if (bil(u.l) === -1) { caso = "SD"; ops = "rotazione SX su " + u.l.k + ", poi DX su " + u.k; rotSX(u.l, u); rotDX(u, p); } else { caso = "SS"; ops = "rotazione DX su " + u.k; rotDX(u, p); } }
      else { if (bil(u.r) === 1) { caso = "DS"; ops = "rotazione DX su " + u.r.k + ", poi SX su " + u.k; rotDX(u.r, u); rotSX(u, p); } else { caso = "DD"; ops = "rotazione SX su " + u.k; rotSX(u, p); } }
      return { caso, ops };
    }
    function inserisci(k, singolo) {
      const P = percorso(k);
      if (P.length && P[P.length - 1].k === k) { snap(`La chiave ${k} è già presente: in un dizionario le chiavi sono uniche.`, { [k]: "cur" }); return; }
      if (singolo) P.forEach((x, i) => snap(`Cerco la posizione di ${k}: ${k} ${k < x.k ? "&lt;" : "&gt;"} ${x.k}, vado a ${k < x.k ? "sinistra" : "destra"}.`, { [x.k]: "cur" }, P.slice(0, i + 1).map((y) => y.k)));
      const nodo = { k, l: null, r: null };
      const pad = P[P.length - 1];
      if (!pad) root = nodo; else if (k < pad.k) pad.l = nodo; else pad.r = nodo;
      snap(`Inserito ${k} come ${pad ? "foglia, figlio " + (k < pad.k ? "sinistro" : "destro") + " di " + pad.k : "radice"}.`, { [k]: "nuovo" });
      if (modo !== "avl") return;
      for (let i = P.length - 1; i >= 0; i--) {
        const u = P[i];
        if (Math.abs(bil(u)) === 2) {
          snap(`Risalendo verso la radice, ${u.k} ha β = ${segnato(bil(u))}: è il nodo critico.`, { [u.k]: "sbil", [k]: "nuovo" });
          const { caso, ops } = ribilancia(u, P[i - 1] || null);
          snap(`Sbilanciamento <b>${caso}</b> ⇒ ${ops}. Nell'inserimento basta una sola correzione: l'altezza del sottoalbero torna quella di prima.`, { [k]: "nuovo" });
          return;
        }
      }
    }
    function cancella(k) {
      const P = percorso(k), v = P[P.length - 1];
      if (!v || v.k !== k) { snap(`La chiave ${k} non è nell'albero.`); return; }
      let su;
      if (v.l && v.r) {
        const Q = [v]; let u = v.l; while (u) { Q.push(u); u = u.r; }
        u = Q.pop();
        snap(`${k} ha due figli: il suo predecessore è ${u.k}, il massimo del sottoalbero sinistro (non ha figlio destro).`, { [k]: "cur", [u.k]: "sbil" });
        v.k = u.k;
        const pu = Q[Q.length - 1];
        if (pu.l === u) pu.l = u.l; else pu.r = u.l;
        su = P.slice(0, -1).concat(Q);
        snap(`Copio ${u.k} al posto di ${k} e rimuovo il vecchio nodo ${u.k} (caso con al più un figlio).`, { [u.k]: "nuovo" });
      } else {
        const figlio = v.l || v.r;
        aggancia(P[P.length - 2] || null, v, figlio);
        su = P.slice(0, -1);
        snap(figlio ? `${k} ha un solo figlio: lo aggancio al padre di ${k}.` : `${k} è una foglia: la tolgo.`, figlio ? { [figlio.k]: "nuovo" } : {});
      }
      if (modo !== "avl") return;
      let rot = 0;
      for (let i = su.length - 1; i >= 0; i--) {
        const u = su[i];
        if (Math.abs(bil(u)) === 2) {
          snap(`${u.k} ha β = ${segnato(bil(u))}: nodo critico.`, { [u.k]: "sbil" });
          const { caso, ops } = ribilancia(u, su[i - 1] || null);
          rot++;
          snap(`Sbilanciamento <b>${caso}</b> ⇒ ${ops}.${rot > 1 ? " Nella cancellazione le rotazioni possono propagarsi fino alla radice." : " Nella cancellazione si continua a controllare fino alla radice."}`);
        }
      }
    }
    function cerca(k) {
      const P = percorso(k);
      if (!P.length) { snap("Albero vuoto: search restituisce NIL."); return; }
      P.forEach((x, i) => {
        const trovato = x.k === k;
        snap(trovato ? `Trovato ${k} dopo ${i + 1} confronti: costo O(h).` : `${k} ${k < x.k ? "&lt;" : "&gt;"} ${x.k}: scendo a ${k < x.k ? "sinistra" : "destra"}.`, { [x.k]: trovato ? "ok" : "cur" }, P.slice(0, i + 1).map((y) => y.k));
      });
      if (P[P.length - 1].k !== k) snap(`Sono arrivato a un figlio NIL: ${k} non c'è.`, {}, P.map((y) => y.k));
    }
    const pl = conPlayer(box, (s) => {
      if (!s.m) return;
      (function marca(x) {
        if (!x) return;
        x.cls = s.evid[x.k] || "";
        x.ramo = s.cam.has(x.k) ? "cammino" : "";
        x.a = modo === "avl" ? segnato(bil(x)) : "";
        marca(x.l); marca(x.r);
      })(s.t);
      vistaAlbero(svg, s.t, { dx: 44, dy: 56, r: 17, binario: true });
      const n = conta(s.t);
      $(".t-n", box).textContent = n;
      $(".t-h", box).textContent = alt(s.t);
      $(".t-min", box).textContent = n ? Math.ceil(Math.log2(n + 1)) - 1 : -1;
      $(".msg", box).innerHTML = s.m;
    }, { intervallo: 1100 });
    function esegui(f) {
      passi = [];
      f();
      if (!passi.length) snap("Albero vuoto.");
      pl.carica(passi);
      pl.player.vai(passi.length - 1);
    }
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-op]");
      if (!b) return;
      const k = Math.round(+inpK.value);
      const op = b.dataset.op;
      if (op === "ins" && Number.isFinite(k)) esegui(() => inserisci(k, true));
      if (op === "del" && Number.isFinite(k)) esegui(() => cancella(k));
      if (op === "cerca" && Number.isFinite(k)) esegui(() => cerca(k));
      if (op === "seq") esegui(() => { numeri(inpS.value).forEach((x) => inserisci(x, false)); snap(`Inserite ${numeri(inpS.value).join(", ")}${modo === "avl" ? " con ribilanciamento AVL" : " senza ribilanciamento"}. Usa ◀ per rivedere ogni passo.`); });
      if (op === "vuoto") { root = null; esegui(() => snap("Albero vuoto.")); }
      if (op !== "vuoto" && op !== "seq") inpK.select();
    });
    suSeg(box, ".seg", (v) => { modo = v; root = null; esegui(() => { numeri(inpS.value).forEach((x) => inserisci(x, false)); snap(`Stessa sequenza con un ${v === "avl" ? "albero AVL: β accanto a ogni nodo" : "BST semplice: nessun ribilanciamento"}.`); }); });
    esegui(() => { numeri(inpS.value).forEach((x) => inserisci(x, false)); snap(modo === "avl" ? "Albero AVL costruito dalla sequenza: accanto a ogni nodo c'è il fattore di bilanciamento β. Prova una chiave e premi insert o delete." : "BST costruito dalla sequenza. Prova una chiave e premi insert, delete o search."); });
  }

  /* MiniMax e AlphaBeta su un albero di gioco */
  function alfaBeta(box) {
    box.classList.add("sim");
    let alg = "ab", foglie = [3, 12, 8, 2, 4, 6, 14, 5, 2];
    box.innerHTML = `<div class="sim-riga">${seg("Algoritmo", [["mm", "MiniMax"], ["ab", "AlphaBeta"]], alg)}<button type="button" class="btn" data-g="caso">Foglie casuali</button></div>
      <svg aria-label="Albero di gioco"></svg>
      <div class="contatori"><span>foglie valutate <b class="g-f">0</b></span><span>α <b class="g-a">−∞</b></span><span>β <b class="g-b">+∞</b></span></div>
      <p class="msg" aria-live="polite"></p>`;
    const svg = $("svg", box);
    const inf = (x) => (x === Infinity ? "+∞" : x === -Infinity ? "−∞" : String(x));
    function costruisci() {
      let j = 0;
      const foglia = () => ({ id: "f" + j, v: foglie[j++], f: [] });
      return { id: "A", max: true, f: ["B", "C", "D"].map((id) => ({ id, max: false, f: [foglia(), foglia(), foglia()] })) };
    }
    function traccia() {
      const T = costruisci(), val = {}, potati = new Set(), P = [];
      let viste = 0;
      const snap = (cur, m, a, b) => P.push({ cur, val: Object.assign({}, val), potati: new Set(potati), m, a, b, viste });
      snap(null, alg === "ab" ? "La radice A è MAX, B, C e D sono MIN. Si parte con α = −∞ e β = +∞." : "La radice A è MAX, B, C e D sono MIN. MiniMax valuta tutte le foglie.", -Infinity, Infinity);
      (function rec(x, a, b) {
        if (!x.f.length) { viste++; val[x.id] = x.v; snap(x.id, `Foglia: valore ${x.v}.`, a, b); return x.v; }
        let ev = x.max ? -Infinity : Infinity;
        snap(x.id, `Entro in ${x.id} (${x.max ? "MAX" : "MIN"})${alg === "ab" ? ` con [α, β] = [${inf(a)}, ${inf(b)}]` : ""}.`, a, b);
        for (let i = 0; i < x.f.length; i++) {
          const v = rec(x.f[i], a, b);
          ev = x.max ? Math.max(ev, v) : Math.min(ev, v);
          if (alg === "ab") { if (x.max) a = Math.max(a, ev); else b = Math.min(b, ev); }
          val[x.id] = ev;
          snap(x.id, `${x.id} aggiorna il suo valore a ${ev}${alg === "ab" ? (x.max ? `, α = ${inf(a)}` : `, β = ${inf(b)}`) : ""}.`, a, b);
          if (alg === "ab" && b <= a && i < x.f.length - 1) {
            (function pota(y) { potati.add(y.id); y.f.forEach(pota); })({ id: "_", f: x.f.slice(i + 1) });
            snap(x.id, `β ≤ α (${inf(b)} ≤ ${inf(a)}): taglio ${x.max ? "β" : "α"}. ${x.max ? "Il MIN sopra non sceglierà mai questo ramo" : `Il MAX sopra ha già un'alternativa che vale ${inf(a)}, e qui non può ottenere più di ${inf(b)}`}: i figli rimasti non si valutano.`, a, b);
            break;
          }
        }
        return ev;
      })(T, -Infinity, Infinity);
      snap(null, `Valore della radice: <b>${val.A}</b>. ${alg === "ab" ? `AlphaBeta ha valutato ${viste} foglie su ${foglie.length}, con lo stesso risultato di MiniMax.` : `MiniMax ha valutato tutte le ${foglie.length} foglie: Θ(n) nodi.`}`, null, null);
      return { T, P };
    }
    let T;
    const pl = conPlayer(box, (s) => {
      if (!s.val) return;
      (function marca(x) {
        x.k = x.f.length ? (s.val[x.id] != null ? inf(s.val[x.id]) : "·") : String(x.v);
        x.cls = s.potati.has(x.id) ? "spento" : x.id === s.cur ? "cur" : s.val[x.id] != null ? "ok" : "";
        x.a = x.f.length ? x.id + (x.max ? " max" : " min") : "";
        x.f.forEach(marca);
      })(T);
      vistaAlbero(svg, T, { dx: 46, dy: 74, r: 17 });
      $(".g-f", box).textContent = s.viste;
      $(".g-a", box).textContent = s.a == null ? "–" : inf(s.a);
      $(".g-b", box).textContent = s.b == null ? "–" : inf(s.b);
      $(".msg", box).innerHTML = s.m;
    }, { intervallo: 1000 });
    function carica() { const r = traccia(); T = r.T; pl.carica(r.P); }
    suSeg(box, ".seg", (v) => { alg = v; carica(); });
    $("[data-g='caso']", box).addEventListener("click", () => { foglie = casuali(9, 0, 15); carica(); });
    carica();
  }

  /* ===================================================================
     Capitolo 6 — Tabelle hash
     =================================================================== */
  function tabellaHash(box) {
    box.classList.add("sim");
    let metodo = box.dataset.metodo || "lineare";
    box.innerHTML = `<div class="sim-riga">${seg("Gestione delle collisioni", [["catene", "concatenamento"], ["lineare", "ispezione lineare"], ["quadratica", "quadratica"], ["doppio", "doppio hashing"]], metodo)}</div>
      <div class="sim-riga"><label>m <input type="number" min="5" max="23" value="${esc(box.dataset.m || "11")}" aria-label="Dimensione della tabella"></label>
        <label>h′(k) <select aria-label="Funzione hash">
          <option value="div">k mod m</option>
          <option value="m25">⌊m · frac(k · 0,25)⌋</option>
          <option value="knuth">⌊m · frac(k · 0,618…)⌋</option>
        </select></label></div>
      <div class="sim-riga"><label>Chiave <input type="text" value="45" aria-label="Chiave" style="flex:0 1 7em"></label><button type="button" class="btn primario" data-h="ins">insert</button><button type="button" class="btn" data-h="del">delete</button><button type="button" class="btn" data-h="cerca">search</button></div>
      <div class="sim-riga"><label>Sequenza <input type="text" value="${esc(box.dataset.seq || "50 20 10 60 40 45")}" aria-label="Chiavi da inserire"></label><button type="button" class="btn" data-h="seq">Inserisci tutte</button><button type="button" class="btn" data-h="vuota">Svuota</button></div>
      <div class="h-vista"></div>
      <div class="contatori"><span>n <b class="h-n">0</b></span><span>m <b class="h-m">11</b></span><span>α = n/m <b class="h-a">0</b></span><span>ispezioni dell'ultima operazione <b class="h-isp">–</b></span></div>
      <p class="msg h-formula"></p><p class="msg" aria-live="polite"></p>`;
    const [inpM] = $$("input[type=number]", box), sel = $("select", box), [inpK, inpS] = $$("input[type=text]", box), vista = $(".h-vista", box);
    const msgF = $(".h-formula", box), msg = $$(".msg", box)[1];
    const DEL = "DEL";
    let m = 11, T = [], ultimo = { celle: [], fine: null };
    const phi = (Math.sqrt(5) - 1) / 2;
    const hp = (k) => { const f = sel.value; if (f === "div") return ((k % m) + m) % m; const C = f === "m25" ? 0.25 : phi; return Math.floor(m * ((k * C) % 1)); };
    const h2 = (k) => (((k % (m - 1)) + (m - 1)) % (m - 1)) + 1;
    const h = (k, i) => (metodo === "lineare" ? (hp(k) + i) % m : metodo === "quadratica" ? (hp(k) + i * i) % m : (hp(k) + i * h2(k)) % m);
    const nElem = () => (metodo === "catene" ? T.reduce((s, L) => s + L.length, 0) : T.filter((x) => x != null && x !== DEL).length);
    function formula() {
      const base = sel.value === "div" ? "h′(k) = k mod " + m : `h′(k) = ⌊${m} · frac(k · ${sel.value === "m25" ? "0,25" : "0,618…"})⌋`;
      msgF.innerHTML = metodo === "catene" ? `${base}; ogni slot è una lista, e insert aggiunge in testa.`
        : metodo === "lineare" ? `h(k, i) = (h′(k) + i) mod ${m}, con ${base}.`
        : metodo === "quadratica" ? `h(k, i) = (h′(k) + i²) mod ${m} (c₁ = 0, c₂ = 1), con ${base}. Attenzione: i² mod m non visita sempre tutti gli slot.`
        : `h(k, i) = (h′(k) + i · h₂(k)) mod ${m}, con ${base} e h₂(k) = (k mod ${m - 1}) + 1.`;
    }
    function nuova() { m = Math.max(5, Math.min(23, Math.round(+inpM.value || 11))); inpM.value = m; T = metodo === "catene" ? Array.from({ length: m }, () => []) : Array(m).fill(null); ultimo = { celle: [], fine: null }; formula(); }
    function inserisci(k) {
      if (metodo === "catene") { const j = hp(k); T[j].unshift(k); ultimo = { celle: [j], fine: j, k }; return `h(${k}) = ${j}: inserito in testa alla lista ${j}. Costo O(1).`; }
      const celle = [];
      for (let i = 0; i < m; i++) {
        const j = h(k, i); celle.push(j);
        if (T[j] == null || T[j] === DEL) { const era = T[j]; T[j] = k; ultimo = { celle, fine: j, k }; return `Sequenza di ispezione ${celle.join(" → ")}: ${k} va nello slot ${j}${era === DEL ? " (era DELETED: insert lo riusa)" : ""} dopo ${celle.length} ${celle.length === 1 ? "ispezione" : "ispezioni"}.`; }
      }
      ultimo = { celle, fine: null };
      return `<b>overflow</b>: dopo ${m} ispezioni (${celle.join(", ")}) nessuno slot libero${new Set(celle).size < m ? `: la sequenza ha visitato solo ${new Set(celle).size} slot diversi, non è una permutazione` : ""}.`;
    }
    function cancella(k) {
      if (metodo === "catene") { const j = hp(k), p = T[j].indexOf(k); ultimo = { celle: [j], fine: p >= 0 ? j : null }; if (p < 0) return `${k} non è nella lista ${j}.`; T[j].splice(p, 1); return `Tolto ${k} dalla lista ${j}: costo pari alla lunghezza della lista.`; }
      const celle = [];
      for (let i = 0; i < m; i++) {
        const j = h(k, i); celle.push(j);
        if (T[j] === k) { T[j] = DEL; ultimo = { celle, fine: j }; return `Trovato ${k} nello slot ${j} (ispezioni ${celle.join(" → ")}): lo segno <b>DELETED</b>, non NIL, altrimenti una ricerca successiva si fermerebbe qui.`; }
        if (T[j] == null) break;
      }
      ultimo = { celle, fine: null };
      return `${k} non c'è: la ricerca si è fermata ${celle.length === m ? "dopo m ispezioni" : "su uno slot NIL"} (${celle.join(" → ")}).`;
    }
    function cerca(k) {
      if (metodo === "catene") { const j = hp(k), p = T[j].indexOf(k); ultimo = { celle: [j], fine: p >= 0 ? j : null }; return p >= 0 ? `Trovato ${k} nella lista ${j} al ${p + 1}° posto.` : `${k} non c'è: visitata tutta la lista ${j} (${T[j].length} elementi).`; }
      const celle = [];
      for (let i = 0; i < m; i++) {
        const j = h(k, i); celle.push(j);
        if (T[j] === k) { ultimo = { celle, fine: j }; return `Trovato ${k} nello slot ${j} dopo ${celle.length} ${celle.length === 1 ? "ispezione" : "ispezioni"} (${celle.join(" → ")}). Gli slot DELETED si saltano, non fermano la ricerca.`; }
        if (T[j] == null) break;
      }
      ultimo = { celle, fine: null };
      return `${k} non c'è: ${celle.length} ispezioni (${celle.join(" → ")}), poi ${celle.length === m ? "tabella finita" : "uno slot NIL"}.`;
    }
    function disegna(testo) {
      const n = nElem(), a = n / m;
      if (metodo === "catene") {
        vista.className = "h-vista";
        vista.innerHTML = `<div style="display:grid;gap:4px">${T.map((L, j) => `<div class="lista-coll"><span class="chip${ultimo.celle.includes(j) ? " cima" : ""}" style="min-width:3.2em;justify-content:center">T[${j}]</span><span class="fr">→</span>${L.length ? L.map((x, p) => `<span class="nd${p === 0 && ultimo.k === x ? " cur" : ""}"><span>${x}</span><span>${p < L.length - 1 ? "•" : "/"}</span></span>${p < L.length - 1 ? '<span class="fr">→</span>' : ""}`).join("") : '<span class="vuoto" style="color:var(--ink-3);font-style:italic">NIL</span>'}</div>`).join("")}</div>`;
      } else {
        const tag = Array(m).fill(""), cls = T.map((x) => (x == null ? "vuota" : x === DEL ? "canc" : ""));
        ultimo.celle.forEach((j, i) => { tag[j] = (tag[j] ? tag[j] + "," : "i=") + i; cls[j] += " cmp"; });
        if (ultimo.fine != null) cls[ultimo.fine] = cls[ultimo.fine].replace(" cmp", "") + " swp";
        vistaArray(vista, T.map((x) => (x == null ? null : x === DEL ? "DEL" : x)), { cls, tag, base: 0 });
      }
      $(".h-n", box).textContent = n; $(".h-m", box).textContent = m; $(".h-a", box).textContent = a.toFixed(2).replace(".", ",");
      $(".h-isp", box).textContent = ultimo.celle.length ? (metodo === "catene" ? "1 slot" : ultimo.celle.length) : "–";
      const att = metodo === "catene" ? `Con il concatenamento una ricerca costa in media Θ(1 + α) = ${(1 + a).toFixed(2).replace(".", ",")}.`
        : a < 1 ? (metodo === "lineare" ? `Con l'ispezione lineare, in media: ricerca senza successo ≤ ½(1 + 1/(1−α)²) ≈ ${(0.5 * (1 + 1 / ((1 - a) * (1 - a)))).toFixed(1).replace(".", ",")}, con successo ≤ ½(1 + 1/(1−α)) ≈ ${(0.5 * (1 + 1 / (1 - a))).toFixed(1).replace(".", ",")} ispezioni.` : `Con sequenze equiprobabili, in media: senza successo ≤ 1/(1−α) ≈ ${(1 / (1 - a)).toFixed(1).replace(".", ",")}, con successo ≤ (1/α) ln(1/(1−α)) ≈ ${a > 0 ? ((1 / a) * Math.log(1 / (1 - a))).toFixed(1).replace(".", ",") : "1"} ispezioni.`) : "Tabella piena: α = 1.";
      msg.innerHTML = (testo ? testo + " " : "") + att;
    }
    function sequenza() { nuova(); const out = []; numeri(inpS.value).forEach((k) => out.push(inserisci(k))); ultimo = { celle: [], fine: null }; return `Inserite ${numeri(inpS.value).join(", ")}.${out.some((x) => x.includes("overflow")) ? " Almeno un inserimento è andato in overflow." : ""}`; }
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-h]");
      if (!b) return;
      const k = numeri(inpK.value)[0];
      const op = b.dataset.h;
      if (op === "seq") return disegna(sequenza());
      if (op === "vuota") { nuova(); return disegna("Tabella vuota."); }
      if (k == null) return;
      disegna(op === "ins" ? inserisci(k) : op === "del" ? cancella(k) : cerca(k));
    });
    suSeg(box, ".seg", (v) => { metodo = v; disegna(sequenza() + " Stesse chiavi, altra strategia."); });
    inpM.addEventListener("change", () => disegna(sequenza()));
    sel.addEventListener("change", () => disegna(sequenza()));
    if (box.dataset.funzione) sel.value = box.dataset.funzione;
    disegna(sequenza());
  }

  /* ===================================================================
     Capitolo 7 — Heap e code con priorità
     =================================================================== */
  function heapSim(box) {
    box.classList.add("sim");
    let tipo = box.dataset.tipo || "max", d = +(box.dataset.d || 2);
    box.innerHTML = `<div class="sim-riga">${seg("Tipo di heap", [["max", "max-heap"], ["min", "min-heap"]], tipo)}<span class="etichetta">d =</span>${seg("Arietà", [["2", "2"], ["3", "3"]], d)}</div>
      <div class="sim-riga"><label>Array <input type="text" value="${esc(box.dataset.arr || "4 1 3 2 16 9 10 14 8 7")}" aria-label="Valori dell'array"></label><button type="button" class="btn" data-hp="heapify">heapify</button><button type="button" class="btn" data-hp="sort">HeapSort</button></div>
      <div class="sim-riga"><label>Chiave <input type="number" value="15" aria-label="Chiave da inserire"></label><button type="button" class="btn primario" data-hp="ins">insert</button><button type="button" class="btn" data-hp="del">estrai la radice</button></div>
      <div class="sim-due"><div><svg aria-label="Heap come albero"></svg></div><div><div class="hp-arr"></div><div class="contatori"><span>dimensione dello heap <b class="hp-n">0</b></span><span>scambi <b class="hp-s">0</b></span></div></div></div>
      <p class="msg" aria-live="polite"></p>`;
    const svg = $("svg", box), [inpA] = $$("input[type=text]", box), inpK = $("input[type=number]", box);
    let A = [];           // A[0] è la radice, cioè A[1] dei lucidi
    const meglio = (x, y) => (tipo === "max" ? x > y : x < y);   // x deve stare sopra y?
    const figli = (i, n) => { const f = []; for (let c = i * d + 1; c <= i * d + d && c < n; c++) f.push(c); return f; };
    const padre = (i) => Math.floor((i - 1) / d);
    let P = [], scambi = 0;
    const snap = (a, n, cls, m) => P.push({ a: a.slice(), n, cls: Object.assign({}, cls), m, s: scambi });
    function muoviBasso(a, i, n) {
      while (true) {
        const f = figli(i, n);
        if (!f.length) { snap(a, n, { [i]: "ok" }, `${a[i]} non ha figli: fixHeap si ferma.`); return; }
        let c = f[0]; f.forEach((x) => { if (meglio(a[x], a[c])) c = x; });
        const cl = { [i]: "piv" }; f.forEach((x) => (cl[x] = "cmp"));
        if (meglio(a[c], a[i])) {
          snap(a, n, cl, `Il figlio ${tipo === "max" ? "maggiore" : "minore"} di ${a[i]} è ${a[c]}: viola l'ordine, li scambio.`);
          [a[i], a[c]] = [a[c], a[i]]; scambi++;
          snap(a, n, { [i]: "swp", [c]: "swp" }, `Scambiati: ora controllo ${a[c]} nella posizione ${c + 1}.`);
          i = c;
        } else { snap(a, n, cl, `${a[i]} ${tipo === "max" ? "≥" : "≤"} di tutti i figli: fixHeap si ferma.`); return; }
      }
    }
    function muoviAlto(a, i, n) {
      while (i > 0 && meglio(a[i], a[padre(i)])) {
        const p = padre(i);
        snap(a, n, { [i]: "cmp", [p]: "cmp" }, `${a[i]} ${tipo === "max" ? "&gt;" : "&lt;"} del padre ${a[p]}: sale.`);
        [a[i], a[p]] = [a[p], a[i]]; scambi++;
        snap(a, n, { [i]: "swp", [p]: "swp" }, `Scambiati.`);
        i = p;
      }
      snap(a, n, { [i]: "ok" }, i === 0 ? `${a[i]} è arrivato alla radice.` : `${a[i]} è al posto giusto: il padre ${a[padre(i)]} ${tipo === "max" ? "≥" : "≤"} ${a[i]}.`);
    }
    function heapify(a, n) {
      (function rec(i) {
        if (i >= n) return;
        figli(i, n).forEach(rec);
        if (figli(i, n).length) { snap(a, n, { [i]: "piv" }, `heapify: i sottoalberi dei figli di posizione ${i + 1} sono già heap, ora fixHeap(${i + 1}).`); muoviBasso(a, i, n); }
      })(0);
    }
    function nodoAlbero(a, n, i, cls) { return { k: a[i], a: String(i + 1), cls: (cls[i] || "").replace("piv", "cur"), f: figli(i, n).map((c) => nodoAlbero(a, n, c, cls)) }; }
    const pl = conPlayer(box, (s) => {
      if (!s.a) return;
      if (s.n) vistaAlbero(svg, nodoAlbero(s.a, s.n, 0, s.cls), { dx: d === 2 ? 40 : 34, dy: 56, r: 16 });
      else vistaAlbero(svg, null, { vuoto: "heap vuoto" });
      vistaArray($(".hp-arr", box), s.a, { cls: s.a.map((_, i) => (i >= s.n ? "ok" : s.cls[i] || "")), piccolo: s.a.length > 10 });
      $(".hp-n", box).textContent = s.n; $(".hp-s", box).textContent = s.s;
      $(".msg", box).innerHTML = s.m;
    }, { intervallo: 900 });
    function esegui(f) { P = []; scambi = 0; f(); pl.carica(P); }
    const op = {
      heapify() { A = numeri(inpA.value).slice(0, 15); const a = A.slice(); snap(a, a.length, {}, `Array di partenza, letto come albero ${d}-ario: non è ancora uno heap.`); heapify(a, a.length); A = a; snap(a, a.length, {}, `Ora è un ${tipo}-heap: la radice è il ${tipo === "max" ? "massimo" : "minimo"}. Costo di heapify: O(n).`); },
      sort() {
        A = numeri(inpA.value).slice(0, 15); const a = A.slice(); let n = a.length;
        snap(a, n, {}, "HeapSort: prima heapify, poi n − 1 estrazioni della radice.");
        heapify(a, n);
        snap(a, n, {}, `Heap costruito. Ora si scambia la radice con l'ultimo elemento dello heap, che si accorcia di uno.`);
        while (n > 1) {
          [a[0], a[n - 1]] = [a[n - 1], a[0]]; scambi++; n--;
          snap(a, n, { 0: "swp" }, `La radice ${a[n]} va in posizione ${n + 1}, definitiva. fixHeap sulla nuova radice.`);
          muoviBasso(a, 0, n);
        }
        A = a;
        snap(a, 0, {}, `Ordinato ${tipo === "max" ? "in modo crescente" : "in modo decrescente"}, in loco, in O(n log n).`);
      },
      ins() { const k = Math.round(+inpK.value); if (!Number.isFinite(k)) return; const a = A.slice(); a.push(k); snap(a, a.length, { [a.length - 1]: "piv" }, `insert(${k}): nuova foglia nell'ultima posizione libera, poi muoviAlto.`); muoviAlto(a, a.length - 1, a.length); A = a; },
      del() {
        if (!A.length) { snap([], 0, {}, "Heap vuoto."); return; }
        const a = A.slice(), r = a[0];
        a[0] = a[a.length - 1]; a.pop();
        if (!a.length) { A = a; snap(a, 0, {}, `Estratto ${r}: lo heap è vuoto.`); return; }
        snap(a, a.length, { 0: "piv" }, `Estratto ${r}. L'ultima foglia ${a[0]} va nella radice, poi muoviBasso.`);
        muoviBasso(a, 0, a.length); A = a;
      }
    };
    box.addEventListener("click", (e) => { const b = e.target.closest("button[data-hp]"); if (b) esegui(op[b.dataset.hp]); });
    suSeg(box, ".seg[aria-label='Tipo di heap']", (v) => { tipo = v; esegui(op.heapify); });
    suSeg(box, ".seg[aria-label='Arietà']", (v) => { d = +v; esegui(op.heapify); });
    esegui(op.heapify);
  }

  /* ===================================================================
     Capitolo 8 — Union-Find
     =================================================================== */
  function unionFind(box) {
    box.classList.add("sim");
    let modo = box.dataset.modo || "qu", eur = false, n = 8;
    box.innerHTML = `<div class="sim-riga">${seg("Algoritmo", [["qf", "QuickFind"], ["qu", "QuickUnion"]], modo)}<label><input type="checkbox" class="uf-eur"> <span class="uf-eur-nome">euristica sul rango</span></label></div>
      <div class="sim-riga"><label>x <input type="number" min="1" value="1" aria-label="Primo elemento"></label><label>y <input type="number" min="1" value="2" aria-label="Secondo elemento"></label><button type="button" class="btn primario" data-u="union">union(find(x), find(y))</button><button type="button" class="btn" data-u="find">find(x)</button></div>
      <div class="sim-riga"><button type="button" class="btn" data-u="reset">makeSet(1..8)</button><button type="button" class="btn" data-u="pessimo">Caso pessimo dei lucidi</button><button type="button" class="btn" data-u="circuito">Esempio del circuito</button></div>
      <svg aria-label="Foresta degli insiemi disgiunti"></svg>
      <div class="corsia"><span class="etichetta"><span class="uf-nome-arr">vettore dei padri p[i]</span></span><div class="uf-arr"></div></div>
      <div class="contatori"><span>insiemi <b class="uf-k">8</b></span><span>costo dell'ultima operazione <b class="uf-c">–</b></span><span>costo totale <b class="uf-t">0</b></span><span>altezza massima <b class="uf-h">0</b></span></div>
      <p class="msg" aria-live="polite"></p>`;
    const svg = $("svg", box), [ix, iy] = $$("input[type=number]", box), chk = $(".uf-eur", box);
    let p, rank, rep, membri, tot = 0, ultimo = null, evid = new Set();
    function reset(k) {
      n = k; tot = 0; ultimo = null; evid = new Set();
      p = Array.from({ length: n + 1 }, (_, i) => i); rank = Array(n + 1).fill(0);
      rep = Array.from({ length: n + 1 }, (_, i) => i); membri = {}; for (let i = 1; i <= n; i++) membri[i] = [i];
    }
    function find(x) {
      if (modo === "qf") { ultimo = 1; return { r: rep[x], cam: [x, rep[x]] }; }
      const cam = [x]; while (p[x] !== x) { x = p[x]; cam.push(x); }
      ultimo = cam.length; return { r: x, cam };
    }
    function union(A, B) {
      if (A === B) { ultimo = 0; return `${A} e ${B} sono già nello stesso insieme.`; }
      if (modo === "qf") {
        let da = B, a = A;
        if (eur && membri[A].length < membri[B].length) { da = A; a = B; }
        const sposta = membri[da];
        sposta.forEach((x) => (rep[x] = a));
        membri[a] = membri[a].concat(sposta); delete membri[da];
        ultimo = sposta.length; evid = new Set(sposta);
        return `Le ${sposta.length} foglie dell'insieme di ${da} passano sotto ${a}: costo ${sposta.length}.${eur ? " Con l'euristica sul peso si sposta sempre l'insieme più piccolo." : ""}`;
      }
      let a = A, b = B, nota = "";
      if (eur) {
        if (rank[a] < rank[b]) { [a, b] = [b, a]; nota = ` rank(${A}) &lt; rank(${B}): scambio i ruoli, l'albero più basso va sotto quello più alto.`; }
        else if (rank[a] === rank[b]) { rank[a]++; nota = ` Ranghi uguali: rank(${a}) cresce a ${rank[a]}.`; }
        else nota = ` rank(${a}) &gt; rank(${b}): il rango non cambia.`;
      }
      p[b] = a; ultimo = 1; evid = new Set([b]);
      return `La radice ${b} diventa figlia di ${a}: costo O(1).${nota}`;
    }
    function altezza(x) { let h = 0; const figli = []; for (let i = 1; i <= n; i++) if (i !== x && p[i] === x) figli.push(i); figli.forEach((c) => (h = Math.max(h, 1 + altezza(c)))); return h; }
    function disegna(testo) {
      let radici;
      if (modo === "qf") {
        radici = Object.keys(membri).map(Number).sort((a, b) => a - b).map((r) => ({ k: r, a: eur ? "size " + membri[r].length : "", cls: "ok", f: membri[r].slice().sort((a, b) => a - b).map((x) => ({ k: x, f: [], cls: evid.has(x) ? "nuovo" : "" })) }));
        $(".uf-nome-arr", box).textContent = "rappresentante di ogni elemento (find in O(1))";
        vistaArray($(".uf-arr", box), rep.slice(1), { cls: rep.slice(1).map((_, i) => (evid.has(i + 1) ? "swp" : "")), piccolo: n > 10 });
      } else {
        const nodo = (x) => ({ k: x, a: eur && p[x] === x ? "r" + rank[x] : "", cls: evid.has(x) ? "cur" : "", ramo: "", f: Array.from({ length: n }, (_, i) => i + 1).filter((c) => c !== x && p[c] === x).map(nodo) });
        radici = Array.from({ length: n }, (_, i) => i + 1).filter((x) => p[x] === x).map(nodo);
        $(".uf-nome-arr", box).textContent = "vettore dei padri p[i] (la radice ha p[i] = i)";
        vistaArray($(".uf-arr", box), p.slice(1), { cls: p.slice(1).map((v, i) => (evid.has(i + 1) ? "cmp" : v === i + 1 ? "ok" : "")), piccolo: n > 10 });
      }
      vistaAlbero(svg, radici, { dx: 40, dy: 54, r: 16, spazio: 0.5 });
      const k = modo === "qf" ? Object.keys(membri).length : p.slice(1).filter((v, i) => v === i + 1).length;
      $(".uf-k", box).textContent = k;
      $(".uf-c", box).textContent = ultimo == null ? "–" : ultimo;
      $(".uf-t", box).textContent = tot;
      $(".uf-h", box).textContent = modo === "qf" ? (k < n ? 1 : 0) : Math.max(0, ...Array.from({ length: n }, (_, i) => i + 1).filter((x) => p[x] === x).map(altezza));
      $(".uf-eur-nome", box).textContent = modo === "qf" ? "euristica sul peso" : "euristica sul rango";
      $(".msg", box).innerHTML = testo || "";
    }
    function fai(x, y) {
      const fx = find(x), fy = find(y), c = (modo === "qf" ? 2 : fx.cam.length + fy.cam.length);
      const m = union(fx.r, fy.r);
      tot += c + (ultimo || 0);
      return `find(${x}) = ${fx.r}, find(${y}) = ${fy.r}. ${m}`;
    }
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-u]");
      if (!b) return;
      const x = Math.round(+ix.value), y = Math.round(+iy.value), op = b.dataset.u;
      if (op === "reset") { reset(8); return disegna("makeSet(i) per i = 1..8: otto insiemi da un elemento."); }
      if (op === "pessimo") { reset(6); const t = []; [[5, 6], [4, 5], [3, 4], [2, 3], [1, 2]].forEach(([a, c]) => t.push(fai(a, c))); evid = new Set(); return disegna(`makeSet(1..6), poi union(5,6), union(4,5), union(3,4), union(2,3), union(1,2). ${modo === "qu" && !eur ? "Senza euristiche si ottiene una catena: find(6) costa n." : modo === "qu" ? "Con il rango l'albero resta basso: altezza ≤ log n." : ""}`); }
      if (op === "circuito") { reset(9); [[1, 4], [3, 6], [8, 9], [2, 5], [4, 5], [6, 9], [4, 7]].forEach(([a, c]) => fai(a, c)); evid = new Set(); return disegna("Pin 1..9 e collegamenti {1,4}, {3,6}, {8,9}, {2,5}, {4,5}, {6,9}, {4,7}. Due pin sono collegati se e solo se find dà lo stesso rappresentante: prova find su 7 e su 2, poi su 3 e su 8."); }
      if (!(x >= 1 && x <= n && y >= 1 && y <= n)) return disegna(`Gli elementi vanno da 1 a ${n}.`);
      evid = new Set();
      if (op === "find") { const f = find(x); tot += ultimo; evid = new Set(f.cam); return disegna(`find(${x}) = <b>${f.r}</b>${modo === "qu" ? `: risalgo ${f.cam.join(" → ")}, costo ${f.cam.length - 1} ${f.cam.length === 2 ? "passo" : "passi"} (O(altezza)).` : ": il padre di una foglia è il rappresentante, costo O(1)."}`); }
      disegna(fai(x, y));
    });
    chk.addEventListener("change", () => { eur = chk.checked; reset(8); disegna(eur ? (modo === "qf" ? "Euristica sul peso attiva: in union si spostano le foglie dell'insieme più piccolo." : "Euristica sul rango attiva: in union la radice più bassa va sotto quella più alta.") : "Nessuna euristica."); });
    suSeg(box, ".seg", (v) => { modo = v; reset(8); disegna(v === "qf" ? "QuickFind: ogni insieme è un albero di altezza 1, find è O(1) e union sposta tutte le foglie di un insieme." : "QuickUnion: foresta di alberi qualsiasi nel vettore dei padri, union è O(1) e find risale fino alla radice."); });
    reset(8);
    disegna(modo === "qf" ? "QuickFind: ogni insieme è un albero di altezza 1." : "QuickUnion: makeSet(1..8). Scegli x e y e premi union, oppure prova il caso pessimo.");
  }

  /* ===================================================================
     Capitolo 9 — Tecniche algoritmiche
     =================================================================== */
  const reali = (s) => (String(s).match(/-?\d+(?:[.,]\d+)?/g) || []).map((x) => +x.replace(",", "."));
  const num = (x) => (x === Infinity ? "∞" : Number.isInteger(x) ? String(x) : (Math.round(x * 100) / 100).toString().replace(".", ","));

  /* tabelle di programmazione dinamica riempite cella per cella */
  function pdTabella(box) {
    box.classList.add("sim");
    let prob = box.dataset.prob || "zaino";
    box.innerHTML = `<div class="sim-riga">${seg("Problema", [["zaino", "zaino 0/1"], ["lev", "Levenshtein"], ["sotto", "sottovettore massimo"], ["seam", "seam carving"]], prob)}</div>
      <div class="sim-riga pd-input"></div>
      <div class="scorri"><table class="tab-sim pd-tab"></table></div>
      <p class="msg" aria-live="polite"></p>`;
    const inBox = $(".pd-input", box), tab = $(".pd-tab", box);
    const INPUT = {
      zaino: `<label>pesi p <input type="text" data-k="p" value="2 7 6 4"></label><label>valori v <input type="text" data-k="v" value="12.7 6.4 1.7 0.3"></label><label>capacità P <input type="number" data-k="P" value="10" min="1" max="15"></label><button type="button" class="btn" data-pd="vai">Ricalcola</button>`,
      lev: `<label>S <input type="text" data-k="S" value="ALBERO" style="flex:0 1 9em"></label><label>T <input type="text" data-k="T" value="LIBRO" style="flex:0 1 9em"></label><button type="button" class="btn" data-pd="vai">Ricalcola</button>`,
      sotto: `<label>V <input type="text" data-k="V" value="3 -5 10 2 -3 1 4 -8 7 -6 -1"></label><button type="button" class="btn" data-pd="vai">Ricalcola</button>`,
      seam: `<span class="etichetta">Matrice E dei lucidi (4 × 5)</span>`
    };
    const val = (k) => { const e = $(`[data-k="${k}"]`, inBox); return e ? e.value : ""; };
    function costruisci() {
      const P = [];  // passi: { r, c, v, dip: [[r,c]], m }
      let righe, colonne, celle, cam = [], fine;
      if (prob === "zaino") {
        const p = numeri(val("p")).slice(0, 6), v = reali(val("v")).slice(0, p.length), Cap = Math.max(1, Math.min(15, Math.round(+val("P") || 10)));
        const n = Math.min(p.length, v.length);
        righe = Array.from({ length: n }, (_, i) => `${i + 1} (p ${p[i]}, v ${num(v[i])})`); colonne = Array.from({ length: Cap + 1 }, (_, j) => j);
        const V = Array.from({ length: n }, () => Array(Cap + 1).fill(0)), K = V.map((r) => r.map(() => false));
        for (let i = 0; i < n; i++) for (let j = 0; j <= Cap; j++) {
          if (i === 0) { V[0][j] = j >= p[0] ? v[0] : 0; K[0][j] = j >= p[0]; P.push({ r: 0, c: j, v: V[0][j], dip: [], m: `Caso base, solo l'oggetto 1: ${j >= p[0] ? `j = ${j} ≥ ${p[0]}, ci sta: V = ${num(v[0])}` : `j = ${j} &lt; ${p[0]}, non ci sta: V = 0`}.` }); continue; }
          if (j < p[i]) { V[i][j] = V[i - 1][j]; P.push({ r: i, c: j, v: V[i][j], dip: [[i - 1, j]], m: `j = ${j} &lt; p[${i + 1}] = ${p[i]}: l'oggetto ${i + 1} non entra, V[${i + 1},${j}] = V[${i},${j}] = ${num(V[i][j])}.` }); continue; }
          const senza = V[i - 1][j], con = V[i - 1][j - p[i]] + v[i];
          V[i][j] = Math.max(senza, con); K[i][j] = con > senza;
          P.push({ r: i, c: j, v: V[i][j], dip: [[i - 1, j], [i - 1, j - p[i]]], m: `V[${i + 1},${j}] = max{ V[${i},${j}] = ${num(senza)}, V[${i},${j - p[i]}] + ${num(v[i])} = ${num(con)} } = <b>${num(V[i][j])}</b> (${con > senza ? "prendo" : "non prendo"} l'oggetto ${i + 1}).` });
        }
        let j = Cap; const scelti = [];
        for (let i = n - 1; i >= 0; i--) { cam.push([i, j]); if (K[i][j]) { scelti.unshift(i + 1); j -= p[i]; } }
        fine = `Valore ottimo V[${n},${Cap}] = <b>${num(V[n - 1][Cap])}</b>, oggetti scelti: {${scelti.join(", ")}}. Si ricostruisce dal basso con la tabella K (in verde le celle visitate). Costo Θ(nP): pseudopolinomiale, perché P è un valore, non una dimensione.`;
        celle = V;
      } else if (prob === "lev") {
        const S = (val("S") || "").toUpperCase().slice(0, 10), T = (val("T") || "").toUpperCase().slice(0, 10), n = S.length, m = T.length;
        righe = ["“”", ...S]; colonne = ["“”", ...T];
        const L = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
        for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
          if (i === 0 || j === 0) { L[i][j] = Math.max(i, j); P.push({ r: i, c: j, v: L[i][j], dip: [], m: `Caso base: trasformare ${i ? `“${S.slice(0, i)}”` : "la stringa vuota"} in ${j ? `“${T.slice(0, j)}”` : "la stringa vuota"} costa ${L[i][j]}.` }); continue; }
          const ug = S[i - 1] === T[j - 1], c = L[i - 1][j] + 1, ins = L[i][j - 1] + 1, sost = L[i - 1][j - 1] + (ug ? 0 : 1);
          L[i][j] = Math.min(c, ins, sost);
          P.push({ r: i, c: j, v: L[i][j], dip: [[i - 1, j], [i, j - 1], [i - 1, j - 1]], m: `“${S.slice(0, i)}” → “${T.slice(0, j)}”: cancello ${S[i - 1]} (${c}), inserisco ${T[j - 1]} (${ins}), ${ug ? `${S[i - 1]} = ${T[j - 1]} lascio invariato` : `sostituisco ${S[i - 1]} con ${T[j - 1]}`} (${sost}). Minimo <b>${L[i][j]}</b>.` });
        }
        let i = n, j = m; const ops = [];
        while (i > 0 || j > 0) {
          cam.push([i, j]);
          if (i > 0 && j > 0 && L[i][j] === L[i - 1][j - 1] + (S[i - 1] === T[j - 1] ? 0 : 1)) { ops.unshift(S[i - 1] === T[j - 1] ? `lascio ${S[i - 1]}` : `${S[i - 1]}→${T[j - 1]}`); i--; j--; }
          else if (i > 0 && L[i][j] === L[i - 1][j] + 1) { ops.unshift(`cancello ${S[i - 1]}`); i--; }
          else { ops.unshift(`inserisco ${T[j - 1]}`); j--; }
        }
        cam.push([0, 0]);
        fine = `Distanza di Levenshtein tra ${S} e ${T}: <b>${L[n][m]}</b>. Una sequenza ottima: ${ops.join(", ")}. Costo Θ(nm).`;
        celle = L;
      } else if (prob === "sotto") {
        const V = reali(val("V")).slice(0, 14), n = V.length;
        righe = ["V", "S"]; colonne = V.map((_, i) => i + 1);
        const Sx = Array(n).fill(0);
        celle = [V.slice(), Sx];
        let imax = 0;
        for (let i = 0; i < n; i++) {
          if (i === 0) { Sx[0] = V[0]; P.push({ r: 1, c: 0, v: Sx[0], dip: [[0, 0]], m: `S[1] = V[1] = ${num(V[0])}.` }); continue; }
          const est = Sx[i - 1] + V[i];
          Sx[i] = est >= V[i] ? est : V[i];
          if (Sx[i] > Sx[imax]) imax = i;
          P.push({ r: 1, c: i, v: Sx[i], dip: [[1, i - 1], [0, i]], m: `S[${i + 1}] = max{ V[${i + 1}] = ${num(V[i])}, S[${i}] + V[${i + 1}] = ${num(est)} } = <b>${num(Sx[i])}</b>: ${est >= V[i] ? "conviene estendere il sottovettore precedente" : "conviene ricominciare da qui"}.` });
        }
        let s = imax; while (Sx[s] !== V[s]) s--;
        for (let x = s; x <= imax; x++) cam.push([1, x]);
        fine = `La somma massima è S[${imax + 1}] = <b>${num(Sx[imax])}</b>; risalendo finché S[i] ≠ V[i] il sottovettore inizia in ${s + 1}: V[${s + 1}..${imax + 1}]. Costo Θ(n).`;
      } else {
        const E = [[0.1, 0.0, 0.2, 0.9, 0.8], [0.9, 0.2, 0.8, 0.4, 0.7], [0.8, 0.8, 0.1, 0.7, 0.8], [0.1, 0.0, 0.6, 0.5, 0.7]], M = 4, N = 5;
        righe = [1, 2, 3, 4]; colonne = [1, 2, 3, 4, 5];
        const W = E.map((r) => r.map(() => 0));
        for (let i = 0; i < M; i++) for (let j = 0; j < N; j++) {
          if (i === 0) { W[0][j] = E[0][j]; P.push({ r: 0, c: j, v: W[0][j], dip: [], m: `Prima riga: W[1,${j + 1}] = E[1,${j + 1}] = ${num(E[0][j])}.` }); continue; }
          const sopra = [j - 1, j, j + 1].filter((c) => c >= 0 && c < N);
          const mn = Math.min(...sopra.map((c) => W[i - 1][c]));
          W[i][j] = Math.round((E[i][j] + mn) * 10) / 10;
          P.push({ r: i, c: j, v: W[i][j], dip: sopra.map((c) => [i - 1, c]), m: `W[${i + 1},${j + 1}] = E[${i + 1},${j + 1}] + min{${sopra.map((c) => num(W[i - 1][c])).join(", ")}} = ${num(E[i][j])} + ${num(mn)} = <b>${num(W[i][j])}</b>.` });
        }
        let j = W[M - 1].indexOf(Math.min(...W[M - 1]));
        for (let i = M - 1; i >= 0; i--) {
          cam.push([i, j]);
          if (i > 0) { const sopra = [j - 1, j, j + 1].filter((c) => c >= 0 && c < N); j = sopra.reduce((b, c) => (W[i - 1][c] < W[i - 1][b] ? c : b), sopra[0]); }
        }
        fine = `La cucitura di peso minimo vale <b>${num(Math.min(...W[M - 1]))}</b>: in verde, risalendo ogni volta verso il minimo dei tre pixel sopra. Costo Θ(MN).`;
        celle = W;
      }
      return { P, righe, colonne, celle, cam, fine };
    }
    let D;
    const pl = conPlayer(box, (s, i) => {
      if (!D) return;
      const fatte = new Set(), dip = new Set(), cam = new Set();
      const k = (r, c) => r + "," + c;
      const ultimo = i >= D.P.length + 1;
      if (prob === "sotto") D.colonne.forEach((_, c) => fatte.add(k(0, c)));
      for (let x = 0; x < Math.min(i, D.P.length); x++) fatte.add(k(D.P[x].r, D.P[x].c));
      const cur = i >= 1 && i <= D.P.length ? D.P[i - 1] : null;
      if (cur) cur.dip.forEach(([r, c]) => dip.add(k(r, c)));
      if (ultimo) D.cam.forEach(([r, c]) => cam.add(k(r, c)));
      const valore = (r, c) => { const v = prob === "sotto" && r === 0 ? D.celle[0][c] : (D.P.find((p) => p.r === r && p.c === c) || {}).v; return v == null ? "" : num(v); };
      tab.innerHTML = `<thead><tr><th></th>${D.colonne.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${D.righe.map((rl, r) => `<tr><th>${esc(rl)}</th>${D.colonne.map((_, c) => {
        const key = k(r, c), cl = [cur && cur.r === r && cur.c === c ? "cmp" : "", dip.has(key) ? "dip" : "", cam.has(key) ? "cam" : ""].filter(Boolean).join(" ");
        return `<td class="${cl}">${fatte.has(key) ? valore(r, c) : ""}</td>`;
      }).join("")}</tr>`).join("")}</tbody>`;
      $(".msg", box).innerHTML = i === 0 ? "Premi ▶: la tabella si riempie una cella alla volta. La cella gialla è quella in calcolo, quelle bordate in arancio sono i sottoproblemi da cui dipende." : ultimo ? D.fine : cur.m;
    }, { intervallo: 700 });
    function carica() { D = costruisci(); pl.carica(Array(D.P.length + 2).fill({ x: 1 })); }
    function input() { inBox.innerHTML = INPUT[prob]; }
    suSeg(box, ".seg", (v) => { prob = v; input(); carica(); });
    inBox.addEventListener("click", (e) => { if (e.target.closest("[data-pd]")) carica(); });
    inBox.addEventListener("keydown", (e) => { if (e.key === "Enter") carica(); });
    input(); carica();
  }

  /* costruzione dei codici di Huffman con una coda con priorità */
  function huffman(box) {
    box.classList.add("sim");
    box.innerHTML = `<div class="sim-riga"><label>Frequenze <input type="text" value="${esc(box.dataset.freq || "a:45 b:13 c:12 d:16 e:9 f:5")}" aria-label="Caratteri e frequenze"></label><button type="button" class="btn" data-hf="vai">Ricostruisci</button></div>
      <div class="corsia"><span class="etichetta"><span>Coda con priorità Q (minimo a sinistra)</span></span><div class="fila hf-q"></div></div>
      <svg aria-label="Albero di Huffman"></svg>
      <div class="hf-codici"></div>
      <p class="msg" aria-live="polite"></p>`;
    const inp = $("input", box), svg = $("svg", box);
    function traccia() {
      const coppie = (inp.value.match(/([^\s:,]+)\s*:\s*(\d+)/g) || []).map((x) => { const [c, f] = x.split(":"); return { c: c.trim(), f: +f, id: c.trim() }; }).slice(0, 10);
      if (coppie.length < 2) return [{ q: [], radici: [], m: "Servono almeno due caratteri, nel formato a:45 b:13 …" }];
      let Q = coppie.map((x) => ({ k: x.c, f: x.f, foglia: true, fl: [] })), P = [], cont = 0;
      const ord = () => Q.sort((a, b) => a.f - b.f || (a.foglia === b.foglia ? 0 : a.foglia ? -1 : 1));
      ord();
      const snap = (m, nuovo) => P.push({ q: Q.map((x) => ({ k: x.k, f: x.f, nuovo: x === nuovo })), radici: Q.map(clona), m });
      const clona = (x) => ({ k: x.foglia ? `${x.k}:${x.f}` : String(x.f), f: (x.fl || []).map(clona), cls: x.foglia ? "ok" : x.cls || "", a: x.etich || "", aSx: x.etichSx });
      snap(`Q contiene un nodo per ogni carattere, con la sua frequenza.`);
      while (Q.length > 1) {
        const z1 = Q.shift(), z2 = Q.shift();
        z1.etich = "0"; z1.etichSx = true; z2.etich = "1"; z2.etichSx = false;
        const z = { k: "n" + ++cont, f: z1.f + z2.f, foglia: false, fl: [z1, z2], cls: "nuovo" };
        Q.push(z); ord();
        snap(`Estraggo i due minimi (${z1.foglia ? z1.k : "nodo"} ${z1.f} e ${z2.foglia ? z2.k : "nodo"} ${z2.f}) e li unisco sotto un nuovo nodo di frequenza ${z.f}, che torna in Q.`, z);
        z.cls = "";
      }
      const codici = [];
      (function cod(x, s) { if (x.foglia) codici.push([x.k, x.f, s || "0"]); else { cod(x.fl[0], s + "0"); cod(x.fl[1], s + "1"); } })(Q[0], "");
      const tot = codici.reduce((a, [, f, s]) => a + f * s.length, 0), somma = codici.reduce((a, [, f]) => a + f, 0);
      const bitFissi = Math.ceil(Math.log2(codici.length));
      P[P.length - 1].codici = codici;
      P[P.length - 1].m = `Resta un solo nodo: è la radice. Arco sinistro 0, destro 1. Lunghezza media ${(tot / somma).toFixed(2).replace(".", ",")} bit per carattere, contro ${bitFissi} di un codice a lunghezza fissa. Con n caratteri, n − 1 fusioni da O(log n): O(n log n).`;
      return P;
    }
    const pl = conPlayer(box, (s) => {
      if (!s.q) return;
      $(".hf-q", box).innerHTML = s.q.map((x) => `<span class="chip${x.nuovo ? " nuovo cima" : ""}">${x.k.startsWith("n") ? "•" : x.k}<small>${x.f}</small></span>`).join("") || '<span class="vuoto">vuota</span>';
      vistaAlbero(svg, s.radici, { dx: 52, dy: 54, r: 19, spazio: 0.4 });
      $(".hf-codici", box).innerHTML = s.codici ? `<div class="tab-wrap"><table class="tab"><thead><tr><th>carattere</th><th class="num">frequenza</th><th>codice</th></tr></thead><tbody>${s.codici.map(([c, f, x]) => `<tr><td>${esc(c)}</td><td class="num">${f}</td><td><code>${x}</code></td></tr>`).join("")}</tbody></table></div>` : "";
      $(".msg", box).innerHTML = s.m;
    }, { intervallo: 1300 });
    $("[data-hf]", box).addEventListener("click", () => pl.carica(traccia()));
    pl.carica(traccia());
  }

  /* torri di Hanoi */
  function hanoi(box) {
    box.classList.add("sim");
    box.innerHTML = `<div class="sim-riga"><span class="etichetta">dischi</span>${seg("Numero di dischi", [3, 4, 5].map((n) => [n, n]), 3)}</div>
      <svg viewBox="0 0 540 170" class="hn-svg" aria-label="Torri di Hanoi" style="width:100%;max-width:600px;height:auto;display:block;margin-inline:auto"></svg>
      <p class="msg" aria-live="polite"></p>`;
    const svg = $("svg", box);
    function traccia(n) {
      const pioli = [Array.from({ length: n }, (_, i) => n - i), [], []], P = [];
      const snap = (m, da, a) => P.push({ p: pioli.map((x) => x.slice()), m, da, a });
      snap(`${n} dischi sul piolo 1: servono 2<sup>${n}</sup> − 1 = ${2 ** n - 1} mosse.`);
      let k = 0;
      (function h(da, via, a, m) {
        if (m === 1) { pioli[a].push(pioli[da].pop()); snap(`Mossa ${++k}: disco ${pioli[a][pioli[a].length - 1]} dal piolo ${da + 1} al piolo ${a + 1}.`, da, a); return; }
        h(da, a, via, m - 1);
        pioli[a].push(pioli[da].pop()); snap(`Mossa ${++k}: spostati i ${m - 1} dischi sopra, il disco ${m} va dal piolo ${da + 1} al piolo ${a + 1}.`, da, a);
        h(via, da, a, m - 1);
      })(0, 1, 2, n);
      return P;
    }
    let n = 3;
    const pl = conPlayer(box, (s) => {
      if (!s.p) return;
      let g = "";
      [0, 1, 2].forEach((t) => {
        const x = 90 + t * 180;
        g += `<rect x="${x - 3}" y="30" width="6" height="120" rx="2" fill="var(--ink-3)"/><text x="${x}" y="166" text-anchor="middle" fill="var(--ink-2)" style="font:600 12px var(--f-display)">piolo ${t + 1}</text>`;
        s.p[t].forEach((d, i) => {
          const w = 26 + d * 24, y = 136 - i * 18, ult = s.a === t && i === s.p[t].length - 1;
          g += `<rect x="${x - w / 2}" y="${y}" width="${w}" height="15" rx="4" fill="${ult ? "var(--c1)" : "var(--pen)"}" opacity="${ult ? 1 : 0.55 + d * 0.08}"/><text x="${x}" y="${y + 11.5}" text-anchor="middle" fill="var(--paper-solid)" style="font:700 11px var(--f-mono)">${d}</text>`;
        });
      });
      g += `<rect x="20" y="150" width="500" height="4" rx="2" fill="var(--rule)"/>`;
      svg.innerHTML = g;
      $(".msg", box).innerHTML = s.m;
    }, { intervallo: 800 });
    suSeg(box, ".seg", (v) => { n = +v; pl.carica(traccia(n)); });
    pl.carica(traccia(n));
  }

  /* ===================================================================
     Capitolo 10 — Grafi e visite
     =================================================================== */
  const G_NON_OR = {
    vb: [640, 300],
    nodi: [["A", 60, 150], ["B", 180, 60], ["C", 180, 240], ["D", 310, 60], ["E", 310, 150], ["F", 310, 240], ["G", 440, 60], ["H", 440, 240], ["L", 570, 90], ["M", 570, 210]],
    archi: [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "E"], ["C", "F"], ["D", "G"], ["E", "G"], ["E", "H"], ["F", "H"], ["L", "M"]]
  };
  const DAG = {
    vb: [540, 300],
    nodi: [["a", 60, 90], ["g", 60, 220], ["b", 190, 40], ["c", 190, 150], ["h", 190, 260], ["d", 330, 80], ["e", 330, 210], ["f", 470, 150]],
    archi: [["a", "b"], ["a", "c"], ["a", "d"], ["b", "d"], ["c", "d"], ["c", "e"], ["g", "e"], ["g", "h"], ["h", "e"], ["d", "f"], ["e", "f"]]
  };
  const DAG_CICLO = { vb: DAG.vb, nodi: DAG.nodi, archi: DAG.archi.concat([["f", "a"]]) };
  function adiac(G, orientato) {
    const adj = {};
    G.nodi.forEach(([id]) => (adj[id] = []));
    G.archi.forEach(([u, v]) => { adj[u].push(v); if (!orientato) adj[v].push(u); });
    Object.values(adj).forEach((l) => l.sort());
    return adj;
  }

  function visitaGrafo(box) {
    box.classList.add("sim");
    let modo = box.dataset.modo || "bfs", sorgente = "A";
    const MODI = [["bfs", "BFS"], ["dfs", "DFS"], ["dfs-or", "DFS orientata"], ["topo", "ordinamento topologico"], ["cc", "componenti connesse"]];
    box.innerHTML = `<div class="sim-riga">${seg("Algoritmo", MODI, modo)}</div>
      <div class="sim-due"><div><svg></svg><div class="legenda vg-leg"></div></div>
      <div><div class="corsia"><span class="etichetta"><span class="vg-fnome">Coda F</span></span><div class="fila vg-f"></div></div>
      <div class="corsia vg-out-c"><span class="etichetta"><span class="vg-onome">Ordine di visita</span></span><div class="fila vg-o"></div></div>
      <p class="msg" aria-live="polite"></p></div></div>`;
    const svg = $("svg", box);
    let vista, G, orientato;
    function traccia() {
      orientato = modo === "dfs-or" || modo === "topo";
      G = modo === "dfs-or" ? DAG_CICLO : modo === "topo" ? DAG : G_NON_OR;
      const adj = adiac(G, orientato), ids = G.nodi.map((n) => n[0]).sort();
      const P = [], col = {}, ann = {}, arch = {}, comp = {};
      let fr = [], out = [], cur = null, tempo = 0;
      const dt = {}, ft = {};
      const key = (u, v) => (orientato ? u + ">" + v : [u, v].sort().join("-"));
      const snap = (m, arcoCorr) => P.push({ col: Object.assign({}, col), ann: Object.assign({}, ann), arch: Object.assign({}, arch), comp: Object.assign({}, comp), fr: fr.slice(), out: out.slice(), cur, m, arcoCorr });
      if (modo === "bfs") {
        const s = sorgente; col[s] = "s-grigio"; ann[s] = "0"; fr = [s]; const dist = { [s]: 0 };
        snap(`Marco la sorgente ${s} (dist 0) e la metto nella coda F. Clicca un nodo per cambiare sorgente.`);
        while (fr.length) {
          const u = fr.shift(); cur = u; out.push(u);
          snap(`dequeue di ${u}: visito ${u} (distanza ${dist[u]}) ed esamino i suoi adiacenti ${adj[u].join(", ")}.`);
          adj[u].forEach((v) => {
            if (dist[v] == null) { dist[v] = dist[u] + 1; col[v] = "s-grigio"; ann[v] = String(dist[v]); arch[key(u, v)] = "a-albero"; fr.push(v); snap(`${v} non è marcato: lo marco, dist = ${dist[v]}, parent = ${u}, enqueue.`, key(u, v)); }
            else if (arch[key(u, v)] !== "a-albero") arch[key(u, v)] = "a-visto";
          });
          col[u] = "s-nero"; cur = null;
        }
        const irr = ids.filter((x) => dist[x] == null);
        snap(`Coda vuota. Gli archi blu formano l'albero BFS: il cammino da ${s} a ogni nodo nell'albero è un cammino minimo (in numero di archi).${irr.length ? ` ${irr.join(" e ")} non sono raggiungibili da ${s}.` : ""}`);
      } else if (modo === "cc") {
        let k = 0;
        snap("Componenti connesse: si fa partire una visita da ogni nodo non ancora etichettato, e tutti i nodi raggiunti ricevono la stessa etichetta k.");
        ids.forEach((u0) => {
          if (comp[u0] != null) return;
          (function vis(u) {
            comp[u] = k; ann[u] = "cc " + k; cur = u; out.push(u);
            snap(`CC-visit(${u}, ${k}): ${u} entra nella componente ${k}.`);
            adj[u].forEach((v) => { if (comp[v] == null) { arch[key(u, v)] = "a-albero"; vis(v); } });
          })(u0);
          k++;
        });
        cur = null;
        snap(`Il grafo ha ${k} componenti connesse. Costo O(n + m): ogni nodo e ogni arco si guardano un numero costante di volte.`);
      } else {
        fr = [];
        const vis = (u) => {
          col[u] = "s-grigio"; dt[u] = ++tempo; ann[u] = `[${dt[u]}, ]`; fr.push(u); cur = u;
          snap(`DFS-visit(${u}): ${u} diventa grigio, tempo di scoperta ${dt[u]}.`);
          adj[u].forEach((v) => {
            const k = key(u, v);
            if (!col[v]) { arch[k] = "a-albero"; cur = u; snap(`${u} → ${v}: ${v} è bianco, arco dell'albero. Scendo.`, k); vis(v); cur = u; }
            else if (orientato) {
              let tipo, cls;
              if (col[v] === "s-grigio") { tipo = "all'indietro (v è grigio, un antenato: c'è un ciclo)"; cls = "a-indietro"; }
              else if (dt[u] < dt[v]) { tipo = "in avanti (v è nero e discendente di u)"; cls = "a-avanti"; }
              else { tipo = "di attraversamento (v è nero e già chiuso altrove)"; cls = "a-attraverso"; }
              arch[k] = cls; snap(`${u} → ${v}: arco ${tipo}.`, k);
            } else if (arch[k] !== "a-albero") arch[k] = "a-visto";
          });
          col[u] = "s-nero"; ft[u] = ++tempo; ann[u] = `[${dt[u]}, ${ft[u]}]`; fr.pop();
          if (modo === "topo") out.unshift(u); else out.push(u);
          snap(`Fine di ${u}: nero, tempo di fine ${ft[u]}.${modo === "topo" ? ` ${u} va in testa alla lista.` : ""}`);
        };
        snap(modo === "topo" ? "Ordinamento topologico: DFS completa; ogni nodo, quando finisce, va in testa alla lista." : "DFS completa: si parte da ogni nodo ancora bianco, in ordine alfabetico; gli adiacenti si esaminano in ordine alfabetico.");
        let alberi = 0;
        ids.forEach((u) => { if (!col[u]) { alberi++; vis(u); } });
        cur = null;
        const ind = Object.values(arch).filter((c) => c === "a-indietro").length;
        snap(modo === "topo" ? `Ordine topologico: <b>${out.join(" → ")}</b>, cioè i nodi in ordine decrescente di tempo di fine. Ogni arco va da sinistra a destra in questa lista.`
          : modo === "dfs-or" ? `Foresta DF completata. ${ind ? `${ind === 1 ? "C'è un arco" : `Ci sono ${ind} archi`} all'indietro: il grafo ha un ciclo, quindi non è un DAG.` : "Nessun arco all'indietro: è un DAG."}`
          : `Foresta DF con ${alberi} ${alberi === 1 ? "albero" : "alberi"}. Gli intervalli [d, f] di due nodi sono sempre annidati (uno discende dall'altro) o disgiunti: è il teorema delle parentesi.`);
      }
      return P;
    }
    function legenda() {
      const base = '<span><i class="l-bianco"></i>inesplorato</span><span><i class="l-grigio"></i>aperto</span><span><i class="l-nero"></i>chiuso</span><span><i class="l-linea"></i>arco dell\'albero</span>';
      $(".vg-leg", box).innerHTML = modo === "dfs-or" ? base + '<span><i class="l-trat"></i>all\'indietro</span><span><i class="l-linea" style="border-color:var(--c2);border-top-style:dashed"></i>in avanti</span><span><i class="l-linea" style="border-color:var(--c4);border-top-style:dotted"></i>di attraversamento</span>'
        : modo === "cc" ? '<span>colore = componente connessa</span><span><i class="l-linea"></i>arco della visita</span>' : base;
      $(".vg-fnome", box).textContent = modo === "bfs" ? "Coda F" : modo === "cc" ? "—" : "Pila delle chiamate attive (in cima l'ultima)";
      $(".vg-fnome", box).closest(".corsia").hidden = modo === "cc";
      $(".vg-onome", box).textContent = modo === "topo" ? "Lista (si inserisce in testa)" : modo === "cc" ? "Ordine di visita" : modo === "bfs" ? "Ordine di visita" : "Ordine di fine";
    }
    const pl = conPlayer(box, (s) => {
      if (!s.col) return;
      vista.pulisci();
      G.nodi.forEach(([id]) => vista.nodo(id, [s.col[id] || "", id === s.cur ? "corrente" : "", modo === "bfs" ? "cliccabile" : ""].join(" "), s.ann[id] || "", modo === "cc" && s.comp[id] != null ? s.comp[id] : null));
      vista.archi.forEach((e) => {
        const k = orientato ? e.u + ">" + e.v : [e.u, e.v].sort().join("-");
        e.g.setAttribute("class", "a " + (s.arch[k] || "") + (s.arcoCorr === k ? " a-corrente" : ""));
      });
      $(".vg-f", box).innerHTML = s.fr.length ? s.fr.map((x, i) => `<span class="chip${(modo === "bfs" ? i === 0 : i === s.fr.length - 1) ? " cima" : ""}">${x}</span>`).join("") : '<span class="vuoto">vuota</span>';
      $(".vg-o", box).innerHTML = s.out.length ? s.out.map((x) => `<span class="chip">${x}</span>`).join("") : '<span class="vuoto">ancora niente</span>';
      $(".msg", box).innerHTML = s.m;
    }, { intervallo: 1000 });
    function carica() {
      const P = traccia();
      vista = new VistaGrafo(svg, G, { orientato });
      if (modo === "bfs") G.nodi.forEach(([id]) => vista.nodi[id].g.addEventListener("click", () => { sorgente = id; carica(); }));
      legenda();
      pl.carica(P);
    }
    suSeg(box, ".seg", (v) => { modo = v; carica(); });
    carica();
  }

  /* ===================================================================
     Capitolo 11 — Alberi di copertura minimi e cammini minimi
     =================================================================== */
  const G_MST = {
    vb: [600, 300],
    nodi: [["a", 60, 150], ["b", 170, 60], ["c", 170, 240], ["d", 300, 60], ["e", 300, 150], ["f", 300, 240], ["g", 430, 60], ["h", 430, 240], ["i", 540, 150]],
    archi: [["a", "b", 4], ["a", "c", 8], ["b", "c", 11], ["b", "d", 8], ["c", "e", 7], ["c", "f", 1], ["d", "e", 2], ["e", "f", 6], ["f", "h", 2], ["d", "h", 4], ["d", "g", 7], ["g", "h", 14], ["g", "i", 9], ["h", "i", 10]]
  };
  const G_SP = {
    vb: [560, 300],
    nodi: [["s", 60, 150], ["a", 200, 60], ["b", 200, 240], ["c", 360, 60], ["d", 360, 240], ["e", 500, 150]],
    archi: [["s", "a", 10], ["s", "b", 5], ["a", "b", 2], ["b", "a", 3], ["a", "c", 1], ["b", "c", 9], ["b", "d", 2], ["d", "c", 6], ["c", "e", 4], ["d", "e", 7]]
  };
  const G_NEG = {
    vb: [560, 300],
    nodi: [["s", 60, 150], ["a", 220, 60], ["b", 220, 240], ["c", 400, 150]],
    archi: [["s", "a", 5], ["s", "b", 3], ["a", "b", -4], ["b", "c", 1]]
  };
  function camminiMinimi(box) {
    box.classList.add("sim");
    let alg = box.dataset.alg || "kruskal", neg = false;
    const ALG = [["kruskal", "Kruskal"], ["prim", "Prim"], ["dijkstra", "Dijkstra"], ["bellman", "Bellman-Ford"], ["floyd", "Floyd-Warshall"]];
    box.innerHTML = `<div class="sim-riga">${seg("Algoritmo", ALG, alg)}<label class="cm-neg-l"><input type="checkbox" class="cm-neg"> grafo con un arco negativo</label></div>
      <div class="sim-due"><div><svg></svg><div class="legenda cm-leg"></div></div>
      <div><div class="corsia cm-c1"><span class="etichetta"><span class="cm-n1"></span></span><div class="fila cm-f1"></div></div>
      <div class="scorri cm-mat" hidden><table class="tab-sim"></table></div>
      <div class="contatori"><span class="cm-cont"></span></div>
      <p class="msg" aria-live="polite"></p></div></div>`;
    const svg = $("svg", box), chk = $(".cm-neg", box);
    let G, vista, orientato;
    const inf = (x) => (x === Infinity ? "∞" : String(x));
    function traccia() {
      orientato = alg !== "kruskal" && alg !== "prim";
      G = !orientato ? G_MST : neg ? G_NEG : G_SP;
      const ids = G.nodi.map((x) => x[0]), P = [];
      const k = (u, v) => (orientato ? u + ">" + v : [u, v].sort().join("-"));
      const arch = {}, nod = {}, ann = {};
      let lista = [], cont = "", mat = null;
      const snap = (m, cur, extra) => P.push(Object.assign({ arch: Object.assign({}, arch), nod: Object.assign({}, nod), ann: Object.assign({}, ann), lista: lista.slice(), cont, m, cur, mat: mat && mat.map((r) => r.slice()) }, extra || {}));
      if (alg === "kruskal") {
        const E = G.archi.slice().sort((x, y) => x[2] - y[2]), padre = {}, rango = {};
        ids.forEach((x) => { padre[x] = x; rango[x] = 0; });
        const find = (x) => { while (padre[x] !== x) x = padre[x]; return x; };
        const colora = () => { const r = {}; let c = 0; ids.forEach((x) => { const f = find(x); if (r[f] == null) r[f] = c++; nod[x] = { comp: r[f] }; }); };
        let peso = 0, presi = 0;
        colora();
        lista = E.map(([u, v, w]) => `${u}${v}:${w}`);
        snap("Archi in ordine di peso non decrescente; ogni nodo è un albero a sé (un colore per insieme dello union-find).");
        E.forEach(([u, v, w], i) => {
          const tu = find(u), tv = find(v);
          lista = E.slice(i).map(([a, b, c]) => `${a}${b}:${c}`);
          if (tu !== tv) {
            arch[k(u, v)] = "a-albero"; peso += w; presi++;
            if (rango[tu] < rango[tv]) padre[tu] = tv; else { padre[tv] = tu; if (rango[tu] === rango[tv]) rango[tu]++; }
            colora(); cont = `archi nel MST ${presi} su ${ids.length - 1} · peso ${peso}`;
            snap(`{${u}, ${v}} di peso ${w}: find(${u}) ≠ find(${v}), collega due alberi diversi. Arco <b>blu</b>, union.`, k(u, v));
          } else { arch[k(u, v)] = "a-scartato"; snap(`{${u}, ${v}} di peso ${w}: ${u} e ${v} sono già nello stesso albero, chiuderebbe un ciclo. Arco <b>rosso</b>.`, k(u, v)); }
        });
        lista = [];
        snap(`MST di peso <b>${peso}</b> con ${presi} archi. Costo O(m log n): ordinamento più n makeSet, 2m find e n − 1 union con QuickUnion e rango.`);
      } else if (alg === "prim") {
        const adj = {}; ids.forEach((x) => (adj[x] = []));
        G.archi.forEach(([u, v, w]) => { adj[u].push([v, w]); adj[v].push([u, w]); });
        const d = {}, p = {}, dentro = {}; ids.forEach((x) => { d[x] = Infinity; p[x] = null; });
        const s = "a"; d[s] = 0; let Q = [s], peso = 0;
        const mostraQ = () => { lista = Q.slice().sort((x, y) => d[x] - d[y]).map((x) => `${x}:${d[x]}`); ids.forEach((x) => (ann[x] = dentro[x] ? "" : inf(d[x]))); };
        mostraQ(); snap(`Radice ${s}: d[${s}] = 0, gli altri ∞. d[v] è il peso minimo di un arco che collega v all'albero.`);
        while (Q.length) {
          Q.sort((x, y) => d[x] - d[y]); const u = Q.shift(); dentro[u] = true; nod[u] = { cls: "s-nero" };
          if (p[u]) { arch[k(p[u], u)] = "a-albero"; peso += d[u]; }
          cont = `peso dell'albero ${peso}`; mostraQ();
          snap(`deleteMin: ${u}${p[u] ? ` entra nell'albero con l'arco {${p[u]}, ${u}} di peso ${d[u]}` : " è la radice"}. Ora guardo i suoi vicini fuori dall'albero.`, p[u] ? k(p[u], u) : null, { curN: u });
          adj[u].forEach(([v, w]) => {
            if (dentro[v]) return;
            if (d[v] === Infinity) { d[v] = w; p[v] = u; Q.push(v); nod[v] = { cls: "s-grigio" }; mostraQ(); snap(`${v} era a ∞: insert(${v}, ${w}), p[${v}] = ${u}.`, k(u, v), { curN: u }); }
            else if (w < d[v]) { const vecchio = d[v]; d[v] = w; p[v] = u; mostraQ(); snap(`w(${u}, ${v}) = ${w} &lt; d[${v}] = ${vecchio}: decreaseKey, p[${v}] = ${u}.`, k(u, v), { curN: u }); }
          });
        }
        snap(`MST di peso <b>${peso}</b>, lo stesso di Kruskal. Costo O(m log n) con uno heap.`);
      } else if (alg === "dijkstra" || alg === "bellman") {
        const s = "s", D = {}, pred = {}; ids.forEach((x) => { D[x] = Infinity; pred[x] = null; }); D[s] = 0;
        const segna = () => { ids.forEach((x) => (ann[x] = inf(D[x]))); Object.keys(arch).forEach((x) => delete arch[x]); ids.forEach((x) => { if (pred[x]) arch[k(pred[x], x)] = "a-albero"; }); };
        segna();
        if (alg === "dijkstra") {
          const fatto = {}; let Q = [s];
          const mostraQ = () => (lista = Q.slice().sort((x, y) => D[x] - D[y]).map((x) => `${x}:${D[x]}`));
          mostraQ(); snap(`D[s] = 0, gli altri ∞. Q contiene s.${neg ? " Attenzione: l'arco a → b ha peso negativo." : ""}`);
          while (Q.length) {
            Q.sort((x, y) => D[x] - D[y]); const u = Q.shift(); fatto[u] = true; nod[u] = { cls: "s-nero" }; mostraQ();
            snap(`deleteMin: ${u} con D = ${D[u]}. Da qui D[${u}] non cambia più.`, null, { curN: u });
            G.archi.filter((e) => e[0] === u).forEach(([, v, w]) => {
              if (fatto[v]) { if (D[u] + w < D[v]) snap(`${u} → ${v}: D[${u}] + ${w} = ${D[u] + w} &lt; D[${v}] = ${D[v]}, ma ${v} è già stato estratto e non si aggiorna più: <b>è qui che Dijkstra sbaglia con i pesi negativi</b>.`, k(u, v), { curN: u }); return; }
              if (D[v] === Infinity) { D[v] = D[u] + w; pred[v] = u; Q.push(v); nod[v] = { cls: "s-grigio" }; segna(); mostraQ(); snap(`${u} → ${v}: D[${v}] = ${D[u]} + ${w} = ${D[v]}, insert.`, k(u, v), { curN: u }); }
              else if (D[u] + w < D[v]) { const vec = D[v]; D[v] = D[u] + w; pred[v] = u; segna(); mostraQ(); snap(`${u} → ${v}: ${D[u]} + ${w} = ${D[v]} &lt; ${vec}, decreaseKey e pred[${v}] = ${u}.`, k(u, v), { curN: u }); }
              else snap(`${u} → ${v}: ${D[u]} + ${w} = ${D[u] + w} ≥ D[${v}] = ${D[v]}, niente da fare.`, k(u, v), { curN: u });
            });
          }
          lista = [];
          snap(`Distanze: ${ids.map((x) => `${x} = ${inf(D[x])}`).join(", ")}. ${neg ? "Il valore di b è sbagliato: il cammino s → a → b costa 1, non 3, e di conseguenza anche c. Usa Bellman-Ford." : "L'albero blu è l'albero dei cammini minimi. Costo O(m log n) con uno heap."}`);
        } else {
          const n = ids.length;
          snap(`D[s] = 0, gli altri ∞. Si ripete n − 1 = ${n - 1} volte il rilassamento di tutti gli archi.`);
          for (let it = 1; it <= n - 1; it++) {
            let cambi = 0; cont = `iterazione ${it} di ${n - 1}`;
            G.archi.forEach(([u, v, w]) => {
              if (D[u] + w < D[v]) { const vec = D[v]; D[v] = D[u] + w; pred[v] = u; cambi++; segna(); snap(`Iterazione ${it}, arco ${u} → ${v}: D[${u}] + ${w} = ${D[v]} &lt; ${inf(vec)}, rilasso.`, k(u, v)); }
            });
            snap(`Fine dell'iterazione ${it}: ${cambi ? `${cambi} ${cambi === 1 ? "distanza aggiornata" : "distanze aggiornate"}` : "nessuna modifica (si potrebbe già smettere)"}.`);
          }
          const negCiclo = G.archi.some(([u, v, w]) => D[u] + w < D[v]);
          snap(`${negCiclo ? "Un arco si rilassa ancora: c'è un ciclo negativo." : "Controllo finale: nessun arco si può più rilassare, quindi non ci sono cicli negativi."} Distanze: ${ids.map((x) => `${x} = ${inf(D[x])}`).join(", ")}. Costo O(nm).`);
        }
      } else {
        const n = ids.length, idx = {}; ids.forEach((x, i) => (idx[x] = i));
        mat = ids.map((x, i) => ids.map((y, j) => (i === j ? 0 : Infinity)));
        G.archi.forEach(([u, v, w]) => (mat[idx[u]][idx[v]] = w));
        snap("D⁰: distanze senza nodi intermedi, cioè 0 sulla diagonale, il peso dell'arco se c'è, ∞ altrimenti.", null, { cambiati: [] });
        ids.forEach((kk, kI) => {
          const cambiati = [];
          for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) if (mat[x][kI] + mat[kI][y] < mat[x][y]) { mat[x][y] = mat[x][kI] + mat[kI][y]; cambiati.push([x, y]); }
          nod[kk] = { cls: "corrente" };
          snap(`D<sup>${kI + 1}</sup>: ora i cammini possono passare anche per ${kk}. D[x, y] = min{ D[x, y], D[x, ${kk}] + D[${kk}, y] }: ${cambiati.length ? `${cambiati.length} ${cambiati.length === 1 ? "cella migliorata" : "celle migliorate"} (in verde).` : "nessuna cella cambia."}`, null, { cambiati, kI });
          nod[kk] = {};
        });
        snap(`Matrice finale: tutte le distanze tra tutte le coppie in Θ(n³), con una sola matrice n × n. Se un elemento della diagonale fosse negativo ci sarebbe un ciclo negativo.`, null, { cambiati: [] });
      }
      return P;
    }
    const pl = conPlayer(box, (s) => {
      if (!s.arch) return;
      vista.pulisci();
      G.nodi.forEach(([id]) => { const nd = s.nod[id] || {}; vista.nodo(id, [nd.cls || "", s.curN === id ? "corrente" : ""].join(" "), s.ann[id] || "", nd.comp); });
      vista.archi.forEach((e) => { const kk = orientato ? e.u + ">" + e.v : [e.u, e.v].sort().join("-"); e.g.setAttribute("class", "a " + (s.arch[kk] || "") + (s.cur === kk ? " a-corrente" : "")); });
      $(".cm-f1", box).innerHTML = s.lista.length ? s.lista.map((x, i) => `<span class="chip${i === 0 ? " cima" : ""}">${x.replace(":", "<small>")}</small></span>`).join("") : '<span class="vuoto">vuota</span>';
      $(".cm-cont", box).textContent = s.cont || "";
      const mt = $(".cm-mat", box);
      mt.hidden = !s.mat;
      if (s.mat) {
        const ids = G.nodi.map((x) => x[0]), ch = new Set((s.cambiati || []).map(([x, y]) => x + "," + y));
        $("table", mt).innerHTML = `<thead><tr><th></th>${ids.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${s.mat.map((r, x) => `<tr><th>${ids[x]}</th>${r.map((v, y) => `<td class="${ch.has(x + "," + y) ? "cam" : ""}${s.kI != null && (x === s.kI || y === s.kI) ? " dip" : ""}">${inf(v)}</td>`).join("")}</tr>`).join("")}</tbody>`;
      }
      $(".msg", box).innerHTML = s.m;
    }, { intervallo: 1100 });
    function carica() {
      const P = traccia();
      vista = new VistaGrafo(svg, G, { orientato, pesi: true });
      $(".cm-neg-l", box).hidden = !(alg === "dijkstra" || alg === "bellman");
      $(".cm-c1", box).hidden = alg === "floyd" || alg === "bellman";
      $(".cm-n1", box).textContent = alg === "kruskal" ? "Archi ancora da esaminare (u v : peso)" : alg === "prim" ? "Coda con priorità Q (nodo : d)" : "Coda con priorità Q (nodo : D)";
      $(".cm-leg", box).innerHTML = alg === "kruskal" ? '<span><i class="l-linea"></i>nel MST (blu)</span><span><i class="l-trat" style="border-color:var(--ko)"></i>scartato (rosso)</span><span>colore del nodo = insieme dello union-find</span>'
        : alg === "prim" ? '<span><i class="l-nero"></i>nell\'albero</span><span><i class="l-grigio"></i>in Q</span><span><i class="l-linea"></i>arco dell\'albero</span><span>annotazione = d[v]</span>'
        : alg === "floyd" ? '<span>bordo arancio = riga e colonna del nodo intermedio k</span>' : '<span><i class="l-nero"></i>estratto</span><span><i class="l-grigio"></i>in Q</span><span><i class="l-linea"></i>pred (albero dei cammini)</span><span>annotazione = D[v]</span>';
      pl.carica(P);
    }
    suSeg(box, ".seg", (v) => { alg = v; carica(); });
    chk.addEventListener("change", () => { neg = chk.checked; carica(); });
    carica();
  }

  /* ===================================================================
     Capitolo 12 — NP-completezza
     =================================================================== */
  /* formula in CNF: "x1 x2 x3 | -x1 -x3" (clausole separate da |, negazione con - o ¬) */
  function leggiCNF(s) {
    return String(s).split(/[|;∧]/).map((c) => (c.match(/[-¬!~]?\s*x\d+/gi) || []).map((l) => { const neg = /^[-¬!~]/.test(l); return { v: "x" + l.match(/\d+/)[0], neg }; })).filter((c) => c.length);
  }
  const testoLetterale = (l) => (l.neg ? "¬" : "") + l.v;
  const testoCNF = (F) => F.map((c) => "(" + c.map(testoLetterale).join(" ∨ ") + ")").join(" ∧ ");

  function satAlbero(box) {
    box.classList.add("sim");
    box.innerHTML = `<div class="sim-riga"><label>Formula <input type="text" value="${esc(box.dataset.f || "x1 x2 x3 | -x1 -x3")}" aria-label="Formula in forma normale congiuntiva"></label><button type="button" class="btn" data-s="vai">Costruisci</button></div>
      <p class="formula sa-f"></p><svg aria-label="Albero di decisione non deterministico"></svg><p class="msg" aria-live="polite"></p>`;
    const inp = $("input", box), svg = $("svg", box);
    function vai() {
      const F = leggiCNF(inp.value), vars = [...new Set(F.flat().map((l) => l.v))].sort((a, b) => +a.slice(1) - +b.slice(1)).slice(0, 4);
      $(".sa-f", box).textContent = F.length ? testoCNF(F) : "Scrivi le clausole separate da |, per esempio x1 x2 | -x1 x3";
      if (!F.length) return;
      let sodd = [], foglie = 0;
      const vera = (as) => F.every((c) => c.some((l) => vars.includes(l.v) && as[l.v] !== l.neg));
      function nodo(i, as, etich, sx) {
        if (i === vars.length) { foglie++; const r = vera(as); if (r) sodd.push(vars.map((v) => `${v}=${as[v] ? 1 : 0}`).join(", ")); return { k: r ? "1" : "0", cls: r ? "ok" : "spento", a: etich, aSx: sx, l: null, r: null }; }
        const v = vars[i];
        return { k: v, a: etich, aSx: sx, cls: "", l: nodo(i + 1, Object.assign({}, as, { [v]: false }), "0", true), r: nodo(i + 1, Object.assign({}, as, { [v]: true }), "1", false) };
      }
      const rad = nodo(0, {}, "", false);
      vistaAlbero(svg, rad, { dx: vars.length > 3 ? 30 : 44, dy: 56, r: 16 });
      $(".msg", box).innerHTML = `Un algoritmo non deterministico «indovina» x<sub>i</sub> ∈ {0, 1} per ogni variabile e poi verifica la formula in tempo lineare: le ${foglie} foglie sono tutti i modi di indovinare. Risponde 1 se almeno una foglia vale 1. ${sodd.length ? `Qui ${sodd.length} ${sodd.length === 1 ? "foglia vale" : "foglie valgono"} 1, per esempio ${sodd[0]}: la formula è soddisfacibile, e quell'assegnamento è il certificato.` : "Nessuna foglia vale 1: la formula non è soddisfacibile."} Un algoritmo deterministico, nel caso pessimo, le prova tutte: 2<sup>n</sup>.`;
    }
    $("[data-s]", box).addEventListener("click", vai);
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") vai(); });
    vai();
  }

  function satClique(box) {
    box.classList.add("sim");
    box.innerHTML = `<div class="sim-riga"><label>Formula <input type="text" value="${esc(box.dataset.f || "x1 x2 x3 | -x1 -x2 x3 | x4 -x3 x2")}" aria-label="Formula in forma normale congiuntiva"></label><button type="button" class="btn" data-s="vai">Riduci</button></div>
      <p class="formula sc-f"></p><svg aria-label="Grafo ottenuto dalla riduzione"></svg>
      <div class="legenda"><span><i class="l-linea"></i>archi della clique trovata</span><span>un vertice per ogni letterale di ogni clausola, colonne = clausole</span></div>
      <p class="msg" aria-live="polite"></p>`;
    const inp = $("input", box), svg = $("svg", box);
    function vai() {
      const F = leggiCNF(inp.value).slice(0, 4).map((c) => c.slice(0, 3));
      $(".sc-f", box).textContent = F.length ? testoCNF(F) : "Scrivi le clausole separate da |";
      if (!F.length) return;
      const nodi = [], archi = [], W = 140 * F.length + 40;
      F.forEach((c, i) => c.forEach((l, j) => nodi.push([`${testoLetterale(l)}·${i + 1}`, 70 + i * 140, 50 + j * 90, l, i])));
      const comp = (a, b) => !(a.v === b.v && a.neg !== b.neg);
      for (let x = 0; x < nodi.length; x++) for (let y = x + 1; y < nodi.length; y++) if (nodi[x][4] !== nodi[y][4] && comp(nodi[x][3], nodi[y][3])) archi.push([nodi[x][0], nodi[y][0]]);
      const G = { vb: [W, 300], nodi: nodi.map((n) => [n[0], n[1], n[2]]), archi };
      const vista = new VistaGrafo(svg, G, { r: 22 });
      // ricerca di una clique di dimensione k = numero di clausole: un letterale per clausola, a due a due compatibili
      let scelta = null;
      (function cerca(i, presi) {
        if (scelta) return;
        if (i === F.length) { scelta = presi.slice(); return; }
        nodi.filter((n) => n[4] === i).forEach((n) => { if (presi.every((p) => comp(p[3], n[3]))) cerca(i + 1, presi.concat([n])); });
      })(0, []);
      vista.archi.forEach((e) => e.g.setAttribute("class", "a a-spento"));
      G.nodi.forEach(([id]) => vista.nodo(id, "", ""));
      const testi = (id) => vista.nodi[id].g.querySelector("text.lab");
      G.nodi.forEach(([id]) => { const t = testi(id); t.textContent = id.split("·")[0]; t.setAttribute("style", "font-size:12px"); });
      if (scelta) {
        scelta.forEach((n) => vista.nodo(n[0], "scelto s-grigio", "clausola " + (n[4] + 1)));
        for (let a = 0; a < scelta.length; a++) for (let b = a + 1; b < scelta.length; b++) vista.arco(scelta[a][0], scelta[b][0], "a-albero");
        const as = {}; scelta.forEach((n) => (as[n[3].v] = !n[3].neg));
        const vars = [...new Set(F.flat().map((l) => l.v))].sort((a, b) => +a.slice(1) - +b.slice(1));
        $(".msg", box).innerHTML = `Due vertici di clausole diverse sono collegati se i letterali sono compatibili (non x e ¬x). Una clique di dimensione k = ${F.length} (il numero di clausole) prende un letterale vero per ogni clausola: <b>${scelta.map((n) => testoLetterale(n[3])).join(", ")}</b>. Ne viene un assegnamento che soddisfa la formula: ${vars.map((v) => `${v} = ${as[v] == null ? "0 o 1" : as[v] ? "1" : "0"}`).join(", ")}. La costruzione è polinomiale: al più (3k)² archi.`;
      } else $(".msg", box).innerHTML = `Non c'è una clique di dimensione ${F.length}: la formula non è soddisfacibile (ogni scelta di un letterale per clausola contiene una coppia x, ¬x).`;
    }
    $("[data-s]", box).addEventListener("click", vai);
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") vai(); });
    vai();
  }

  /* @@ALTRI-WIDGET@@ */

  /* ------------------------------------------------------------- avvio */
  const WIDGET = {
    "fib-albero": fibAlbero, "fib-gara": fibGara,
    "crescita": crescita, "master": master, "contatore": contatore,
    "ordina": ordina, "albero-decisione": alberoDecisione, "bandiera": bandiera,
    "pila-dinamica": pilaDinamica, "coda-circolare": codaCircolare,
    "visite": visite, "albero-ricerca": alberoRicerca, "alfabeta": alfaBeta,
    "tabella-hash": tabellaHash, "heap": heapSim, "union-find": unionFind,
    "pd-tabella": pdTabella, "huffman": huffman, "hanoi": hanoi,
    "visita-grafo": visitaGrafo, "cammini": camminiMinimi,
    "sat-albero": satAlbero, "sat-clique": satClique
    /* @@REGISTRO@@ */
  };
  window.Simulatori = { vistaArray, vistaAlbero, VistaGrafo, conPlayer, righe };
  $$("[data-widget]").forEach((el) => {
    const f = WIDGET[el.dataset.widget];
    if (!f) return;
    try { f(el); } catch (err) {
      console.error("Widget", el.dataset.widget, err);
      el.insertAdjacentHTML("beforeend", `<p class="avviso">Questo simulatore non è riuscito a partire: ${esc(err.message)}</p>`);
    }
  });
})();
