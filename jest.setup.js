// jest.setup.js
if (process.env.NODE_ENV === 'production') {
  global.console = {
    ...console,
    debug: jest.fn(), // Mock console.log
  };
}
