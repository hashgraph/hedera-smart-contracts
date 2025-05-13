// SPDX-License-Identifier: Apache-2.0

require('dotenv').config();

/**
 * TOLERANCE_<EXECUTOR_A>_<EXECUTOR_B> variables are loaded into the map.
 */
const TOLERANCE_MAP = (() => {
    const map = {};

    for (const [key, value] of Object.entries(process.env)) {
        if (key.toUpperCase().startsWith('TOLERANCE_')) {
            const pair = key.toUpperCase().replace('TOLERANCE_', '');
            map[pair] = parseFloat(value);
        }
    }

    return map;
})();

/**
 * Get the tolerance between two executors.
 * @param {string} executorA - The first executor.
 * @param {string} executorB - The second executor.
 * @returns {number} - The tolerance percentage or 0 if not configured.
 */
function getToleranceForPair(executorA, executorB) {
    const key = `${executorA}_${executorB}`;
    const reverseKey = `${executorB}_${executorA}`;
    return TOLERANCE_MAP[key] !== undefined
      ? TOLERANCE_MAP[key]
      : TOLERANCE_MAP[reverseKey] || 0;
}

/**
 * Check if two values are within the tolerance for the given executor pair.
 * @param {string} executorA - The first executor.
 * @param {string} executorB - The second executor.
 * @param {number} valueA - The value from the first executor.
 * @param {number} valueB - The value from the second executor.
 * @returns {boolean} - Whether the two values are within the tolerance range.
 */
function isWithinTolerance(executorA, executorB, valueA, valueB) {
    const tolerance = getToleranceForPair(
      executorA.split('::').join('_').split('-').join('_').toUpperCase(),
      executorB.split('::').join('_').split('-').join('_').toUpperCase()
    );
    const difference = Math.abs(valueA - valueB);
    const maxValue = Math.max(valueA, valueB);
    const toleranceThreshold = (tolerance / 100) * maxValue;
    return difference <= toleranceThreshold;
}

module.exports = {
    isWithinTolerance
};
