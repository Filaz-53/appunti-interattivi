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
    nodo(id, cls, ann) {
      const n = this.nodi[id];
      if (!n) return;
      n.g.setAttribute("class", "nodo " + (cls || ""));
      n.ann.textContent = ann == null ? "" : ann;
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

  /* @@ALTRI-WIDGET@@ */

  /* ------------------------------------------------------------- avvio */
  const WIDGET = {
    "fib-albero": fibAlbero, "fib-gara": fibGara,
    "crescita": crescita, "master": master, "contatore": contatore,
    "ordina": ordina, "albero-decisione": alberoDecisione, "bandiera": bandiera,
    "pila-dinamica": pilaDinamica, "coda-circolare": codaCircolare
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
