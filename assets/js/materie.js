/* =====================================================================
   Registro delle materie e degli argomenti.
   È l'unico posto da modificare per aggiungere una materia o un argomento:
   la barra in alto, lo switcher tra materie, la libreria della home e gli
   indici delle materie si costruiscono da qui.

   Campi di una materia
     id          nome della cartella in materie/ (solo lettere minuscole e trattini)
     nome        nome completo, come sul libretto
     breve       nome corto per lo switcher
     tinta       tinta OKLCH dell'inchiostro (0–360): 262 blu, 152 verde, 25 rosso, 75 ocra, 300 viola
                 Ricordati di aggiungere la stessa tinta in assets/css/base.css
                 (riga  :root[data-materia="..."] { --hue: ... }).
     descrizione una frase che appare nella home
     argomenti   elenco degli argomenti (vedi sotto); può essere vuoto

   Campi di un argomento
     id          nome del file senza .html (deve coincidere con data-argomento nella pagina)
     titolo      titolo breve
     sottotitolo una riga di descrizione
     fonte       da dove vengono gli appunti (facoltativo)
     stato       "in-arrivo" se la pagina non esiste ancora (facoltativo)
   ===================================================================== */

window.MATERIE = [
  {
    id: "algoritmi",
    nome: "Algoritmi e Strutture di Dati",
    breve: "Algoritmi",
    tinta: 262,
    descrizione: "Il corso completo (37635, 12 CFU): appunti di Berto, lucidi, esercizi risolti ed esami del professore dal 2020 al 2026.",
    argomenti: [
      { id: "01-introduzione", titolo: "Introduzione agli algoritmi", sottotitolo: "Algoritmo e programma, l'algoritmo di Euclide, sei modi di calcolare Fibonacci, valore e dimensione dell'input.", fonte: "Lucidi «Introduzione agli algoritmi», appunti di Berto e tr4v4" },
      { id: "02-notazione-asintotica", titolo: "Notazione asintotica e ricorrenze", sottotitolo: "O, Ω, Θ, o, ω, ordini di crescita, caso ottimo/medio/pessimo, analisi ammortizzata, equazioni di ricorrenza e Master Theorem.", fonte: "Lucidi «Notazione asintotica» ed «Equazioni di ricorrenza» con esercizi risolti" },
      { id: "03-ordinamento", titolo: "Ordinamento e selezione", sottotitolo: "SelectionSort, InsertionSort, MergeSort, QuickSort, limite Ω(n log n), CountingSort, RadixSort, selezione.", fonte: "Lucidi «Ordinamento» e «Selezione», esercizio sulla bandiera nazionale" },
      { id: "04-strutture-elementari", titolo: "Strutture dati elementari", sottotitolo: "Dizionari, array dinamici, liste, pile e code.", stato: "in-arrivo" },
      { id: "05-alberi", titolo: "Alberi, BST e AVL", sottotitolo: "Alberi e visite, alberi binari di ricerca, alberi AVL con rotazioni.", stato: "in-arrivo" },
      { id: "06-tabelle-hash", titolo: "Tabelle hash", sottotitolo: "Funzioni hash, concatenamento, indirizzamento aperto con ispezione lineare, quadratica e doppio hashing.", stato: "in-arrivo" },
      { id: "07-heap", titolo: "Heap e code con priorità", sottotitolo: "Heap binari, fixHeap, heapify, HeapSort, code con priorità e d-heap.", stato: "in-arrivo" },
      { id: "08-union-find", titolo: "Union-Find", sottotitolo: "QuickFind, QuickUnion e le euristiche sul peso e sul rango.", stato: "in-arrivo" },
      { id: "09-tecniche-algoritmiche", titolo: "Tecniche algoritmiche", sottotitolo: "Divide et impera, algoritmi greedy, programmazione dinamica.", stato: "in-arrivo" },
      { id: "10-grafi", titolo: "Grafi e visite", sottotitolo: "Definizioni, rappresentazioni, BFS, DFS, ordinamento topologico, componenti connesse e fortemente connesse.", stato: "in-arrivo" },
      { id: "11-mst-cammini-minimi", titolo: "Alberi di copertura e cammini minimi", sottotitolo: "Kruskal, Prim, Bellman-Ford, Dijkstra, Floyd-Warshall.", stato: "in-arrivo" },
      { id: "12-np-completezza", titolo: "NP-completezza", sottotitolo: "Classi P, NP, PSpace, ExpTime, riducibilità, problemi NP-completi.", stato: "in-arrivo" },
      { id: "java", titolo: "Java per il corso", sottotitolo: "Il Java che serve per la libreria del corso: classi, interfacce, generics, collections, eccezioni.", stato: "in-arrivo" },
      { id: "formulario", titolo: "Formulario dei costi", sottotitolo: "Tutti i costi computazionali del corso in una tabella da consultare e filtrare.", stato: "in-arrivo" },
      { id: "esami", titolo: "Esami svolti", sottotitolo: "Tutte le prove del professore dal 2020 al 2026, divise per argomento, con soluzione passo per passo e modalità simulazione.", stato: "in-arrivo" },
      {
        id: "progetto-scc",
        titolo: "Progetto SCC",
        sottotitolo: "Componenti fortemente connesse: la specifica del progetto spiegata sezione per sezione, con simulatori, animazioni ed esercizi risolti sulla complessità.",
        fonte: "Specifiche Progetto ASD A.A. 2025–2026 e libreria del corso"
      },
      {
        id: "mappa-esami",
        titolo: "Mappa degli esami",
        sottotitolo: "Cosa esce allo scritto e con che frequenza: analisi dei 18 scritti 2024–2026, priorità di studio e checklist.",
        fonte: "Scritti con soluzione 2024–2026 (risorse.vercel.app)"
      }
    ]
  },
  {
    id: "metodi",
    nome: "Metodi Numerici per l'Analisi dei Dati",
    breve: "Metodi",
    tinta: 152,
    descrizione: "Il corso B9132 (6 CFU) della prof.ssa Loli Piccolomini, capitolo per capitolo: teoria minima, esercizi svolti e quiz a 3 opzioni come allo scritto.",
    argomenti: [
      { id: "00-basi", titolo: "Le basi che servono", sottotitolo: "Algebra lineare e analisi da zero: simboli, vettori, matrici, prodotto, sistemi, determinante e inversa, rango, autovalori, derivate e gradiente.", fonte: "Scritto da noi per colmare i prerequisiti" },
      { id: "01-numeri-finiti", titolo: "Numeri finiti ed errori", sottotitolo: "Errori assoluto e relativo, sistema floating point 𝔽(β,t,L,U), precisione di macchina, aritmetica finita, cancellazione, condizionamento e stabilità.", fonte: "Dispense Loli Piccolomini, lezione «I numeri finiti e il calcolo scientifico»" },
      { id: "02-norme", titolo: "Norme di vettori e matrici", sottotitolo: "Perché i dati sono matrici, norme 1, 2, ∞ e di Frobenius, norme indotte e submoltiplicatività.", fonte: "Dispense Loli Piccolomini, lezione «Perché l'algebra lineare è fondamentale»" },
      { id: "03-fattorizzazioni", titolo: "Fattorizzazioni LU e Cholesky", sottotitolo: "Eliminazione di Gauss, LU, pivoting PA = LU, Cholesky A = LLᵀ, autovalori e autovettori.", fonte: "Dispense Loli Piccolomini, lezione «Fattorizzazione di matrici»" },
      { id: "04-svd", titolo: "Decomposizione ai valori singolari", sottotitolo: "A = UΣVᵀ, rango, diadi, approssimazione di rango k e compressione delle immagini.", fonte: "Dispense Loli Piccolomini, lezione «Decomposizione ai valori singolari»" },
      { id: "05-sistemi-lineari", titolo: "Sistemi lineari e condizionamento", sottotitolo: "Sostituzioni in avanti e all'indietro, risoluzione con LU e Cholesky, costi, numero di condizionamento.", fonte: "Dispense Loli Piccolomini, lezione «Sistemi lineari»" },
      { id: "06-minimi-quadrati", titolo: "Il problema dei minimi quadrati", sottotitolo: "Sistemi sovradeterminati, equazioni normali, soluzione con QR e SVD, pseudoinversa.", fonte: "Dispense Loli Piccolomini, lezione «Il problema lineare dei minimi quadrati»" },
      { id: "07-regressione", titolo: "Approssimazione dei dati e regressione", sottotitolo: "Regressione polinomiale con Vandermonde, MSE e R², overfitting e underfitting, regolarizzazione.", fonte: "Dispense Loli Piccolomini, lezione «Minimi quadrati nell'approssimazione dei dati»" },
      { id: "08-zeri", titolo: "Zeri di funzione", sottotitolo: "Bisezione, punto fisso e Newton: convergenza, ordine, criteri di arresto.", fonte: "Dispense Loli Piccolomini, lezione «Risoluzione di equazioni non lineari»" },
      { id: "09-ottimizzazione", titolo: "Ottimizzazione numerica", sottotitolo: "Punti stazionari, Hessiana, convessità, metodi di discesa, gradiente con backtracking.", fonte: "Dispense Loli Piccolomini, lezione «Ottimizzazione numerica»" },
      { id: "10-problemi-inversi", titolo: "Problemi inversi e regolarizzazione", sottotitolo: "Malposizione e regolarizzazione (argomento non ancora spiegato a lezione).", stato: "in-arrivo" },
      { id: "homework", titolo: "Homework e orale", sottotitolo: "HW1 (SVD, sistemi) e HW2 (minimi quadrati): cosa fa il codice, i risultati attesi e le domande probabili all'orale.", fonte: "Testi HW1 e HW2 del laboratorio (Morotti)" },
      {
        id: "formulario-quiz",
        titolo: "Formulario e quiz",
        sottotitolo: "Tutto quello che serve per lo scritto a risposta multipla, con 16 quiz a 3 opzioni divisi per argomento.",
        fonte: "Dispense Loli Piccolomini 2026/27, lezioni m3–m12"
      }
    ]
  },
  {
    id: "tecweb",
    nome: "Tecnologie Web",
    breve: "TecWeb",
    tinta: 25,
    descrizione: "Il corso 88566 (9 CFU) del prof. Vitali, dalle slide del corso: dai caratteri e gli URI fino a framework e Semantic Web, preparato sul quiz d'esame del 2026.",
    argomenti: [
      { id: "00-com-e-l-esame", titolo: "Com'è l'esame e quiz", sottotitolo: "Lo scritto 2026/27 al computer (base 6, HTML+CSS 10, JS 12, framework 6), il quiz 2026, cosa esce più spesso, 24 domande d'allenamento e 3 domande aperte con risposta modello.", fonte: "Scritti 2022–2026 (risorse.vercel.app), scheda dell'insegnamento 2026/27, sito del laboratorio (ex23)" },
      { id: "01-architettura", titolo: "Architettura del Web", sottotitolo: "Client e server, modelli a tre e quattro livelli, Ajax e Web 2.0, CDN, strumenti dello sviluppatore.", fonte: "Slide Vitali «Introduzione al WWW»" },
      { id: "02-codifica-caratteri", titolo: "Codifica dei caratteri", sottotitolo: "ASCII, ISO Latin-1, Unicode e i suoi piani (BMP), UCS e UTF-8/16: come si leggono i byte.", fonte: "Slide Vitali «I set di caratteri»" },
      { id: "03-uri", titolo: "URI", sottotitolo: "Risorse, URL e URN, sintassi, risoluzione degli URI relativi, design degli URI.", fonte: "Slide Vitali «URI»" },
      { id: "04-http", titolo: "HTTP", sottotitolo: "Richieste e risposte, metodi, metodi sicuri e idempotenti, codici di stato, header, connessioni persistenti, cookie.", fonte: "Slide Di Iorio «HyperText Transfer Protocol»" },
      { id: "05-rest", titolo: "API REST", sottotitolo: "Risorse, stateless, progettare gli endpoint, content negotiation, JSON.", fonte: "Slide Di Iorio «API REST»" },
      { id: "06-html", titolo: "Markup e HTML", sottotitolo: "Markup presentazionale e descrittivo, struttura di un documento, elementi semantici, form, DOM.", fonte: "Slide Vitali «Markup», «HTML I e II parte»" },
      { id: "07-css", titolo: "CSS", sottotitolo: "Selettori e specificità, box model, unità di misura, position, flexbox, grid, responsive, Bootstrap e Tailwind.", fonte: "Slide Vitali «CSS I, II e III parte»" },
      { id: "08-javascript", titolo: "JavaScript: il linguaggio", sottotitolo: "Tipi, null e undefined, oggetti e prototipi, array e map/filter/reduce/forEach, Date, closure.", fonte: "Appunti di Berto, scritti 2025–2026 (slide del prof non ancora uscite)" },
      { id: "09-js-browser-ajax", titolo: "JavaScript nel browser e Ajax", sottotitolo: "DOM ed eventi, XMLHttpRequest e fetch, callback, Promise, async/await, chiamate in sequenza.", fonte: "Appunti di Berto, scritti 2026 (slide del prof non ancora uscite)" },
      { id: "10-server-side", titolo: "Server side: Node.js e MongoDB", sottotitolo: "Node.js ed event loop, callback error-first, Express, MongoDB, _id e schemi Mongoose.", fonte: "Scritti 2024–2026, documentazione Node/Mongoose (slide non ancora uscite)" },
      { id: "11-framework", titolo: "Framework a componenti", sottotitolo: "React, Vue, Angular, Virtual DOM, Web Components e Shadow DOM, SSR e CSR.", fonte: "Slide «Introduzione al WWW», scritti 2024–2026 (slide sui framework non ancora uscite)" },
      { id: "12-semantic-web", titolo: "Semantic Web", sottotitolo: "RDF e triple, Turtle, blank node, ontologie e OWL, SPARQL.", fonte: "Appunti di Berto, scritti 2022–2026 (slide non ancora uscite)" },
      { id: "13-ux-accessibilita-sicurezza", titolo: "UX, accessibilità e sicurezza", sottotitolo: "Il modello di Garrett, accessibilità (WAI-ARIA), header di sicurezza.", fonte: "Scritti 2022–2024, WCAG e OWASP (slide non ancora uscite)" },
      { id: "progetto", titolo: "Il progetto di gruppo", sottotitolo: "Specifica, requisiti, organizzazione del gruppo e come prepararsi alla presentazione.", stato: "in-arrivo" }
    ]
  }
];
