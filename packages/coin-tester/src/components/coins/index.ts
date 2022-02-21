import template from './template';
import ADA from './ada';
import CRONOS from './cronos';
import ETC from './etc';
import ETH from './eth';
import CRO from './cro';

export default [
  { path: 'Template', Element: template },
  { path: 'ada', Element: ADA },
  { path: 'eth', Element: ETH },
  { path: 'etc', Element: ETC },
  { path: 'cronos', Element: CRONOS },
  { path: 'cro', Element: CRO },
];
