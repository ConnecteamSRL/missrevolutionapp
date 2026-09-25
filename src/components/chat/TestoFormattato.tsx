import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { GraphitFonts } from '@/src/theme';

// Il Markdown ridotto delle risposte dell'assistente AI (README del servizio FAQ): **grassetto**,
// paragrafi separati da una riga vuota, elenchi con «- » o numerati con «1. ». Nient'altro: un
// titolo con # perde i cancelletti e diventa grassetto, il resto resta testo com'è.

type Voce = { segno: string; testo: string };
type Blocco = { tipo: 'paragrafo'; righe: string[] } | { tipo: 'elenco'; voci: Voce[] };

const VOCE = /^\s*(?:[-*•]|(\d{1,3})[.)])\s+(.*)$/;
const TITOLO = /^\s*#{1,6}\s+(.*)$/;
const GRASSETTO = /(\*\*[^*\n]+?\*\*)/;

function inBlocchi(testo: string): Blocco[] {
  const blocchi: Blocco[] = [];
  let corrente: Blocco | null = null;
  for (const riga of testo.replace(/\r\n?/g, '\n').split('\n')) {
    if (!riga.trim()) {
      corrente = null;
      continue;
    }
    const voce = VOCE.exec(riga);
    if (voce) {
      const nuova = { segno: voce[1] ? `${voce[1]}.` : '•', testo: voce[2] };
      if (corrente?.tipo === 'elenco') corrente.voci.push(nuova);
      else blocchi.push((corrente = { tipo: 'elenco', voci: [nuova] }));
      continue;
    }
    const titolo = TITOLO.exec(riga);
    const testoRiga = titolo ? `**${titolo[1].replace(/\*\*/g, '')}**` : riga.trim();
    // Una riga senza segno subito sotto una voce la continua.
    if (corrente?.tipo === 'elenco') {
      const ultima = corrente.voci[corrente.voci.length - 1];
      ultima.testo = `${ultima.testo} ${testoRiga}`;
    } else if (corrente?.tipo === 'paragrafo') corrente.righe.push(testoRiga);
    else blocchi.push((corrente = { tipo: 'paragrafo', righe: [testoRiga] }));
  }
  return blocchi;
}

function Riga({ testo }: { testo: string }) {
  return (
    <>
      {testo.split(GRASSETTO).map((parte, i) =>
        GRASSETTO.test(parte) ? (
          <Text key={i} style={styles.grassetto}>
            {parte.slice(2, -2)}
          </Text>
        ) : (
          parte
        ),
      )}
    </>
  );
}

/** Il testo senza i segni della formattazione, per VoiceOver e TalkBack. */
export const senzaFormattazione = (testo: string) =>
  testo.replace(/\*\*([^*\n]+?)\*\*/g, '$1').replace(/^\s*#{1,6}\s+/gm, '');

export default function TestoFormattato({
  testo,
  style,
}: {
  testo: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.blocchi}>
      {inBlocchi(testo).map((blocco, i) =>
        blocco.tipo === 'paragrafo' ? (
          <Text key={i} style={style}>
            <Riga testo={blocco.righe.join('\n')} />
          </Text>
        ) : (
          <View key={i} style={styles.elenco}>
            {blocco.voci.map((voce, j) => (
              <View key={j} style={styles.voce}>
                <Text style={[style, styles.segno]}>{voce.segno}</Text>
                <Text style={[style, styles.testoVoce]}>
                  <Riga testo={voce.testo} />
                </Text>
              </View>
            ))}
          </View>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  blocchi: { gap: 8 },
  elenco: { gap: 4 },
  voce: { flexDirection: 'row' },
  segno: { minWidth: 18 },
  testoVoce: { flex: 1 },
  grassetto: { fontFamily: GraphitFonts.GraphitBold },
});
