export const registeredClasses: Array<[string, any]> = [];

export const Action = (suffix: string) => {
  return (target: any) => {
    registeredClasses.push([suffix, target]);
  };
};
