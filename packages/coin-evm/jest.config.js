/** @returns {Promise<import('jest').Config>} */
module.exports = async () => {
  return {
    coveragePathIgnorePatterns: ['/tests/', '/node_modules/'],
  };
};
