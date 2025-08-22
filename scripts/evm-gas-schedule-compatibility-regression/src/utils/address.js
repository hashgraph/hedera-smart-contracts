// SPDX-License-Identifier: Apache-2.0
const { ethers: { Wallet } } = require("ethers");

const MAX_ATTEMPTS = 500;

module.exports = {
    /**
     * @param {import("ethers.Provider")} provider
     * @returns {Promise<string>}
     */
    getNonExistentAddress: async function (provider) {
        for (let i = 1; i <= MAX_ATTEMPTS; i++) {
            const address = Wallet.createRandom().address;
            const balance = await provider.getBalance(address);
            const nonce = await provider.getTransactionCount(address, 'latest');
            const isEmpty = (!balance && !nonce);
            if (isEmpty) return address;
        }
        throw new Error('Could not generate an empty address. Try again.');
    }
};
