import inquirer from 'inquirer';
import logSymbols from 'log-symbols';
import buildMandatoryLibrary from './scripts/build-mandatory';
import buildCoinLibrary from './scripts/build-coin-config';

enum BuildOption {
  ALL = 'Build both mandatory library and coin packages',
  MANDATORY = 'Build mandatory library, ex. core and transports',
  COIN_CONFIG_JSON = 'Build coin packages which specific in coin.config.json',
  EXIT = 'Exit bootstrap',
}

const questions = [
  {
    type: 'list',
    name: 'buildType',
    message: 'Which package do you want to bootstrap?',
    choices: [BuildOption.ALL, BuildOption.MANDATORY, BuildOption.COIN_CONFIG_JSON, BuildOption.EXIT],
  },
];

function ask() {
  inquirer.prompt(questions).then(async function (answers) {
    if (answers.buildType) {
      switch (answers.buildType) {
        case BuildOption.ALL:
          await buildMandatoryLibrary();
          await buildCoinLibrary();
          break;
        case BuildOption.MANDATORY:
          await buildMandatoryLibrary();
          break;
        case BuildOption.COIN_CONFIG_JSON:
          await buildCoinLibrary();
          break;
        case BuildOption.EXIT:
          return process.exit(0);
      }
      console.clear();
      console.log(logSymbols.success, `Complete! ${answers.buildType}`)
      ask();
    }
  });
}

console.clear();
ask();
