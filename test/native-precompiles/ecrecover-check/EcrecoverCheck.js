const { expect } = require('chai');
const { deployCached } = require('scripts/deploy');
const { initClient } = require('scripts/client');
const { createAccount } = require('scripts/createAccount');
const { verifyEcrecover } = require('scripts/verifyEcrecover');
const { formatPrivateKey } = require('utils/formatPrivateKey');
const { changeAccountKeys } = require('scripts/updateAccount');

const testEcrecover = async (initialKey, withAlias, changedTo) => {
  const address = `${await deployCached()}`;
  const client = initClient();
  const account = await createAccount(client, initialKey, withAlias);
  const initialResult = await verifyEcrecover(
    address,
    client.setOperator(account.accountId, account.privateKey),
    formatPrivateKey(account.privateKey),
  );
  if (changedTo === '' || !initialResult) { // Changing keys to the new ones was not requested, we can quit here.
    return initialResult;
  }
  account.privateKey = await changeAccountKeys(account, changedTo);

  return await verifyEcrecover(
    address,
    client.setOperator(account.accountId, account.privateKey),
    formatPrivateKey(account.privateKey),
  );
}

describe('EcrecoverCheck', function () {
  describe('Deployment', function () {
    it('Should be deployed correctly', async function () {
      const address = await deployCached();
      expect(address).to.not.null;
    });
  });

  describe('Verification', function () {
    it(
      'Ecrecover should work correctly for account with ECDSA key and EVM alias derived from ECDSA key.',
      async function () {
        expect(await testEcrecover('ECDSA', true, '')).to.true;
      }
    );

    it(
      'Ecrecover should fail for account with ECDSA key replaced by new ECDSA private key. EVMAlias (msg.sender) will remain the same but signer extracted with ecrecover will be derived from new key pair.',
      async function () {
        expect(await testEcrecover('ECDSA', true, 'ECDSA')).to.false;
      }
    );

    it(
      'Ecrecover should fail for account with ECDSA key replaced by new ED25519 private key. EVMAlias (msg.sender) will remain the same but signer extracted with ecrecover will be some random value, because ecrecover will not work for ED25519 keys.',
      async function () {
        expect(await testEcrecover('ECDSA', true, 'ED25519')).to.false;
      }
    );

    it(
      'Ecrecover should be broken for account with ECDSA key and default EVM alias. EVM alias is not connected in any way to the ECDSA key, so ecrecover result will not return it.',
      async function () {
        expect(await testEcrecover('ECDSA', false, '')).to.false;
      }
    );

    it(
      'Ecrecover should be broken for ED25519 keys. No matter what they will be replaced with.',
      async function () {
        expect(await testEcrecover('ED25519', false, '')).to.false;
        expect(await testEcrecover('ED25519', false, 'ED25519')).to.false;
        expect(await testEcrecover('ED25519', false, 'ECDSA')).to.false;
      },
    );
  });
});
