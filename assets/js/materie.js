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
      { id: "01-introduzione", titolo: "Introduzione agli algoritmi", sottotitolo: "Algoritmo e programma, l'algoritmo di Euclide, sei modi di calcolare Fibonacci, valore e dimensione dell'input.", stato: "in-arrivo" },
      { id: "02-notazione-asintotica", titolo: "Notazione asintotica e ricorrenze", sottotitolo: "O, Ω, Θ, o, ω, ordini di crescita, caso ottimo/medio/pessimo, analisi ammortizzata, equazioni di ricorrenza e Master Theorem.", stato: "in-arrivo" },
      { id: "03-ordinamento", titolo: "Ordinamento e selezione", sottotitolo: "SelectionSort, InsertionSort, MergeSort, QuickSort, limite Ω(n log n), CountingSort, RadixSort, selezione.", stato: "in-arrivo" },
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
      { id: "01-numeri-finiti", titolo: "Numeri finiti ed errori", sottotitolo: "Errori assoluto e relativo, sistema floating point 𝔽(β,t,L,U), precisione di macchina, aritmetica finita, cancellazione, condizionamento e stabilità.", fonte: "Dispense Loli Piccolomini, lezione «I numeri finiti e il calcolo scientifico»" },
      { id: "02-norme", titolo: "Norme di vettori e matrici", sottotitolo: "Perché i dati sono matrici, norme 1, 2, ∞ e di Frobenius, norme indotte e submoltiplicatività.", fonte: "Dispense Loli Piccolomini, lezione «Perché l'algebra lineare è fondamentale»" },
      { id: "03-fattorizzazioni", titolo: "Fattorizzazioni LU e Cholesky", sottotitolo: "Eliminazione di Gauss, LU, pivoting PA = LU, Cholesky A = LLᵀ, autovalori e autovettori.", stato: "in-arrivo" },
      { id: "04-svd", titolo: "Decomposizione ai valori singolari", sottotitolo: "A = UΣVᵀ, rango, diadi, approssimazione di rango k e compressione delle immagini.", stato: "in-arrivo" },
      { id: "05-sistemi-lineari", titolo: "Sistemi lineari e condizionamento", sottotitolo: "Sostituzioni in avanti e all'indietro, risoluzione con LU e Cholesky, costi, numero di condizionamento.", stato: "in-arrivo" },
      { id: "06-minimi-quadrati", titolo: "Il problema dei minimi quadrati", sottotitolo: "Sistemi sovradeterminati, equazioni normali, soluzione con QR e SVD, pseudoinversa.", stato: "in-arrivo" },
      { id: "07-regressione", titolo: "Approssimazione dei dati e regressione", sottotitolo: "Regressione polinomiale con Vandermonde, MSE e R², overfitting e underfitting, regolarizzazione.", stato: "in-arrivo" },
      { id: "08-zeri", titolo: "Zeri di funzione", sottotitolo: "Bisezione, punto fisso e Newton: convergenza, ordine, criteri di arresto.", stato: "in-arrivo" },
      { id: "09-ottimizzazione", titolo: "Ottimizzazione numerica", sottotitolo: "Punti stazionari, Hessiana, convessità, metodi di discesa, gradiente con backtracking.", stato: "in-arrivo" },
      { id: "10-problemi-inversi", titolo: "Problemi inversi e regolarizzazione", sottotitolo: "Malposizione e regolarizzazione (argomento non ancora spiegato a lezione).", stato: "in-arrivo" },
      { id: "homework", titolo: "Homework e orale", sottotitolo: "HW1 (SVD, sistemi) e HW2 (minimi quadrati): cosa fa il codice, i risultati attesi e le domande probabili all'orale.", stato: "in-arrivo" },
      {
        id: "formulario-quiz",
        titolo: "Formulario e quiz",
        sottotitolo: "Tutto quello che serve per lo scritto a risposta multipla, con 16 quiz a 3 opzioni divisi per argomento.",
        fonte: "Dispense Loli Piccolomini 2026/27, lezioni m3–m12"
      }
    ]
  }
];
