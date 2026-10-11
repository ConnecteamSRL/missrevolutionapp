import { useAccessoStore } from '@/src/store/accessoStore';
import { areaAperta, AreaApp } from '@/src/lib/accesso';

// Il selettore restituisce un booleano: lo stato si rilegge a ogni ritorno in
// primo piano e ogni lettura crea un oggetto nuovo, ma il componente si
// ridisegna solo quando l'area si apre o si chiude davvero.
export function useAreaAperta(area: AreaApp): boolean {
  return useAccessoStore((s) => areaAperta(s.stato, area));
}
