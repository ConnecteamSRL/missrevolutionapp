import React from 'react';
import { Text } from 'react-native';

// Le frasi dei testi dei consensi che diventano link, scritte come nel registro
// (apostrofo dritto).
export const LINK_TERMINI = "Termini d'uso";
export const LINK_INFORMATIVA = 'Informativa privacy';

type Link = { frase: string; onPress: () => void };

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Il testo con le frasi dei link toccabili. Il testo a schermo e' la stringa
 * passata, cosi' coincide con quella che finisce nel registro. Se un giorno il
 * testo non contiene piu' una frase, il link compare sotto invece di sparire.
 */
export default function TestoConLink({
  testo,
  links,
  style,
  linkStyle,
}: {
  testo: string;
  links: Link[];
  style: object;
  linkStyle: object;
}) {
  const trovati = links.filter((link) => testo.includes(link.frase));
  const mancanti = links.filter((link) => !trovati.includes(link));
  const parti = trovati.length
    ? testo.split(new RegExp(`(${trovati.map((link) => escapeRegExp(link.frase)).join('|')})`))
    : [testo];

  return (
    <Text style={style}>
      {parti.map((parte, index) => {
        const link = trovati.find((l) => l.frase === parte);
        return link ? (
          <Text key={index} style={linkStyle} onPress={link.onPress} accessibilityRole="link">
            {parte}
          </Text>
        ) : (
          parte
        );
      })}
      {mancanti.map((link) => (
        <Text key={link.frase}>
          {'\n'}
          <Text style={linkStyle} onPress={link.onPress} accessibilityRole="link">
            {link.frase}
          </Text>
        </Text>
      ))}
    </Text>
  );
}
