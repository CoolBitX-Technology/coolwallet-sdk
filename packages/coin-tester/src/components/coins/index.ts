import template from './template';
import bnb from './bnb';
import ADA from './ada';
import CRONOS from './cronos';
import ETC from './etc';
import ETH from './eth';
import CRO from './cro';
import matic from './matic';
import LUNA from './luna';
import AVAXC from './avaxc';

export default [
  { path: 'template', Element: template },
  { path: 'bnb', Element: bnb },
  { path: 'ada', Element: ADA },
  { path: 'eth', Element: ETH },
  { path: 'etc', Element: ETC },
  { path: 'cronos', Element: CRONOS },
  { path: 'cro', Element: CRO },
  { path: 'matic', Element: matic },
  { path: 'luna', Element: LUNA },
  { path: 'avaxc', Element: AVAXC },
];
