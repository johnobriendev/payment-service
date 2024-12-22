export const calculateAmount = (duration: number, isPackage: boolean): number => {
  const baseRates: { [key: number]: number } = {
    30: 30,
    45: 45,
    60: 60
  };

  const packageRates: { [key: number]: number } = {
    30: 110,
    45: 170,
    60: 220
  };

  if (!baseRates[duration]) {
    throw new Error('Invalid lesson duration');
  }

  return isPackage ? packageRates[duration] : baseRates[duration];

};