/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

let DiamondHelper = {
  FacetCutAction: { Add: 0, Replace: 1, Remove: 2 },

  getSelectors: function (contract) {
    const selectors = contract.interface.fragments.reduce((acc, val) => {
      if (val.type === 'function' && val.name !== 'init(bytes)') {
        acc.push(contract.interface.getFunction(val.name).selector);
      }
      return acc;
    }, []);

    selectors.contract = contract;
    selectors.remove = this.remove;
    selectors.get = this.get;

    return selectors;
  },

  remove: function (functionNames) {
    const selectors = this.filter((v) => {
      for (const functionName of functionNames) {
        if (v === this.contract.interface.getFunction(functionName).selector) {
          return false;
        }
      }

      return true;
    });

    selectors.contract = this.contract;
    selectors.remove = this.remove;
    selectors.get = this.get;

    return selectors;
  },

  get: function (functionNames) {
    const selectors = this.filter((v) => {
      for (const functionName of functionNames) {
        if (v === this.contract.interface.getFunction(functionName).selector) {
          return true;
        }
      }

      return false;
    });

    selectors.contract = this.contract;
    selectors.remove = this.remove;
    selectors.get = this.get;

    return selectors;
  },

  removeSelectors: function (selectors, signatures) {
    const iface = new ethers.Interface(signatures.map((v) => 'function ' + v));
    const removeSelectors = signatures.map(
      (v) => iface.getFunction(v).selector
    );
    selectors = selectors.filter((v) => !removeSelectors.includes(v));

    return selectors;
  },

  findAddressPositionInFacets: function (facetAddress, facets) {
    for (let i = 0; i < facets.length; i++) {
      if (facets[i].facetAddress === facetAddress) {
        return i;
      }
    }
  },
};

module.exports = {
  DiamondHelper,
};
