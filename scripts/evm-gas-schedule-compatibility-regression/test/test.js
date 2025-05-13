// SPDX-License-Identifier: Apache-2.0

const assert = require('assert');
const { tests, executors } = require('../config');
const { init } = require('../src/executor');
const { isWithinTolerance } = require('../src/tolerance.config');

const runners = [];

describe('Initializing all of the executors', function () {
    for (const executor of executors) {
        describe(`Initializing ${executor}:`, function () {
            it(`Should print ${executor} details correctly`, async function () {
                runners[executor] = init(executor);
                const info = await runners[executor].info();
                assert.notEqual(info, null, `Failed to get info from ${executor} executor`);
                console.log(`        Executor: ${info.name}`);
                console.log(`        Network name: ${info.network}`);
                console.log(`        Chain id: ${info.chainId}`);
                console.log('        Current fork details');
                console.log(`            Block number: ${info.blockNumber}`);
                console.log(`            Block timestamp: ${info.blockTimestamp}`);
                console.log(`        Software version: ${info.softwareVersion}`);
            });
        });
    }
});


let gasUsages = {};
let printed = true;
for (const test of tests) {
    describe(test.name, function () {
        for (const testCase of test.cases) {
            describe(`${testCase.name}`, function () {
                for (const executor of executors) {
                    it(`${testCase.name} in ${executor} should not fail`, async function () {
                        if (printed) {
                            printed = false;
                            gasUsages = {};
                        }
                        if (!runners[executor] || !runners[executor].run) {
                            this.skip();
                            return;
                        }
                        try {
                            let result = null;
                            try {
                                result = await runners[executor].run([testCase.code]);
                                if (!result.success) result = await runners[executor].run([testCase.code]);
                            } catch (e) { // try twice;
                                result = await runners[executor].run([testCase.code]);
                            }
                            assert.notEqual(result.length, 0, `Failed to run ${testCase.name} on the ${executor} executor, no new transactions were found`);
                            const lastTransaction = result[result.length - 1];
                            assert.equal(lastTransaction.success, true, lastTransaction.error);//`Failed to run ${testCase.name} on the ${executor} executor`);
                            gasUsages[executor] = lastTransaction;
                        } catch (e) {
                            gasUsages[executor] = {
                                key: executor,
                                gasUsed: null,
                                transactionHash: null,
                                error: e.message,
                            };
                            assert.equal(false, true, `Failed to run ${testCase.name} on the ${executor} executor`);
                        }
                    });
                }
                const comparisonsMade = [];
                for (const executor of executors) {
                    for (const toCompare of executors) {
                        if (executor === toCompare || comparisonsMade.includes(`${toCompare}::${executor}`)) continue;
                        comparisonsMade.push(`${executor}::${toCompare}`);
                        it(
                          `Should respect tolerance for gas usage between ${executor} and ${toCompare} – ${testCase.name}`,
                          async function () {
                              const valueToCompare = (element) => element?.additionalData?.gasConsumed || element?.gasUsed || null;
                              if (!printed) {
                                  console.table(
                                    Object.entries(gasUsages).map(([key, element]) => ({
                                        'Executor': key,
                                        'Gas used': element.gasUsed,
                                        'Consumed': valueToCompare(element),
                                        'Transaction hash': element.transactionHash,
                                        'Error': element.error || null,
                                    }))
                                  );
                                  printed = true;
                              }

                              const left = valueToCompare(gasUsages[toCompare] || null);
                              const right = valueToCompare(gasUsages[executor] || null);
                              if (left === null || right === null) {
                                  this.skip();
                                  return;
                              }

                              const within = isWithinTolerance(executor, toCompare, right, left);
                                assert.equal(
                                    within,
                                    true,
                                    `Different gas usage detected (outside tolerance).
                                    ${right} (${executor}) vs ${left} (${toCompare})`,
                                );
                            },
                        );
                    }
                }
            });
        }
    });
}
