import { CardType } from '../../transport';

const SE_UPDATE_VER_PRO = 341;
const SE_UPDATE_VER_GO = 12;

const CHALLENGE_URL = 'https://ota.cbx.io/api/challenge';
const CRYPTOGRAM_URL = 'https://ota.cbx.io/api/cryptogram';
const CHALLENGE_URL_V2 = 'https://vas.wallet.cbx.io/ota/api/challenge';
const CRYPTOGRAM_URL_V2 = 'https://vas.wallet.cbx.io/ota/api/cryptogram';
const MAIN_AID_PRO = '436f6f6c57616c6c657450524f'; // CoolWalletPRO
const MAIN_AID_GO = '436f6f6c57616c6c65744c495445'; // CoolWalletLITE
const BACKUP_AID = '4261636b75704170706c6574';
const CARDMANAGER_AID = 'A000000151000000';
const SSD_AID = 'A000000151535041';

interface OtaConfig {
  getNewSeVersion: () => number;
  getMainAppletAid: () => string;
  getChallengeUrl: () => string;
  getCryptogramUrl: () => string;
}

class ProOtaConfig implements OtaConfig {
  getNewSeVersion = () => SE_UPDATE_VER_PRO;
  getMainAppletAid = () => MAIN_AID_PRO;
  getChallengeUrl = () => CHALLENGE_URL;
  getCryptogramUrl = () => CRYPTOGRAM_URL;
}

class GoOtaConfig implements OtaConfig {
  getNewSeVersion = () => SE_UPDATE_VER_GO;
  getMainAppletAid = () => MAIN_AID_GO;
  getChallengeUrl = () => CHALLENGE_URL_V2;
  getCryptogramUrl = () => CRYPTOGRAM_URL_V2;
}

const getOtaConfig = (cardType: CardType): OtaConfig => {
  switch (cardType) {
    case CardType.Go:
      return new GoOtaConfig();
    case CardType.Pro:
      return new ProOtaConfig();
    default:
      throw new Error(`getOtaConfig unknown cardType: ${cardType}`);
  }
};

const getNewSeVersion = (cardType: CardType) => {
  return getOtaConfig(cardType).getNewSeVersion();
};

const getMainAppletAid = (cardType: CardType) => {
  return getOtaConfig(cardType).getMainAppletAid();
};

const getChallengeUrl = (cardType: CardType) => {
  return getOtaConfig(cardType).getChallengeUrl();
};

const getCryptogramUrl = (cardType: CardType) => {
  return getOtaConfig(cardType).getCryptogramUrl();
};

export {
  SE_UPDATE_VER_PRO,
  SE_UPDATE_VER_GO,
  CHALLENGE_URL,
  CRYPTOGRAM_URL,
  MAIN_AID_PRO,
  MAIN_AID_GO,
  BACKUP_AID,
  CARDMANAGER_AID,
  SSD_AID,
  getNewSeVersion,
  getMainAppletAid,
  getChallengeUrl,
  getCryptogramUrl,
};
