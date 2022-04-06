import protobuf from 'protobufjs';
import BigNumber from 'bignumber.js';
import Antenna from 'iotex-antenna';
import {
  Envelop,
  SealedEnvelop
} from 'iotex-antenna/lib/action/envelop.js';
import {
  IReadStakingDataMethodToBuffer,
  IReadStakingDataMethodName,
  IReadStakingDataRequestToBuffer
} from 'iotex-antenna/lib/rpc-method/types.js';

const root = await protobuf.Root.fromJSON(require("./proto.json"));
const Action = root.lookupType("iotextypes.Action");
const antenna = new Antenna("https://api.testnet.iotex.one");
// const antenna = new Antenna.default("https://api.iotex.one");
const pagination = { offset: 0, limit: 10 };

export async function getAccount(address: string) {
  const accountDetails = await antenna.iotx.getAccount({ address });
  console.log('getAccount : ', accountDetails);
  const account = accountDetails?.accountMeta;
  if (!account) throw new Error('acccount not found');
  return account;
}

export async function getGasPrice() {
  const { gasPrice } = await antenna.iotx.suggestGasPrice({});
  console.log('gasPrice :', gasPrice);
  return new BigNumber(gasPrice).shiftedBy(-18).toFixed();
}

export async function getGasLimit(estimateObj: any) {
  const { gas } = await antenna.iotx.estimateActionGasConsumption(estimateObj);
  console.log('gas :', gas);
  return gas.toString();
}

// candidates

async function readStateForCandidates(protocolID: Buffer, methodName: Buffer, args: any) {
  const readStateRequest = { protocolID, methodName, arguments: args, height: undefined };
  const state = await antenna.iotx.readState(readStateRequest);

  const root = await protobuf.load("node_modules/iotex-antenna/proto/types/state_data.proto");
  const CandidateListV2 = root.lookupType('iotextypes.CandidateListV2');
  const CandidateV2 = root.lookupType('iotextypes.CandidateV2');
  const { candidates } = CandidateListV2.decode(state.data as Uint8Array) as any;
  console.log('candidates :', candidates);
  return candidates.map((candidate: any)=>candidate.name);
}

export async function getCandidates() {
  const protocolID = Buffer.from("staking");
  const methodName = IReadStakingDataMethodToBuffer({
    method: IReadStakingDataMethodName.CANDIDATES
  });
  const args = [
    IReadStakingDataRequestToBuffer({ candidates: { candName: '', pagination } })
  ];
  return readStateForCandidates(protocolID, methodName, args);
}

// rewards

export async function getUnclaimedBalance(voterAddress: string) {
  const state = await antenna.iotx.readState({
    protocolID: Buffer.from("rewarding"),
    methodName: Buffer.from("UnclaimedBalance"),
    arguments: [Buffer.from(voterAddress)],
    height: undefined
  });
  return Buffer.from(state.data as Uint8Array).toString();
}

// buckets

async function readStateForBucketsList(protocolID: Buffer, methodName: Buffer, args: any) {
  const readStateRequest = { protocolID, methodName, arguments: args, height: undefined };
  const state = await antenna.iotx.readState(readStateRequest);
  if (!state.data) return [];

  const root = await protobuf.load("node_modules/iotex-antenna/proto/types/state_data.proto");
  const VoteBucketList = root.lookupType('iotextypes.VoteBucketList');
  const { buckets } = VoteBucketList.decode(state.data as Uint8Array) as any;
  return buckets;
}

export async function getBuckets(voterAddress: string) {
  const protocolID = Buffer.from("staking");
  const methodName = IReadStakingDataMethodToBuffer({
    method: IReadStakingDataMethodName.BUCKETS_BY_VOTER
  });
  const args = [
    IReadStakingDataRequestToBuffer({ bucketsByVoter: { voterAddress, pagination } })
  ];
  return readStateForBucketsList(protocolID, methodName, args);
}

// actions

export async function getTxHashByAddress(address: string) {
  const { actionInfo } = await antenna.iotx.getActions({ byAddr: { address, start: 0, count: 10 }});
  return actionInfo.map(a=>a.actHash);
}

export async function getTxByHash(actionHash: string) {
  const { actionInfo } = await antenna.iotx.getActions({ byHash: { actionHash, checkPending: true }});
  console.log('actionInfo :', actionInfo);
  return actionInfo.map(a=>a.action.core);
}

export async function sendTx(signedTxHex: string, actName: string) {
  let { core, senderPubKey, signature } = Action.decode(Buffer.from(signedTxHex, 'hex')) as any;
  if (actName != 'execution' && core[actName]?.payload.length === 0) {
    core[actName].payload = Buffer.from([]);
  }
  const action = { core, senderPubKey, signature };
  const { actionHash } = await antenna.iotx.sendAction({ action });
  return actionHash;
}

