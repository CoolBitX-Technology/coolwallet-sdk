import { TOKENS } from './token';
import { ChainProps } from '../types';

class FantomChain extends ChainProps {
  id = 250;
  symbol = 'FTM';
  signature = `304402203d1da6abd26d7d80999db165ae163f9ca3355aadc31e3f4eeb311bb67eaf84c20220324290bdacec652e9f2ca54607f4d1ab7449dc4297c3b76a183775cf8c5f0a0d`.padStart(
    144,
    '0'
  );
  tokens = TOKENS;
}

export default new FantomChain();
