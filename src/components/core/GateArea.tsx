import React from 'react';
import { ParamListBase, RouteProp } from '@react-navigation/native';

import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import SezioneBloccata from '@components/core/SezioneBloccata';
import { useAreaAperta } from '@/src/hooks/core/useAreaAperta';
import { useRileggiAccesso } from '@/src/hooks/core/useRileggiAccesso';
import { AreaApp } from '@/src/lib/accesso';

type InfoArea = { area: AreaApp; nome: string };

// Accesso limitato: quali schermate richiedono l'abbonamento e a quale area
// appartengono. Una schermata che non compare qui resta sempre aperta: una
// sezione nuova con contenuti del programma va aggiunta a questo elenco.
// Home, chat e profilo non ci sono apposta.
const AREE_SCHEDE: Record<string, InfoArea> = {
  nutrition: { area: 'nutrizione', nome: 'Nutrizione' },
  workout: { area: 'allenamento', nome: 'Workout' },
  progress: { area: 'progressi', nome: 'Progressi' },
};

const AREE_SCHERMATE: Record<string, InfoArea> = {
  'video/index': { area: 'video', nome: 'Video' },
  'video/[categoryId]': { area: 'video', nome: 'Video' },
  '(video)/[videoId]': { area: 'video', nome: 'Video' },
  faq: { area: 'faq', nome: 'Assistente AI' },
  notifications: { area: 'notifiche', nome: 'Notifiche' },
  recipes: { area: 'nutrizione', nome: 'Ricette' },
  '(recipe)/[recipeId]': { area: 'nutrizione', nome: 'Ricette' },
  '(diet)/[dietId]': { area: 'nutrizione', nome: 'Dieta' },
  'survey/index': { area: 'questionari', nome: 'Survey' },
  'survey/[surveyId]': { area: 'questionari', nome: 'Survey' },
  '(workout)/[workoutId]': { area: 'allenamento', nome: 'Workout' },
};

function areaDellArchivio(route: RouteProp<ParamListBase>): InfoArea {
  const tipo = (route.params as { contentType?: string | string[] } | undefined)?.contentType;
  return (Array.isArray(tipo) ? tipo[0] : tipo) === 'workouts'
    ? { area: 'allenamento', nome: 'Workout' }
    : { area: 'nutrizione', nome: 'Nutrizione' };
}

function GateArea({
  info,
  conIntestazione,
  children,
}: {
  info: InfoArea;
  conIntestazione: boolean;
  children: React.ReactElement;
}) {
  const aperta = useAreaAperta(info.area);
  // Se l'abbonamento torna valido mentre il lucchetto e' a schermo, la sezione
  // si apre da sola.
  useRileggiAccesso(!aperta);

  if (aperta) return children;
  const blocco = <SezioneBloccata nome={info.nome} />;
  return conIntestazione ? (
    <ContentScreenLayout title={info.nome}>{blocco}</ContentScreenLayout>
  ) : (
    blocco
  );
}

type ArgomentiLayout = { route: RouteProp<ParamListBase>; children: React.ReactElement };

// Si passano come screenLayout ai navigatori: il lucchetto prende il posto della
// schermata prima che venga montata, quindi i suoi hook non partono (niente
// letture, scritture o fotocamera) e il link da una notifica arriva comunque.

/** Stack principale: lucchetto con freccia indietro e titolo. */
export function layoutSchermataConArea({ route, children }: ArgomentiLayout) {
  const info =
    route.name === 'archive/[contentType]' ? areaDellArchivio(route) : AREE_SCHERMATE[route.name];
  if (!info) return children;
  return (
    <GateArea info={info} conIntestazione>
      {children}
    </GateArea>
  );
}

/** Tab: la testata e la barra le disegna gia' il layout delle tab. */
export function layoutSchedaConArea({ route, children }: ArgomentiLayout) {
  const info = AREE_SCHEDE[route.name];
  if (!info) return children;
  return (
    <GateArea info={info} conIntestazione={false}>
      {children}
    </GateArea>
  );
}
