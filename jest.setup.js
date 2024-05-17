// jest.setup.js
if (process.env.NODE_ENV !== 'development') {
  global.console = {
    ...console,
    debug: jest.fn(), // Mock console.debug
  };
}
