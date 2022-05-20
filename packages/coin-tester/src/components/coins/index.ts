import TEMPLATE from './template';
import BNB from './bnb';
import ADA from './ada';
import CRONOS from './cronos';
import EVM from './evm';
import ETC from './etc';
import ETH from './eth';
import CRO from './cro';
import MATIC from './matic';
import SOL from './sol';
import TERRA from './terra';
import XTZ from './xtz';
import BSC from './bsc';
import NEAR from './near';
import THETA from './theta';
import AVAXC from './avaxc';

export default [
  { path: 'template', Element: TEMPLATE },
  { path: 'bnb', Element: BNB },
  { path: 'ada', Element: ADA },
  { path: 'eth', Element: ETH },
  { path: 'evm', Element: EVM },
  { path: 'etc', Element: ETC },
  { path: 'cronos', Element: CRONOS },
  { path: 'cro', Element: CRO },
  { path: 'matic', Element: MATIC },
  { path: 'sol', Element: SOL },
  { path: 'terra', Element: TERRA },
  { path: 'xtz', Element: XTZ },
  { path: 'bsc', Element: BSC },
  { path: 'near', Element: NEAR },
  { path: 'theta', Element: THETA },
  { path: 'avaxc', Element: AVAXC },
];
