import { CHAIN } from '../src';

const SupportedChains = Object.values(CHAIN);

function camelize(str: string) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index === 0 ? word.toUpperCase() : word.toLowerCase();
  });
}

function separator(name: string) {
  const middle = (process.stdout.columns - name.length) / 2;
  return '='.repeat(middle) + name + '='.repeat(middle);
}

SupportedChains.forEach((chain) => {
  const symbol = camelize(chain.getSymbol());
  console.log(separator(symbol));
  const coins = chain.getCoins();
  console.log(`${symbol} Chain: ${chain.toHexChainInfo()}`);
  Object.entries(coins).forEach((c) => {
    console.log(`${symbol} Coin ${c[0]}: ${c[1].toHexCoinInfo()}`);
  });
});
