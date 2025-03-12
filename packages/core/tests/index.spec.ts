import { Transport, coin, config, crypto, tx, CardType, setting, info, wallet } from '../src';
import * as bip39 from 'bip39';
import { Signature } from '@noble/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, HDWallet, CURVE, DisplayBuilder, getTxDetail } from '@coolwallet/testing-library';
import { SignatureType } from '../src/transaction';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const mnemonic = bip39.generateMnemonic();
const secpWallet = new HDWallet(CURVE.SECP256K1);
const edWallet = new HDWallet(CURVE.ED25519);

describe('Test CoolWallet SDK Core Functional', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  let cardType: CardType;

  beforeAll(async () => {
    if (process.env.CARD === 'go') {
      cardType = CardType.Go;
    } else {
      cardType = CardType.Pro;
    }
    if (cardType === CardType.Go) {
      transport = (await createTransport('http://localhost:9527', CardType.Go))!;
    } else {
      transport = (await createTransport())!;
    }
    props = await initialize(transport, mnemonic);
    secpWallet.setMnemonic(mnemonic);
    edWallet.setMnemonic(mnemonic);
  });

  it('Test derive Curve25519 publicKey', async () => {
    const publicKey = await coin.getPublicKeyByPath(
      transport,
      props.appId,
      props.appPrivateKey,
      config.PathType.CURVE25519
    );
    const expectedPublicKey = Buffer.from(edWallet.deriveCurve25519PublicKey() ?? '').toString('hex');

    expect(publicKey).toEqual(expectedPublicKey);
  });

  it('Test rlp erc20 execute script', async () => {
    const script = `050406010001C707000000003CA00700C2BCA70004C2BCA70002C2BCA70003CC071094CAAC270009CC07C01380B844a9059cbb000000000000000000000000CAB0A700CC07200000000000000000000000000000000000000000CAB1A700CC0E1001C2E09700CC07C0028080BE0710DC07C00345544811A0C7CC1D041D1507C004CC0F104012A117C00401071507C002FF00B5A11700CAACBF0002DEF09700250F00CC0FC0023078BAB0AF6C0E04DDF0970012A017C00400141507C002FF00B5A01700DAB1A7B0D207CC05065052455353425554546F4E`;
    const sent = () => tx.command.sendScript(transport, script + `FA`.padEnd(144, '0'));
    const path = `15328000002c8000003c800000000000000000000000`;
    const argTo = Buffer.from('8a1628c2397f6ca75579a45e81ee3e17df19720e', 'hex');
    const argValue = Buffer.from('2dc6c0'.padStart(24, '0'), 'hex');
    const argGasPrice = Buffer.from('04a817c800', 'hex');
    const argGasLimit = Buffer.from('b411', 'hex');
    const argNonce = Buffer.from('0194', 'hex');
    const usdtTokenInfo = `060455534454000000dac17f958d2ee523a2206206994597c13d831ec73045022009DE62567071D16F3104448C3553B908BEB9C6806F6C1C38C801EE7FDBD1523F022100E2CA0CAF5F59F64CDF91C2AD3B7AAAF3490224C41810AED666DE59623FB325B2`;
    const argument = usdtTokenInfo.slice(0, 58) + usdtTokenInfo.slice(58).padStart(144, '0');
    const executeRlpScript = () =>
      tx.command.executeRlpScript(
        transport,
        props.appId,
        props.appPrivateKey,
        path,
        [argTo, argValue, argGasPrice, argGasLimit, argNonce],
        argument
      );
    const se_signature = (await tx.flow.getSingleSignatureFromCoolWalletV2(
      transport,
      [sent],
      executeRlpScript,
      SignatureType.Canonical
    )) as { r: string; s: string };
    const node = secpWallet.derivePath(`m/44'/60'/0'/0/0`);
    const message = `f86b8201948504a817c80082b41194dac17f958d2ee523a2206206994597c13d831ec780b844a9059cbb0000000000000000000000008a1628c2397f6ca75579a45e81ee3e17df19720e00000000000000000000000000000000000000000000000000000000002dc6c0018080`;
    const encoded = Buffer.from(keccak_256(Buffer.from(message, 'hex')));
    const expected = Buffer.from((await node.sign(encoded)) ?? '').toString('hex');
    const signature = Signature.fromCompact(se_signature.r + se_signature.s).normalizeS();
    expect(signature.toDERHex()).toEqual(expected);
    if (transport.cardType === CardType.Pro) {
      const txDetail = await getTxDetail(transport, props.appId);
      const expctedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage('ETH')
        .messagePage('USDT')
        .addressPage(`0x${argTo.toString('hex')}`)
        .amountPage(3.0)
        .wrapPage('PRESS', 'BUTToN')
        .finalize();
      expect(txDetail).toEqual(expctedTxDetail.toLowerCase());
    }
  });

  it('Test algorand', async () => {
    const script = `050600020001C707000000011BA00700CC07C0025458A007001CB0A7C0041507C06DC807C00461706161A007001CB1A7C0041507C005C5B1A7C0031CBCA7C002041507C006C5BCA7C002031CBCA7C003041507C006C5BCA7C003031CBCA7C004041507C006C5BCA7C004031CBCA7C005041507C006C5BCA7C005031CBCA7C006041507C006C5BCA7C00603BE07C0031CBCA7C007041507C00DC807C0046170616EC5BCA700071CBCA7C008041507C069C807C00461706173A007001CBCA7C009041507C005C5BCA700091CBCA7C00A041507C005C5BCA7000A1CBCA7C00B041507C005C5BCA7000B1CBCA7C00C041507C005C5BCA7000C1CBCA7C00D041507C005C5BCA7000D1CBCA7C00E041507C005C5BCA7000EBE07C0031CBCA7C00F041507C06DC807C00461706174A007001CBCA7C010041507C006C5BCA7C010031CBCA7C011041507C006C5BCA7C011031CBCA7C012041507C006C5BCA7C012031CBCA7C013041507C006C5BCA7C013031CB2A7C0041507C005C5B2A7C0031CBCA7C015041507C006C5BCA7C01503BE07C0031CBCA7C016041507C069C807C00461706661A007001CBCA7C017041507C005C5BCA700171CBCA7C018041507C005C5BCA700181CBCA7C019041507C005C5BCA700191CBCA7C01A041507C005C5BCA7001A1CBCA7C01B041507C005C5BCA7001B1CBCA7C01C041507C005C5BCA7001CBE07C0031CBCA7C01D041507C00DC807C00461706964C5BCA7001D1CBCA7C01E041507C00CC807C003666565C5BCA7001E1CBCA7C01F041507C00BC807C0026676C5BCA7001F1CB5A7C0041507C00BC807C00367656EC5B5A7101CBCA7C021041507C00DC807C003677270C5BCA7C021031CBCA7C022041507C00CC807C0026768C5BCA7C022031CBCA7C023041507C00BC807C0026C76C5BCA700231CBCA7C024041507C00CC807C0026C78C5BCA7C024031CBCA7C025041507C00EC807C0046E6F7465C5BCA7C025031CBCA7C026041507C00FC807C00572656B6579C5BCA7C026031CBCA7C027041507C00DC807C003736E64C5BCA7C027031CBCA7C028041507C00DC807C00474797065C5BCA71028BE07C002DC07C004414C474FDC07C0046170706C1CBCA7C01D041507C018DC07C0056170704944BABCAECC1D100D04DEE09700250E00D207CC05065052455353425554546F4E`;
    const sent = () => tx.command.sendScript(transport, script + `FA`.padEnd(144, '0'));
    const path = `15108000002c8000011b800000008000000080000000`;
    const apaa = [Buffer.from(`000000000000007d`, 'hex')].concat(Array.from({ length: 5 }, () => Buffer.alloc(0)));
    const apan = Buffer.alloc(0);
    const apas = Array.from({ length: 6 }, () => Buffer.alloc(0));
    const apat = Array.from({ length: 6 }, () => Buffer.alloc(0));
    const apfa = Array.from({ length: 6 }, () => Buffer.alloc(0));
    const apid = Buffer.from('04e64685', 'hex');
    const fee = Buffer.from('03e8', 'hex');
    const fv = Buffer.from('014a73ed', 'hex');
    const gen = Buffer.from('746573746e65742d76312e30', 'hex');
    const group = Buffer.alloc(0);
    const gh = Buffer.from('4863b518a4b3c84ec810f22d4f1081cb0f71f059a7ac20dec62f7f70e5093a22', 'hex');
    const lv = Buffer.from('014a77d5', 'hex');
    const lx = Buffer.alloc(0);
    const note = Buffer.from('4170706c69636174696f6e2043616c6c205472616e73616374696f6e', 'hex');
    const rekKey = Buffer.alloc(0);
    const sender = Buffer.from('79bda01f694d1469b14611e22f4606e58288193ccba3c095e774775c6c2ad656', 'hex');
    const type = Buffer.from('6170706c', 'hex');
    const executeRlpScript = () =>
      tx.command.executeRlpScript(transport, props.appId, props.appPrivateKey, path, [
        Buffer.from('01', 'hex'), // apaaPresent
        ...apaa,
        apan,
        Buffer.alloc(0), // apasPresent
        ...apas,
        Buffer.alloc(0), // apatPresent
        ...apat,
        Buffer.alloc(0), // apfaPresent
        ...apfa,
        apid,
        fee,
        fv,
        gen,
        group,
        gh,
        lv,
        lx,
        note,
        rekKey,
        sender,
        type,
      ]);
    const message = `54588aa46170616191c408000000000000007da461706964ce04e64685a3666565cd03e8a26676ce014a73eda367656eac746573746e65742d76312e30a26768c4204863b518a4b3c84ec810f22d4f1081cb0f71f059a7ac20dec62f7f70e5093a22a26c76ce014a77d5a46e6f7465c41c4170706c69636174696f6e2043616c6c205472616e73616374696f6ea3736e64c42079bda01f694d1469b14611e22f4606e58288193ccba3c095e774775c6c2ad656a474797065a46170706c`;
    const se_signature = (await tx.flow.getSingleSignatureFromCoolWalletV2(
      transport,
      [sent],
      executeRlpScript,
      SignatureType.EDDSA
    )) as Buffer;
    const node = edWallet.derivePath(`m/44'/283'/0'/0'/0'`);
    const expected = (await node.sign(message)) ?? '';
    console.log('Signature from SE: ' + se_signature.toString('hex'));
    expect(se_signature.toString('hex')).toEqual(Buffer.from(expected).toString('hex'));
    if (transport.cardType === CardType.Pro) {
      const txDetail = await getTxDetail(transport, props.appId);
      const expctedTxDetail = new DisplayBuilder()
        .messagePage('TEST')
        .messagePage('ALGO')
        .messagePage('appl')
        .messagePage('appID')
        .messagePage('82200197')
        .wrapPage('PRESS', 'BUTToN')
        .finalize();
      expect(txDetail).toEqual(expctedTxDetail.toLowerCase());
    }
  });
});

describe('Test CoolWallet SDK Core Backup', () => {
  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  let cardType: CardType;

  beforeAll(async () => {
    if (process.env.CARD === 'go') {
      cardType = CardType.Go;
    } else {
      cardType = CardType.Pro;
    }
    if (cardType === CardType.Go) {
      transport = (await createTransport('http://localhost:9527', CardType.Go))!;
    } else {
      transport = (await createTransport())!;
    }
    props = await initialize(transport, mnemonic);
    secpWallet.setMnemonic(mnemonic);
    edWallet.setMnemonic(mnemonic);
  });

  it('Test backup', async () => {
    const publicKey = await coin.getPublicKeyByPath(
      transport,
      props.appId,
      props.appPrivateKey,
      config.PathType.CURVE25519
    );
    const expectedPublicKey = Buffer.from(edWallet.deriveCurve25519PublicKey() ?? '').toString('hex');
    expect(publicKey).toEqual(expectedPublicKey);
    if (transport.cardType === CardType.Pro) {
      return;
    }
    const cardId = await info.getCardId(transport);
    const exportData = await setting.backup.exportBackupData(transport, props.appId, props.appPrivateKey, cardId);
    const oldInfo = await info.getCardInfo(transport);
    console.log('old info:', oldInfo);

    await setting.card.resetCard(transport);
    await setting.backup.importBackupData(transport, exportData);
    const newInfo = await info.getCardInfo(transport);
    console.log('new info:', newInfo);
    expect(oldInfo).toEqual(newInfo);
  });
});

describe('Test CoolWallet SDK Core Register', () => {
  let firstDevice: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  let cardType: CardType;

  beforeAll(async () => {
    if (process.env.CARD === 'go') {
      cardType = CardType.Go;
    } else {
      cardType = CardType.Pro;
    }
    if (cardType === CardType.Go) {
      transport = (await createTransport('http://localhost:9527', CardType.Go))!;
    } else {
      transport = (await createTransport())!;
    }
    firstDevice = await initialize(transport, mnemonic);
  });

  it('Test register success', async () => {
    const apps = await wallet.client.getPairedApps(transport, firstDevice.appId, firstDevice.appPrivateKey);
    expect(apps.length).toEqual(1);

    const deviceList: { appId: string; deviceName: string }[] = [
      { appId: firstDevice.appId, deviceName: firstDevice.name },
    ];
    expect(apps).toEqual(deviceList);

    const createDevice = async (deviceName: string) => {
      const keyPair = crypto.key.generateKeyPair();
      const appPrivateKey = keyPair.privateKey;
      const appPublicKey = keyPair.publicKey;
      const password = '12345678';
      try {
        const appId = await wallet.client.register(
          transport,
          appPublicKey,
          password,
          deviceName,
          firstDevice.SEPublicKey
        );
        deviceList.push({ appId, deviceName });
        if (deviceList.length > 3) {
          deviceList.shift();
        }
        return { appPrivateKey, appPublicKey, deviceName, password, appId };
      } catch (APDUError) {
        return { appPrivateKey, appPublicKey, deviceName, password, appId: '' };
      }
    };
    // create device A
    const deviceA = await createDevice('deviceA');
    // [firstDevice, deviceA]
    const appsAfterA = await wallet.client.getPairedApps(transport, deviceA.appId, deviceA.appPrivateKey);
    expect(appsAfterA.length).toEqual(2);
    expect(appsAfterA).toEqual(deviceList);

    // create device B
    const deviceB = await createDevice('deviceB');
    // [firstDevice, deviceA, deviceB]
    const appsAfterB = await wallet.client.getPairedApps(transport, deviceB.appId, deviceB.appPrivateKey);
    expect(appsAfterB.length).toEqual(3);
    expect(appsAfterB).toEqual(deviceList);

    // create device C
    const deviceC = await createDevice('deviceC');
    let appsAfterC: Array<{ appId: string; deviceName: string }> = [];
    if (transport.cardType === CardType.Pro) {
      // [firstDevice, deviceA, deviceB]
      appsAfterC = await wallet.client.getPairedApps(transport, firstDevice.appId, firstDevice.appPrivateKey);
    }
    if (transport.cardType === CardType.Go) {
      // [deviceA, deviceB, deviceC]
      appsAfterC = await wallet.client.getPairedApps(transport, deviceC.appId, deviceC.appPrivateKey);
    }
    expect(appsAfterC.length).toEqual(3);
    expect(appsAfterC).toEqual(deviceList);

    // create device D
    const deviceD = await createDevice('deviceD');

    let appsAfterD: Array<{ appId: string; deviceName: string }> = [];
    if (transport.cardType === CardType.Pro) {
      // [firstDevice, deviceA, deviceB]
      appsAfterD = await wallet.client.getPairedApps(transport, firstDevice.appId, firstDevice.appPrivateKey);
    }
    if (transport.cardType === CardType.Go) {
      // [deviceB, deviceC, deviceD]
      appsAfterD = await wallet.client.getPairedApps(transport, deviceD.appId, deviceD.appPrivateKey);
    }
    expect(appsAfterD.length).toEqual(3);
    expect(appsAfterD).toEqual(deviceList);
  });
});
