import { strict as assert } from 'assert';
import Axios from 'axios';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import bitcore from 'bitcore-lib';
import { USER_CONFIG } from '../user_config';

// copied from https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/bip32.spec.ts#L7
function getAddress(node: any, network?: any): string {
  return bitcoin.payments.p2pkh({ pubkey: node.publicKey, network }).address!;
}

// eslint-disable-next-line import/prefer-default-export
export function getAddressFromMnemonic(
  mnemonic: string,
  symbol: 'BCH' | 'BSV' | 'BTC' = 'BTC',
): { address: string; privateKey: string } {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const node = bitcoin.bip32.fromSeed(seed);

  const pathMap: { [key: string]: string } = {
    BCH: "m/44'/145'/0'/0/0",
    BSV: "m/44'/236'/0'/0/0",
    BTC: "m/44'/0'/0'/0/0",
  };
  const child1 = node.derivePath(pathMap[symbol]);

  const address = getAddress(child1);
  const privateKey = child1.toWIF();

  assert.equal(address, new bitcore.PrivateKey(privateKey).toAddress().toString());

  return { address, privateKey };
}

export async function queryBalance(): Promise<number> {
  assert.ok(USER_CONFIG.MNEMONIC);

  const address = getAddressFromMnemonic(USER_CONFIG.MNEMONIC!);

  const response = await Axios.get(`https://insight.bitpay.com/api/addr/${address.address}`);

  assert.equal(response.status, 200);
  return response.data.balance;
}
