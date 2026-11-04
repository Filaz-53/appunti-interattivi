/* =====================================================================
   Appunti interattivi — motore comune a tutte le materie
   - barra in alto con switcher tra materie e scelta del tema
   - home e indici delle materie generati da materie.js
   - quiz a risposta multipla con progressi salvati nel browser
   - esercizi risolti con soluzione passo per passo
   - evidenziazione del codice Java, pulsanti "Copia", checklist
   - Player (avanti/indietro/play) e fly() per le animazioni dei widget
   Tutto è JavaScript "classico" (niente moduli), così le pagine funzionano
   anche aprendole con doppio clic dal disco, senza server.
   ===================================================================== */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage non disponibile */ }
    },
    del(k) {
      try { localStorage.removeItem(k); } catch (e) { /* idem */ }
    }
  };

  const html = document.documentElement;
  const ROOT = document.body.dataset.root || "";
  const MATERIA = html.dataset.materia || null;
  const ARG = document.body.dataset.argomento || null;
  const MATERIE = window.MATERIE || [];
  const motoRidotto = window.matchMedia("(prefers-reduced-motion: reduce)");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ------------------------------------------------------------ tema */
  const TEMI = ["sistema", "chiaro", "scuro"];
  const NOMI_TEMA = { sistema: "Tema: sistema", chiaro: "Tema: chiaro", scuro: "Tema: scuro" };
  function applicaTema(t) {
    if (t === "chiaro") html.dataset.theme = "light";
    else if (t === "scuro") html.dataset.theme = "dark";
    else delete html.dataset.theme;
  }
  let tema = store.get("appunti:tema", "sistema");
  if (!TEMI.includes(tema)) tema = "sistema";
  applicaTema(tema);

  /* ------------------------------------------------------------ barra */
  const ICONA = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="2.5" width="15" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.5 2.5v15" stroke="#e8a3a3" stroke-width="1.6"/><path d="M9.5 7h5M9.5 10h5M9.5 13h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

  function barra() {
    const el = $("#barra");
    if (!el) return;
    const m = MATERIE.find((x) => x.id === MATERIA);
    const a = m && m.argomenti.find((x) => x.id === ARG);
    el.className = "barra";
    const switchLinks = MATERIE.map((x) =>
      `<a href="${ROOT}materie/${x.id}/index.html" style="--hue:${x.tinta}"${x.id === MATERIA ? ' aria-current="page"' : ""} title="${esc(x.nome)}">${esc(x.breve)}</a>`
    ).join("");
    el.innerHTML =
      `<div class="barra-in">
        <a class="marchio" href="${ROOT}index.html">${ICONA}<span>Appunti interattivi</span></a>
        <nav class="switch" aria-label="Cambia materia">${switchLinks}</nav>
        ${a ? `<span class="briciola"><a href="${ROOT}materie/${m.id}/index.html">${esc(m.breve)}</a> › ${esc(a.titolo)}</span>` : ""}
        <span class="barra-dx">
          ${ARG ? '<span class="progresso" id="progresso" aria-live="polite"></span>' : ""}
          <button class="btn piccolo" type="button" id="tema-btn">${NOMI_TEMA[tema]}</button>
        </span>
      </div>`;
    $("#tema-btn").addEventListener("click", (e) => {
      tema = TEMI[(TEMI.indexOf(tema) + 1) % TEMI.length];
      store.set("appunti:tema", tema);
      applicaTema(tema);
      e.currentTarget.textContent = NOMI_TEMA[tema];
    });
  }

  /* --------------------------------------------- progressi salvati */
  const chiaveQuiz = (m, a) => `appunti:${m}:${a}:quiz`;
  const chiaveTot = (m, a) => `appunti:${m}:${a}:totale`;
  function riassunto(m, a) {
    const stato = store.get(chiaveQuiz(m, a), {});
    const tot = store.get(chiaveTot(m, a), null);
    const vals = Object.values(stato);
    return { fatte: vals.length, giuste: vals.filter((v) => v.ok).length, tot };
  }

  /* ------------------------------------------- home: la libreria */
  function home() {
    const box = $("#libreria");
    if (!box) return;
    const libri = MATERIE.map((m) => {
      let fatte = 0, giuste = 0, tot = 0;
      m.argomenti.forEach((a) => { const r = riassunto(m.id, a.id); fatte += r.fatte; giuste += r.giuste; tot += r.tot || 0; });
      const n = m.argomenti.length;
      const pagine = n
        ? m.argomenti.slice(0, 4).map((a, i) => `<li>${i + 1}. ${esc(a.titolo)}</li>`).join("")
        : "<li>Pagine ancora bianche</li>";
      return `<a class="libro" href="materie/${m.id}/index.html" style="--hue:${m.tinta}" aria-label="Apri il quaderno di ${esc(m.nome)}">
          <span class="pagina-dentro" aria-hidden="true"><span class="etichetta">Indice</span><ol>${pagine}</ol></span>
          <span class="copertina">
            <span class="dorso" aria-hidden="true"></span>
            <span class="targhetta">
              <span class="riga-t"><span class="etichetta">Materia</span><b>${esc(m.nome)}</b></span>
              <span class="riga-t"><span class="etichetta">Argomenti</span><span>${n === 0 ? "nessuno, per ora" : n === 1 ? "1 argomento" : n + " argomenti"}</span></span>
              ${fatte ? `<span class="riga-t"><span class="etichetta">Quiz</span><span class="num">${giuste} giuste su ${tot || fatte}</span></span>` : ""}
            </span>
            <span class="sigla" aria-hidden="true">${esc(m.breve)}</span>
          </span>
        </a>`;
    }).join("");
    box.innerHTML = libri + `<div class="libro libro-vuoto">
        <span class="copertina"><span class="targhetta">
          <span class="riga-t"><span class="etichetta">Posto libero</span><b>Prossima materia</b></span>
          <span class="riga-t"><span>Aggiungila in <code>assets/js/materie.js</code> e comparirà qui. I passi sono nel README.</span></span>
        </span></span>
      </div>`;
    $$("a.libro", box).forEach((a) => a.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (motoRidotto.matches) return;
      e.preventDefault();
      a.classList.add("apre");
      setTimeout(() => { window.location.href = a.href; }, 620);
    }));
    // tornando indietro, il browser può ripristinare la pagina con il quaderno ancora aperto
    window.addEventListener("pageshow", () => $$(".libro.apre", box).forEach((a) => a.classList.remove("apre")));
  }

  /* ------------------------------ indice di una materia: il sommario */
  function indiceMateria() {
    const box = $("#argomenti-materia");
    if (!box) return;
    const m = MATERIE.find((x) => x.id === MATERIA);
    if (!m) { box.textContent = "Materia non trovata in materie.js."; return; }
    document.title = `${m.nome} · Appunti interattivi`;
    const t = $("#titolo-materia"); if (t) t.textContent = m.nome;
    const d = $("#descr-materia"); if (d) d.textContent = m.descrizione;
    if (!m.argomenti.length) {
      box.innerHTML = `<section class="scheda" style="--hue:${m.tinta}">
          <span class="inch">Quaderno nuovo</span>
          <h2>Le pagine di ${esc(m.nome)} sono ancora bianche</h2>
          <p>Per scrivere il primo argomento:</p>
          <ol>
            <li>copia <code>modelli/argomento.html</code> in <code>materie/${esc(m.id)}/</code> e rinominalo, per esempio <code>primo-argomento.html</code>;</li>
            <li>nel file metti <code>data-materia="${esc(m.id)}"</code> e <code>data-argomento="primo-argomento"</code>;</li>
            <li>aggiungi l'argomento nell'elenco <code>argomenti</code> di questa materia in <code>assets/js/materie.js</code>.</li>
          </ol>
          <p>Comparirà qui come primo capitolo, e il quaderno sullo scaffale lo mostrerà nell'indice.</p>
        </section>`;
      return;
    }
    box.innerHTML = `<ol class="sommario" style="--hue:${m.tinta}">${m.argomenti.map((a, i) => {
      const r = riassunto(m.id, a.id);
      const extra = [a.fonte ? "Fonte: " + esc(a.fonte) : "", r.fatte ? `quiz: ${r.giuste} giuste, ${r.fatte} risposte${r.tot ? " su " + r.tot : ""}` : ""].filter(Boolean).join(" · ");
      return `<li><a href="${esc(a.id)}.html">
          <span class="cap">${i + 1}</span>
          <span class="corpo"><b>${esc(a.titolo)}</b><span>${esc(a.sottotitolo)}</span>${extra ? `<small>${extra}</small>` : ""}</span>
          <span class="vai" aria-hidden="true">→</span>
        </a></li>`;
    }).join("")}</ol>`;
  }

  /* -------------------------------------------------------------- quiz */
  function quiz() {
    const domande = $$(".domanda");
    if (!domande.length || !ARG) return;
    const key = chiaveQuiz(MATERIA, ARG);
    let stato = store.get(key, {});
    store.set(chiaveTot(MATERIA, ARG), domande.length);

    domande.forEach((d, n) => {
      const qn = $(".testo .qn", d);
      if (!qn) {
        const t = $(".testo", d);
        if (t) t.insertAdjacentHTML("afterbegin", `<span class="qn">D${n + 1}</span>`);
      }
      if (!$(".esito", d)) {
        const e = document.createElement("p");
        e.className = "esito";
        e.setAttribute("aria-live", "polite");
        $(".opz", d).after(e);
      }
      $$(".opz button", d).forEach((b, i) => {
        b.type = "button";
        b.addEventListener("click", () => rispondi(d, i, true));
      });
      const s = stato[d.dataset.id];
      if (s) rispondi(d, s.scelta, false);
    });

    function rispondi(d, i, salva) {
      const btns = $$(".opz button", d);
      const ok = btns.findIndex((b) => b.hasAttribute("data-giusta"));
      btns.forEach((b, j) => {
        b.disabled = true;
        b.classList.toggle("giusta", j === ok);
        b.classList.toggle("sbagliata", j === i && i !== ok);
      });
      const e = $(".esito", d);
      e.textContent = i === ok ? "Giusto." : "Non è questa: la risposta giusta è quella segnata in verde.";
      e.className = "esito " + (i === ok ? "si" : "no");
      const p = $(".perche", d);
      if (p) p.hidden = false;
      if (salva) {
        stato[d.dataset.id] = { scelta: i, ok: i === ok };
        store.set(key, stato);
      }
      aggiorna();
    }

    function azzera(dentro) {
      $$(".domanda", dentro).forEach((d) => {
        delete stato[d.dataset.id];
        $$(".opz button", d).forEach((b) => { b.disabled = false; b.classList.remove("giusta", "sbagliata"); });
        const e = $(".esito", d); e.textContent = ""; e.className = "esito";
        const p = $(".perche", d); if (p) p.hidden = true;
      });
      store.set(key, stato);
      aggiorna();
    }
    $$('[data-azione="azzera-quiz"]').forEach((b) => b.addEventListener("click", () => {
      azzera(b.closest(".verifica, .esercizio") || document);
    }));

    function aggiorna() {
      const vals = domande.map((d) => stato[d.dataset.id]).filter(Boolean);
      const giuste = vals.filter((v) => v.ok).length;
      const p = $("#progresso");
      if (p) p.innerHTML = `Quiz ${vals.length}/${domande.length} · <b>${giuste}</b> giuste`;
      $$("[data-progresso-pagina]").forEach((x) => {
        x.textContent = `${vals.length} risposte su ${domande.length}, ${giuste} giuste`;
      });
    }
    aggiorna();
  }

  /* --------------------------------------- esercizi passo per passo */
  function esercizi() {
    $$(".soluzione").forEach((sol) => {
      const passi = $$(".passi > li", sol);
      if (!passi.length) return;
      passi.forEach((li) => li.classList.add("nascosto"));
      let visti = 0;
      const ctrl = document.createElement("div");
      ctrl.className = "passi-ctrl";
      ctrl.innerHTML = `<button class="btn primario" type="button" data-p="avanti"></button>
        <button class="btn" type="button" data-p="tutti">Mostra tutta la soluzione</button>`;
      sol.appendChild(ctrl);
      const bAv = $('[data-p="avanti"]', ctrl);
      const bTu = $('[data-p="tutti"]', ctrl);
      function etichette() {
        if (visti === 0) bAv.textContent = "Mostra il primo passo";
        else if (visti < passi.length) bAv.textContent = `Passo successivo (${visti + 1} di ${passi.length})`;
        else bAv.textContent = "Nascondi la soluzione";
        bTu.hidden = visti >= passi.length;
      }
      bAv.addEventListener("click", () => {
        if (visti >= passi.length) {
          visti = 0;
          passi.forEach((li) => li.classList.add("nascosto"));
        } else {
          passi[visti].classList.remove("nascosto");
          visti++;
          sol.dispatchEvent(new CustomEvent("passo", { detail: visti }));
        }
        etichette();
      });
      bTu.addEventListener("click", () => {
        passi.forEach((li) => li.classList.remove("nascosto"));
        visti = passi.length;
        sol.dispatchEvent(new CustomEvent("passo", { detail: visti }));
        etichette();
      });
      etichette();
    });
  }

  /* ------------------------------------------------ evidenziazione codice */
  const KW = new Set("public private protected static final class interface implements extends new return if else for while do continue break import package void int long double boolean char null true false this throws throw try catch".split(" "));
  function evidenziaRiga(riga, lang) {
    if (lang !== "java") return esc(riga);
    const re = /(\/\/.*$)|("(?:\\.|[^"\\])*")|\b([A-Za-z_][A-Za-z0-9_]*)\b|\b(\d+)\b/g;
    let out = "", last = 0, mm;
    while ((mm = re.exec(riga))) {
      out += esc(riga.slice(last, mm.index));
      if (mm[1]) out += `<span class="tk-c">${esc(mm[1])}</span>`;
      else if (mm[2]) out += `<span class="tk-s">${esc(mm[2])}</span>`;
      else if (mm[3]) {
        if (KW.has(mm[3])) out += `<span class="tk-k">${mm[3]}</span>`;
        else if (/^[A-Z]/.test(mm[3])) out += `<span class="tk-t">${mm[3]}</span>`;
        else out += mm[3];
      } else if (mm[4]) out += `<span class="tk-n">${mm[4]}</span>`;
      last = re.lastIndex;
    }
    return out + esc(riga.slice(last));
  }
  function codice() {
    $$("pre.codice > code").forEach((c) => {
      const lang = c.dataset.lang || "";
      const raw = c.textContent.replace(/^\n/, "").replace(/\s+$/, "");
      c.dataset.raw = raw;
      const terminale = c.parentElement.classList.contains("terminale");
      c.innerHTML = raw.split("\n").map((r, i) => {
        let h = evidenziaRiga(r, lang);
        if (terminale && r.startsWith("$ ")) h = `<span class="prompt">$ </span>${esc(r.slice(2))}`;
        return `<span class="riga" data-l="${i + 1}">${h || " "}</span>`;
      }).join("");
    });
    $$("pre.codice[data-copia]").forEach((pre) => {
      const b = document.createElement("button");
      b.className = "copia";
      b.type = "button";
      b.textContent = "Copia";
      pre.appendChild(b);
      b.addEventListener("click", () => {
        const c = $("code", pre);
        let testo = c.dataset.raw || c.textContent;
        if (pre.classList.contains("terminale")) testo = testo.split("\n").filter((r) => r.startsWith("$ ")).map((r) => r.slice(2)).join("\n");
        if (pre.dataset.copia) testo = pre.dataset.copia.replace(/\\t/g, "\t").replace(/\\n/g, "\n");
        const fatto = () => { b.textContent = "Copiato"; setTimeout(() => (b.textContent = "Copia"), 1600); };
        const ripiego = () => {
          const r = document.createRange(); r.selectNodeContents(c);
          const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
          b.textContent = "Selezionato: premi Ctrl+C";
          setTimeout(() => (b.textContent = "Copia"), 2600);
        };
        try {
          navigator.clipboard.writeText(testo).then(fatto, ripiego);
        } catch (e) { ripiego(); }
      });
    });
  }

  /* --------------------------------------------------------- checklist */
  function checklist() {
    $$(".checklist[data-id]").forEach((ul) => {
      const key = `appunti:${MATERIA}:${ARG}:check:${ul.dataset.id}`;
      const stato = store.get(key, {});
      $$("input[type=checkbox]", ul).forEach((cb) => {
        cb.checked = !!stato[cb.id];
        cb.addEventListener("change", () => { stato[cb.id] = cb.checked; store.set(key, stato); });
      });
    });
  }

  /* -------------------------------------------------- indice laterale */
  function indice() {
    const links = $$(".indice a[href^='#']");
    if (!links.length) return;
    const mappa = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const sezioni = [...mappa.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    const det = $(".indice details");
    if (det && window.matchMedia("(min-width: 1120px)").matches) det.open = true;
    links.forEach((a) => a.addEventListener("click", () => {
      if (det && !window.matchMedia("(min-width: 1120px)").matches) det.open = false;
    }));
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((voci) => {
      voci.forEach((v) => {
        if (v.isIntersecting) {
          links.forEach((a) => a.removeAttribute("aria-current"));
          const a = mappa.get(v.target.id);
          if (a) a.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    sezioni.forEach((s) => io.observe(s));
  }

  /* ------------------------------------------------------- Player */
  const IC = {
    inizio: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 2h2v12h-2zM14 2v12L5.5 8z"/></svg>',
    indietro: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.5 2v12L3.5 8z"/></svg>',
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2v12l10-6z"/></svg>',
    pausa: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2h3.5v12H3.5zM9 2h3.5v12H9z"/></svg>',
    avanti: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2v12l9-6z"/></svg>',
    fine: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2v12l8.5-6zM11.5 2h2v12h-2z"/></svg>'
  };
  function Player(box, opz) {
    let tot = opz.passi, i = 0, timer = null;
    const intervallo = opz.intervallo || 1300;
    box.classList.add("player");
    box.innerHTML = `
      <button type="button" data-b="inizio" aria-label="Torna all'inizio">${IC.inizio}</button>
      <button type="button" data-b="indietro" aria-label="Passo precedente">${IC.indietro}</button>
      <button type="button" data-b="play" class="play" aria-label="Riproduci">${IC.play}</button>
      <button type="button" data-b="avanti" aria-label="Passo successivo">${IC.avanti}</button>
      <button type="button" data-b="fine" aria-label="Vai alla fine">${IC.fine}</button>
      <input type="range" min="0" value="0" aria-label="Passo" id="${opz.id || ""}">
      <span class="conta"></span>`;
    const r = $("input", box), conta = $(".conta", box), bPlay = $('[data-b="play"]', box);
    function ui() {
      r.max = String(tot - 1); r.value = String(i);
      conta.textContent = `passo ${i + 1} di ${tot}`;
      $('[data-b="indietro"]', box).disabled = i === 0;
      $('[data-b="inizio"]', box).disabled = i === 0;
      $('[data-b="avanti"]', box).disabled = i >= tot - 1;
      $('[data-b="fine"]', box).disabled = i >= tot - 1;
    }
    function vai(n) {
      const prima = i;
      i = Math.max(0, Math.min(tot - 1, n));
      opz.render(i, i === prima + 1);
      ui();
      if (i >= tot - 1) ferma();
    }
    function ferma() {
      if (timer) clearInterval(timer);
      timer = null;
      bPlay.innerHTML = IC.play; bPlay.setAttribute("aria-label", "Riproduci");
    }
    function parti() {
      if (i >= tot - 1) vai(0);
      bPlay.innerHTML = IC.pausa; bPlay.setAttribute("aria-label", "Pausa");
      timer = setInterval(() => vai(i + 1), intervallo);
    }
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const k = b.dataset.b;
      if (k === "play") { timer ? ferma() : parti(); return; }
      ferma();
      if (k === "inizio") vai(0);
      if (k === "indietro") vai(i - 1);
      if (k === "avanti") vai(i + 1);
      if (k === "fine") vai(tot - 1);
    });
    r.addEventListener("input", () => { ferma(); vai(+r.value); });
    const radice = opz.radice || box;
    radice.addEventListener("keydown", (e) => {
      if (e.target.matches("input[type=number], input[type=text], select")) return;
      if (e.key === "ArrowRight") { ferma(); vai(i + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { ferma(); vai(i - 1); e.preventDefault(); }
    });
    ui();
    return {
      vai,
      ferma,
      get i() { return i; },
      nuovo(n) { ferma(); tot = n; i = 0; opz.render(0, false); ui(); }
    };
  }

  /* --------------------------------- volo di un dato da A a B */
  function fly(da, a, etichetta, ritardo) {
    if (motoRidotto.matches || !da || !a || !a.getBoundingClientRect) return;
    const ra = da.getBoundingClientRect ? da.getBoundingClientRect() : da;
    const rb = a.getBoundingClientRect();
    if (!ra.width || !rb.width) return;
    const g = document.createElement("div");
    g.className = "volo";
    g.textContent = etichetta;
    const x0 = ra.left + ra.width / 2, y0 = ra.top + ra.height / 2;
    const x1 = rb.left + rb.width / 2, y1 = rb.top + rb.height / 2;
    g.style.left = x0 + "px";
    g.style.top = y0 + "px";
    g.style.transform = "translate(-50%, -50%)";
    document.body.appendChild(g);
    const dur = 620;
    const anim = g.animate([
      { transform: "translate(-50%, -50%) scale(0.85)", opacity: 0.2 },
      { transform: "translate(-50%, -50%) scale(1.05)", opacity: 1, offset: 0.15 },
      { transform: `translate(calc(-50% + ${x1 - x0}px), calc(-50% + ${y1 - y0}px)) scale(1)`, opacity: 1 }
    ], { duration: dur, delay: ritardo || 0, easing: "cubic-bezier(.35,.7,.25,1)", fill: "backwards" });
    a.animate([{ opacity: 0 }, { opacity: 0, offset: 0.85 }, { opacity: 1 }], { duration: dur + (ritardo || 0) });
    anim.finished.then(() => g.remove(), () => g.remove());
  }

  /* -------------------------------------------------------------- avvio */
  window.Appunti = { $, $$, store, esc, Player, fly, motoRidotto, evidenziaRiga };
  barra();
  home();
  indiceMateria();
  codice();
  quiz();
  esercizi();
  checklist();
  indice();
})();
