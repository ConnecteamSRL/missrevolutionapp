/**
 * Configurazione Prettier per progetti Expo/React Native.
 * Si basa sulle best practice per la leggibilità e la consistenza.
 * @see https://prettier.io/docs/en/configuration.html
 */
module.exports = {
  // Stampa la larghezza massima della riga a 100 caratteri. Una riga più corta è
  // preferibile in molti contesti mobile/React Native.
  printWidth: 100,

  // Utilizza virgolette singole invece di doppie per le stringhe (es: 'stringa').
  singleQuote: true,

  // Aggiunge una virgola finale per array e oggetti (es: {a: 1, b: 2,}) per un diff più pulito.
  trailingComma: 'all',

  // Utilizza punti e virgola alla fine delle istruzioni.
  semi: true,

  // La dimensione di un singolo livello di indentazione.
  tabWidth: 2,

  // Utilizza spazi per l'indentazione.
  useTabs: false,

  // Inserisce una singola linea di newline per separare i blocchi di codice (valido per JavaScript/JSX/TSX).
  jsxSingleQuote: false,

  // Pone la parentesi angolare chiusa > di un tag multilinea HTML/JSX sull'ultima riga invece di una nuova riga.
  jsxBracketSameLine: false,

  // Include parentesi attorno a un singolo parametro di funzione freccia (es: (x) => x).
  arrowParens: 'always',

  // Specifica la sequenza di terminazione di riga da utilizzare. 'lf' (Line Feed) è standard per Unix/Git.
  endOfLine: 'lf',
};
