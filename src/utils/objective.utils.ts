import { Enums } from '@mr-types/database.types';

export type FitnessObjective = Enums<'fitness_objective'>;

export const OBJECTIVE_ORDER: FitnessObjective[] = [
  'dimagrimento',
  'costruzione_muscolare',
  'mantenimento',
  '8_settimane_shock',
];

export const formatObjective = (obj: FitnessObjective | null | undefined): string => {
  if (!obj) return '—';
  switch (obj) {
    case 'dimagrimento':
      return 'Perdita Peso';
    case 'costruzione_muscolare':
      return 'Massa Muscolare';
    case 'mantenimento':
      return 'Mantenimento';
    case '8_settimane_shock':
      return '8 Settimane Shock';
    default:
      return obj;
  }
};
