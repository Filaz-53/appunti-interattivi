# Appunti interattivi

Appunti universitari da studiare *facendo*: simulatori da far girare passo per passo, animazioni che mostrano come si spostano i dati, quiz che ricordano le risposte ed esercizi con la soluzione da aprire un passo alla volta.

La home è una **libreria**: ogni materia è un quaderno sullo scaffale. Aprendo un quaderno si arriva all'indice dei suoi argomenti; dallo switcher in alto si salta da una materia all'altra in qualunque pagina.

| Materia | Argomenti |
|---|---|
| **Algoritmi e Strutture di Dati** | Progetto SCC: componenti fortemente connesse (specifica A.A. 2025–2026, Kosaraju, Tarjan, StackOverflow, consegna, 10 esercizi risolti sulla complessità) · Mappa degli esami: analisi degli scritti 2024–2026 |
| **Metodi Numerici per l'Analisi dei Dati** | Formulario e quiz per lo scritto (numeri finiti, fattorizzazioni, sistemi, minimi quadrati, zeri, ottimizzazione) |
| **Tecnologie Web** | Com'è l'esame e 24 domande d'allenamento; capitoli 1–13 dalle slide del corso (architettura, codifica dei caratteri, URI, HTTP, REST, HTML, CSS) e, in attesa delle slide, dagli appunti e dagli esami (JavaScript, Ajax, Node e MongoDB, framework, Semantic Web, UX, accessibilità e sicurezza) |

## Aprire gli appunti

- **Sul proprio computer:** doppio clic su `index.html`. Non serve nessun server né installazione.
- **Online:** con GitHub Pages attivo (vedi sotto) il sito è su `https://<utente>.github.io/<nome-repository>/`.

Le risposte ai quiz e le spunte delle checklist sono salvate nel browser di chi studia (localStorage): ognuno ha i suoi progressi, e nessun dato viene inviato da nessuna parte.

## Struttura

```
appunti-interattivi/
├── index.html                 home: la libreria, un quaderno per materia
├── assets/
│   ├── css/base.css           stile comune (colori, caratteri, componenti, tema chiaro/scuro)
│   └── js/
│       ├── materie.js         REGISTRO di materie e argomenti: si modifica qui
│       └── core.js            barra e switcher, quiz, esercizi a passi, codice, Player e animazioni
├── materie/
│   ├── algoritmi/
│   │   ├── index.html         indice del quaderno (si riempie da materie.js)
│   │   ├── progetto-scc.html  appunti del progetto SCC
│   │   └── widgets.js         simulatori e animazioni di questa materia
│   └── metodi/
│       └── index.html         indice della materia, per ora vuoto
└── modelli/
    └── argomento.html         modello da copiare per un nuovo argomento (con tutti i componenti)
```

## Aggiungere un argomento

1. Copia `modelli/argomento.html` in `materie/<materia>/<nome-argomento>.html`, per esempio `materie/metodi/sistemi-lineari.html`.
2. Nel file nuovo imposta `data-materia="<materia>"` sul tag `<html>` e `data-argomento="<nome-argomento>"` sul tag `<body>`.
3. In `assets/js/materie.js` aggiungi l'argomento all'elenco `argomenti` della materia:
   ```js
   { id: "sistemi-lineari", titolo: "Sistemi lineari", sottotitolo: "Gauss, LU e condizionamento" }
   ```
4. Scrivi gli appunti sostituendo gli esempi del modello. Ogni componente è spiegato lì dentro: definizioni, note a margine, avvisi, codice, pseudocodice, quiz, esercizi a passi, checklist, FAQ.

La pagina compare da sola come nuovo capitolo nell'indice della materia, e il titolo appare anche sulla prima pagina del quaderno nella libreria.

## Aggiungere una materia

1. Crea la cartella `materie/<id>/` (solo minuscole e trattini, per esempio `analisi`).
2. Copia `materie/metodi/index.html` in `materie/<id>/index.html` e cambia `data-materia="metodi"` in `data-materia="<id>"`.
3. In `assets/js/materie.js` aggiungi la materia all'elenco `window.MATERIE` con `id`, `nome`, `breve`, `tinta`, `descrizione` e `argomenti: []`.
4. In `assets/css/base.css`, sotto il commento «inchiostro per materia», aggiungi:
   ```css
   :root[data-materia="<id>"] { --hue: 25; }
   ```
   La tinta è un angolo OKLCH tra 0 e 360 (262 blu, 152 verde, 25 rosso, 75 ocra, 300 viola, 200 azzurro). Usa lo stesso numero del campo `tinta` in `materie.js`: è il colore della copertina del quaderno e dell'inchiostro delle sue pagine.

Il nuovo quaderno compare da solo sullo scaffale della home e nello switcher in alto.

## Widget e animazioni su misura

I widget di una materia vivono nel suo `widgets.js`. Ognuno si aggancia a un elemento con `data-widget="nome"` e può usare due strumenti di `core.js`:

- `Appunti.Player(contenitore, { passi, render })` crea i comandi inizio/indietro/play/avanti/fine con la barra di scorrimento e le frecce della tastiera. `render(i, avanti)` disegna il passo `i`.
- `Appunti.fly(da, a, etichetta)` fa volare un'etichetta da un elemento (o da un rettangolo) a un altro: è l'animazione che mostra i dati che passano da una struttura all'altra.

`materie/algoritmi/widgets.js` è l'esempio completo: vista dei grafi in SVG, simulatori di Kosaraju e Tarjan, costruzione del trasposto, DFS iterativa e widget sulla complessità.

## Pubblicare su GitHub

### Prima volta

1. Su GitHub crea un repository vuoto, per esempio `appunti-interattivi` (pulsante **New**). Sceglilo **Public** se vuoi GitHub Pages gratis, e non aggiungere README né licenza (ci sono già qui).
2. Dal terminale, nella cartella del progetto:
   ```sh
   cd appunti-interattivi
   git init
   git add .
   git commit -m "Prima versione degli appunti interattivi"
   git branch -M main
   git remote add origin https://github.com/<utente>/appunti-interattivi.git
   git push -u origin main
   ```
   Se `git push` chiede una password, quella dell'account non funziona: accedi con [GitHub Desktop](https://desktop.github.com/), con `gh auth login` della [GitHub CLI](https://cli.github.com/), oppure crea un *personal access token* e usalo come password.
3. **Senza terminale:** nel repository appena creato clicca *uploading an existing file* e trascina dentro tutto il contenuto della cartella, poi **Commit changes**.

### Metterlo online con GitHub Pages

Nel repository: **Settings → Pages → Build and deployment**. In *Source* scegli **Deploy from a branch**, poi branch **main** e cartella **/ (root)**, e salva. Dopo un minuto o due il sito è su `https://<utente>.github.io/appunti-interattivi/`. Il file `.nojekyll` evita che GitHub rielabori i file.

### Lavorare in più persone

**Settings → Collaborators → Add people** per dare accesso in scrittura ai compagni. Per le modifiche successive:

```sh
git pull                 # prendi le modifiche degli altri
# ... modifica i file ...
git add .
git commit -m "Aggiunto argomento sui sistemi lineari"
git push
```

## Fonti

- Algoritmi, Progetto SCC: «Algoritmi e Strutture di Dati — Specifiche Progetto A.A. 2025–2026» e la libreria del corso su [github.com/disiasd/asd26](https://github.com/disiasd/asd26). Gli appunti riformulano la specifica; il PDF originale non è incluso nel repository. I numeri sul grafo `roadNet-TX` e i messaggi di `javac` sono stati verificati sul repository del corso.
