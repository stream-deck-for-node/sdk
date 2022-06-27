import { AutoRunTimeUnits } from '../types/interfaces';
import { aHour, aMinute, aSecond } from '../util/constant';

export const registeredClasses: Array<[string, any]> = [];

export const updatePeriods: Record<string, number> = {};

export const Action = (
  suffix: string,
  { h, m, s, ms }: AutoRunTimeUnits = {}
) => {
  return (target: any) => {
    registeredClasses.push([suffix, target]);
    updatePeriods[suffix] =
      (h ?? 0) * aHour || (m ?? 0) * aMinute || (s ?? 0) * aSecond || ms || 0;
  };
};
