import { calculateAmount } from '../../utils/pricing';


describe('calculateAmount', () => {
  it('should calculate correct amount for single lessons', () => {
    expect(calculateAmount(30, false)).toBe(30);
    expect(calculateAmount(45, false)).toBe(45);
    expect(calculateAmount(60, false)).toBe(60);
  });

  it('should calculate correct amount for lesson packages', () => {
    expect(calculateAmount(30, true)).toBe(110);
    expect(calculateAmount(45, true)).toBe(170);
    expect(calculateAmount(60, true)).toBe(220);
  });

  it('should throw error for invalid duration', () => {
    expect(() => calculateAmount(20, false)).toThrow('Invalid lesson duration');
  });
});