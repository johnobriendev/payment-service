describe('calculateAmount', () => {
  it('should calculate correct amount for single 30-minute lesson', () => {
    expect(calculateAmount(30, false)).toBe(30);
  });
});