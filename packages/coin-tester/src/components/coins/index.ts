import template from './template';
import ada from './ada';
import cronos from './coin-cronos';
import ETC from './ETC';
import ETH from './coin-eth';
import cro from './coin-cro';

export default [
  { path: 'Template', Element: template },
  { path: 'ada', Element: ada },
  { path: 'Ethereum', Element: ETH },
  { path: 'ETC', Element: ETC },
  { path: 'Cronos', Element: cronos },
  { path: 'Crypto.Org', Element: cro },
];
