// SPDX-License-Identifier: Apache-2.0

const { EvmExecutor } = require('./evm');
const { HederaSdkExecutor, HederaSdkEthTxExecutor } = require('./hedera');
const MirrorNode = require('./hedera/mirrornode');
const { HederaExecutorsWrapper } = require('./hedera/wrapper');

module.exports = {
    init: function (name) {
        // Hedera SDK based executors
        if (name.toLowerCase().startsWith('hedera::')) {
            const mirrorNode = MirrorNode.create(name);
            if (name.toUpperCase().endsWith('SDK')) return new HederaExecutorsWrapper(new HederaSdkExecutor(name), mirrorNode);
            if (name.toUpperCase().endsWith('EVM')) return new HederaExecutorsWrapper(new EvmExecutor(name), mirrorNode);
            if (name.toUpperCase().endsWith('SDK-ETHTX')) return new HederaExecutorsWrapper(new HederaSdkEthTxExecutor(name), mirrorNode);
        }

        // Any EVM based network with json rpc api implemented can be tested using this executor
        if (name.toUpperCase().endsWith('::EVM')) return new EvmExecutor(name);

        // Sample mock, will always return the same result - for testing purposes only
        if (name.toLowerCase() === 'mock') return require('./mock');

        throw new Error(`Unknown executor: ${name}`);
    },
};
