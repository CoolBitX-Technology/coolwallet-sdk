import { CardType } from '../../transport';

const SE_UPDATE_VER_PRO = 341;
const SE_UPDATE_VER_GO = 2;

const CHALLENGE_URL = 'https://ota.cbx.io/api/challenge';
const CRYPTOGRAM_URL = 'https://ota.cbx.io/api/cryptogram';
const MAIN_AID_PRO = '436f6f6c57616c6c657450524f'; // CoolWalletPRO
const MAIN_AID_GO = '436f6f6c57616c6c65744c495445'; // CoolWalletLITE
const BACKUP_AID = '4261636b75704170706c6574';
const CARDMANAGER_AID = 'A000000151000000';
const SSD_AID = 'A000000151535041';

const getNewSeVersion = (cardType: CardType) => {
  if (cardType === CardType.Pro) {
    return SE_UPDATE_VER_PRO;
  } else if (cardType === CardType.Go) {
    return SE_UPDATE_VER_GO;
  } else {
    throw new Error(`getNewSeVersion unknown cardType: ${cardType}`);
  }
};

const getMainAppletAid = (cardType: CardType) => {
  if (cardType === CardType.Pro) {
    return MAIN_AID_PRO;
  } else if (cardType === CardType.Go) {
    return MAIN_AID_GO;
  } else {
    throw new Error(`getMainAppletAid unknown cardType: ${cardType}`);
  }
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
};
