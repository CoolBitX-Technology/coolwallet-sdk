import TEMPLATE from './template';
import BNB from './bnb';
import ADA from './ada';
import CRONOS from './cronos';
import EVM from './evm';
import ETC from './etc';
import ETH from './eth';
import CRO from './cro';
import MATIC from './matic';
import LUNA from './luna';
import sol from './coin-sol';
import TERRA from './terra';
import XTZ from './xtz';
import BSC from './bsc';

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
  { path: 'luna', Element: LUNA },
  { path: 'SOL', Element: sol },
  { path: 'terra', Element: TERRA },
  { path: 'xtz', Element: XTZ },
  { path: 'bsc', Element: BSC },
];
