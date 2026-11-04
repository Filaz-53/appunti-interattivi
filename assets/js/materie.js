/* =====================================================================
   Registro delle materie e degli argomenti.
   È l'unico posto da modificare per aggiungere una materia o un argomento:
   la barra in alto, lo switcher tra materie, la home e gli indici delle
   materie si costruiscono da qui.

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
   ===================================================================== */

window.MATERIE = [
  {
    id: "algoritmi",
    nome: "Algoritmi e Strutture di Dati",
    breve: "Algoritmi",
    tinta: 262,
    descrizione: "Grafi, visite e complessità, a partire dalla specifica del progetto A.A. 2025–2026.",
    argomenti: [
      {
        id: "progetto-scc",
        titolo: "Progetto SCC",
        sottotitolo: "Componenti fortemente connesse: la specifica del progetto spiegata sezione per sezione, con simulatori, animazioni ed esercizi risolti sulla complessità.",
        fonte: "Specifiche Progetto ASD A.A. 2025–2026 e libreria del corso"
      }
    ]
  },
  {
    id: "metodi",
    nome: "Metodi",
    breve: "Metodi",
    tinta: 152,
    descrizione: "Seconda materia, pronta da riempire con i prossimi appunti.",
    argomenti: []
  }
];
