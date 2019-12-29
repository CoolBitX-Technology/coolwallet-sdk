import { createErrorClass } from './helper'

// Transport
export const NoTransport = createErrorClass('NoTransport', 'Transport Object not specified.')

// General
export const PleaseResetHardware = createErrorClass('PleaseResetHardware', 'Bad Firmware status. Please reset your CoolWalletS.')
export const FirmwareVersionTooLow = createErrorClass('FirmwareVersionTooLow', 'Operaion not supported by current firmware version.')
export const OperationCanceled = createErrorClass('OperationCanceled', 'Operation canceled by the user.')

// SayHi
export const NotRegistered = createErrorClass('AppNotRegistered', 'Please register first' )

// Register
export const CardLocked = createErrorClass('CardLocked', 'Card Locked.')
export const MaxAppRegistered = createErrorClass('MaxAppRegistered', 'Max number of App paired. Delete one of the paired app.')
export const WrongPassword = createErrorClass('WrongPassword', 'Wrong Password')
export const MaxPasswordTried = createErrorClass('MaxPasswordTried', 'Maximum try of password.')
export const AlreadyRegistered = createErrorClass('Already Registered', 'App already registered')

// Wallet
export const WalletExists = createErrorClass('WalletExists', 'Wallet already exists.')
export const NoWallet = createErrorClass('NoWallet', 'Wallet doesnt exist, create or set seed first.')
export const InvalidSeedLength = createErrorClass('InvalidSeedLength', 'Invalid length of seed, try 12, 18 or 24.')

export const IncorrectSum = createErrorClass('IncorrectSum', 'Incorrect Sum of seed.')

// Supported
export const CoinNotSupported = createErrorClass('CoinNotSupported', 'Cion not supported')

// Tx 
export const CoinNotInitialized = createErrorClass('CoinNotInitialized', 'Coin Not initialized. Try get its publickey first.')
export const InvalidData = createErrorClass('InvalidData', 'Invalid Transaction Data.')
export const HashOutputMissmatch = createErrorClass('HashOutputMissmatch', 'Hashed output and raw output mismatch')
export const OutputTooLong = createErrorClass('OutputTooLong', 'Length of Output too long')
export const InvalidChangeRedeemScript = createErrorClass('InvalidChangeRedeemScript', 'Invalid change address redeemscript')
export const ChangeAddressMismatch = createErrorClass('ChangeAddressMismatch', 'Change address and index mismatch')
export const InvalidOmniData = createErrorClass('InvalidOmniData', 'Invalid Omni Data.')
export const InvalidChainId = createErrorClass('InvalidChainId', 'Invalid chainId')
export const TokenAddressMismatch = createErrorClass('TokenAddressMismatch', 'Token address mismatch')
export const ReadTypeDataMismatch = createErrorClass('ReadTypeDataMismatch', 'Readytype data mismatch')
export const InvalidSideField = createErrorClass('InvalidSideField', 'Invalid Side Field') // bnb
export const OmniValueTooHigh = createErrorClass('OmniValueTooHigh', 'Omni ouput exceed limit: 5420 sat.')
export const InvalidRLPFormat = createErrorClass('InvalidRLPFormat', 'Invalid RLP Data')
export const InvalidJsonFormat = createErrorClass('InvalidJsonFormat', 'Invalid Json Data')
export const DataLengthP2Mismatch = createErrorClass('DataLengthP2Mismatch', 'Truncated Data length and P2 Mismatch.')
