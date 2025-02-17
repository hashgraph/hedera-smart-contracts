// SPDX-License-Identifier: Apache-2.0

import { ercRegistryRunner } from './runner';

(async () => {
  try {
    await ercRegistryRunner();
    console.log('Runner executed successfully.');
  } catch (err) {
    console.error('Error executing runner:', err);
    process.exit(1); // Exit with failure status
  }
})();
