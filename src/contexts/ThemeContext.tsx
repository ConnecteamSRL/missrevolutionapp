import React, { createContext, useContext, useEffect, useMemo } from 'react';

import { useAppConfig } from '@/src/contexts/AppConfigContext';
import { useUser } from '@/src/contexts/UserContext';
import { useGenderStore } from '@/src/store/genderStore';
import { DEFAULT_THEME, themeFromRow } from '@/src/theme/defaultTheme';
import { AppTheme } from '@mr-types/theme.types';

const ThemeContext = createContext<AppTheme | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config } = useAppConfig();
  const { me } = useUser();
  const rememberedGender = useGenderStore((s) => s.gender);

  const serverGender = me?.profile?.gender ?? null;

  // Il profilo arriva dopo i colori: finche' non c'e', si usa l'ultimo sesso
  // conosciuto per non far lampeggiare il tema sbagliato al riavvio.
  useEffect(() => {
    if (me) useGenderStore.getState().setGender(serverGender);
  }, [me, serverGender]);

  const gender = serverGender ?? rememberedGender;

  // Solo "maschio" prende il tema maschile. Femmina, non binario, altro, non
  // dichiarato e sesso non impostato ricadono tutti sul tema femminile.
  // Il tema maschile vale solo se e' stato configurato: altrimenti si ricade su
  // quello predefinito del brand, non sui colori scritti nel codice (stessa
  // regola del banner maschile, HomeBannerComponent).
  const row = gender === 'maschio' && config?.theme_male ? config.theme_male : config?.theme_female;

  // La dipendenza e' la riga scelta, non il sesso. Il sesso ricordato arriva
  // dalla memoria del telefono poco dopo l'avvio e quasi sempre conferma il
  // tema gia' in uso: memoizzare sul sesso produrrebbe un oggetto tema nuovo
  // a parita' di colori, e ogni componente che costruisce gli stili da `theme`
  // li rifarebbe per niente (RenderHTML arriva a ricostruire il suo motore).
  const theme = useMemo(() => themeFromRow(row), [row]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

/**
 * Colori del brand per l'utente corrente.
 *
 * Gli stili che li usano vanno costruiti dentro al componente (una factory
 * `makeStyles(theme)` memoizzata), non con `StyleSheet.create` a livello di
 * modulo: quest'ultimo viene valutato all'import e resterebbe congelato sui
 * colori iniziali.
 */
export const useTheme = (): AppTheme => {
  const theme = useContext(ThemeContext);
  // Nessun provider: capita negli entry point che girano prima dell'albero
  // principale. Meglio i colori storici che un crash.
  return theme ?? DEFAULT_THEME;
};
