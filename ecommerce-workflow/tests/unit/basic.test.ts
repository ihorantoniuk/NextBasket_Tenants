// Simple test to verify Jest setup
test('basic math works', () => {
  expect(1 + 1).toBe(2);
});

test('async operations work', async () => {
  const result = await Promise.resolve('test');
  expect(result).toBe('test');
});
