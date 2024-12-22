export const calculateAmount = (duration: number, isPackage: boolean): number => {
  const baseRates: { [key: number]: number } = {
    30: 30
  };

  return baseRates[duration];
};