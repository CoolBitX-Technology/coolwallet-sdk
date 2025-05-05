import { CardType } from '@coolwallet/core';

export function shouldUseLegacyUtxoScript(cardType: CardType, seVersion: number): boolean {
  return cardType === CardType.Pro && seVersion <= 331;
}

export function shouldUseLegacyScript10Or11(cardType: CardType, seVersion: number): boolean {
  return cardType === CardType.Pro && seVersion <= 330;
}
