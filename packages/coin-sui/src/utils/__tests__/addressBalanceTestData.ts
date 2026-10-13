/* eslint-disable max-len */
// 以 @mysten/sui 2.35.0 組出的交易 bytes（base64），sender 為測試卡 index 0 的地址

export const addressBalanceToAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';

export const addressBalanceTransactions = [
  {
    name: 'token：coin object + address balance（FundsWithdrawal + coin::redeem_funds，再 merge）',
    kind: 'token' as const,
    amount: '1450000',
    transaction:
      'AAAEAAgQIBYAAAAAAAAgcv1dR4ecb8Oa9TI7D72oNCXKilFy+wSKqnjBIRqYrwkBAMevbGvN68hVr5hnuASPnxL8yvl5Z4f+WM/5ySFN3kuubV+QGQAAAAAg5dqEqStTOgVpRO6yPbxYuQJ8LvV71RP+jH8UEJxD31MCANDdBgAAAAAAAAfbo0Zy4wywZbH5Pjq1Uxh2j9b+9mwVlCyffLhG4vkA5wR1c2RjBFVTREMAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIEY29pbgxyZWRlZW1fZnVuZHMBB9ujRnLjDLBlsfk+OrVTGHaP1v72bBWULJ98uEbi+QDnBHVzZGMEVVNEQwABAQMAAwECAAEDAAAAAAIBAgABAQAAAQEDAgAAAAEBAKA+3xnjXXLejscvVTuf7khmUgYI3vYa3LhIzaA64CTbARWbZZPhvP5PeE/P/dSD3gAzF6QBMIt+15uyLs+xZ80mWF+QGQAAAAAg6+mHMXDfk//b56bg+S/RRbTsCKow8Czs9+I5E6GwRk+gPt8Z411y3o7HL1U7n+5IZlIGCN72Gty4SM2gOuAk2+4CAAAAAAAACFg6AAAAAAAA',
  },
  {
    name: 'token：只用 address balance（提領金額等於送出金額）',
    kind: 'token' as const,
    amount: '450000',
    transaction:
      'AAADAAjQ3QYAAAAAAAAgcv1dR4ecb8Oa9TI7D72oNCXKilFy+wSKqnjBIRqYrwkCANDdBgAAAAAAAAfbo0Zy4wywZbH5Pjq1Uxh2j9b+9mwVlCyffLhG4vkA5wR1c2RjBFVTREMAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIEY29pbgxyZWRlZW1fZnVuZHMBB9ujRnLjDLBlsfk+OrVTGHaP1v72bBWULJ98uEbi+QDnBHVzZGMEVVNEQwABAQIAAgMAAAAAAQEAAAEBAwEAAAABAQCgPt8Z411y3o7HL1U7n+5IZlIGCN72Gty4SM2gOuAk2wEVm2WT4bz+T3hPz/3Ug94AMxekATCLftebsi7PsWfNJlhfkBkAAAAAIOvphzFw35P/2+em4Pkv0UW07AiqMPAs7PfiOROhsEZPoD7fGeNdct6Oxy9VO5/uSGZSBgje9hrcuEjNoDrgJNvuAgAAAAAAAAhYOgAAAAAAAA==',
  },
  {
    name: 'token：gas 由 address balance 支付（payment 為空，帶 ValidDuring expiration）',
    kind: 'token' as const,
    amount: '1000',
    transaction:
      'AAADAAjoAwAAAAAAAAAgcv1dR4ecb8Oa9TI7D72oNCXKilFy+wSKqnjBIRqYrwkBAMevbGvN68hVr5hnuASPnxL8yvl5Z4f+WM/5ySFN3kuubV+QGQAAAAAg5dqEqStTOgVpRO6yPbxYuQJ8LvV71RP+jH8UEJxD31MCAgECAAEBAAABAQMAAAAAAQEAoD7fGeNdct6Oxy9VO5/uSGZSBgje9hrcuEjNoDrgJNsAoD7fGeNdct6Oxy9VO5/uSGZSBgje9hrcuEjNoDrgJNvuAgAAAAAAAAhYOgAAAAAAAgH+BAAAAAAAAAH/BAAAAAAAAAAAIDWDSorBfKSPsUrI+ZwXyYdH6V3QcpSuQaRrOCJGpEmbOTAAAA==',
  },
  {
    name: 'SUI：gas payment 含 coin reservation ref',
    kind: 'coin' as const,
    amount: '100000000',
    transaction:
      'AAACAAgA4fUFAAAAAAAgcv1dR4ecb8Oa9TI7D72oNCXKilFy+wSKqnjBIRqYrwkCAgABAQAAAQEDAAAAAAEBAKA+3xnjXXLejscvVTuf7khmUgYI3vYa3LhIzaA64CTbAjq0N3elh2Gr5NaKFwyMZZPVwwumPrNYOwRojLcJq9UrAAAAAAAAAAAgAF7QsgAAAAD+BAAArKysrKysrKysrKysrKysrKysrKwVm2WT4bz+T3hPz/3Ug94AMxekATCLftebsi7PsWfNJlhfkBkAAAAAIOvphzFw35P/2+em4Pkv0UW07AiqMPAs7PfiOROhsEZPoD7fGeNdct6Oxy9VO5/uSGZSBgje9hrcuEjNoDrgJNvuAgAAAAAAAAhYOgAAAAAAAA==',
  },
];
