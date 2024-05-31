const {
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
} = require('@hashgraph/sdk');

async function createAccount(operator, keyType, withAlias) {
    let newPrivateKey;
    switch (keyType) {
        case 'ED25519': {
            newPrivateKey = PrivateKey.generateED25519();
            break;
        }
        case 'ECDSA': {
            newPrivateKey = PrivateKey.generateECDSA();
            break;
        }
        default:{
            throw new Error('Unsupported key type');
        }
    }
    const newPublicKey = newPrivateKey.publicKey;
    if (withAlias) {
        newPublicKey.toAccountId(0, 0);
    }

    const transaction = new AccountCreateTransaction()
        .setKey(newPublicKey)
        .setInitialBalance(new Hbar(20));
    if (withAlias) {
        transaction.setAlias(newPrivateKey.publicKey.toEvmAddress());
    }
    const response = await transaction.execute(operator);
    return {
        accountId: (await response.getReceipt(operator)).accountId,
        privateKey: newPrivateKey,
        accountType: keyType,
    };
}

export { createAccount };
