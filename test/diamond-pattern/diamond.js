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

const { assert } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../constants');
const Helper = require('../diamond-pattern/diamond.helper');

describe('DiamondFacet Test Suite', async function () {
  let signers;
  let diamondCutFacet;
  let diamondLoupeFacet;
  let ownershipFacet;
  let diamond;
  let diamondInit;

  const addresses = [];

  before(async function () {
    signers = await ethers.getSigners();

    const DiamondCutFacetFactory = await ethers.getContractFactory(
      Constants.Contract.DiamondCutFacet
    );

    diamondCutFacet = await DiamondCutFacetFactory.deploy();

    console.log(
      `${
        Constants.Contract.DiamondCutFacet
      } deployed: ${await diamondCutFacet.getAddress()}`
    );

    const DiamondFactory = await ethers.getContractFactory(
      Constants.Contract.Diamond
    );
    diamond = await DiamondFactory.deploy(
      await signers[0].getAddress(),
      await diamondCutFacet.getAddress()
    );
    console.log(
      `${Constants.Contract.Diamond} deployed: ${await diamond.getAddress()}`
    );

    const DiamondInitFactory = await ethers.getContractFactory(
      Constants.Contract.DiamondInit
    );
    diamondInit = await DiamondInitFactory.deploy();
    console.log(
      `${
        Constants.Contract.DiamondInit
      } deployed: ${await diamondInit.getAddress()}`
    );

    console.log(`\nDeploying facets`);
    const cuts = [];
    for (const facetName of ['DiamondLoupeFacet', 'OwnershipFacet']) {
      const FacetFactory = await ethers.getContractFactory(facetName);
      const facet = await FacetFactory.deploy();
      console.log(`${facetName} deployed: ${await facet.getAddress()}`);

      cuts.push({
        facetAddress: await facet.getAddress(),
        action: Helper.DiamondHelper.FacetCutAction.Add,
        functionSelectors: Helper.DiamondHelper.getSelectors(facet),
      });
    }

    console.log(`\nDiamond Cut:`, cuts);
    const diamondCut = await ethers.getContractAt(
      Constants.Contract.IDiamondCut,
      await diamond.getAddress()
    );
    const diamondCutTx = await diamondCut.diamondCut(
      cuts,
      await diamondInit.getAddress(),
      diamondInit.interface.encodeFunctionData('init'),
      Constants.GAS_LIMIT_10_000_000
    );

    if (!(await diamondCutTx.wait()).status) {
      await assert.Fail(`Diamond upgrade failed: ${diamondCutTx.hash}`);
    }

    diamondCutFacet = await ethers.getContractAt(
      Constants.Contract.DiamondCutFacet,
      await diamond.getAddress()
    );
    diamondLoupeFacet = await ethers.getContractAt(
      Constants.Contract.DiamondLoupeFacet,
      await diamond.getAddress()
    );
    ownershipFacet = await ethers.getContractAt(
      Constants.Contract.OwnershipFacet,
      await diamond.getAddress()
    );
  });

  it('should have three facets -- call to facetAddresses function', async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address);
    }

    assert.equal(addresses.length, 3);
  });

  it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
    let result, selectors;

    selectors = Helper.DiamondHelper.getSelectors(diamondCutFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0]);
    assert.sameMembers(Array.from(result), selectors);

    selectors = Helper.DiamondHelper.getSelectors(diamondLoupeFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1]);
    assert.sameMembers(Array.from(result), selectors);

    selectors = Helper.DiamondHelper.getSelectors(ownershipFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2]);
    assert.sameMembers(Array.from(result), selectors);
  });

  it('selectors should be associated to facets correctly -- multiple calls to facetAddress function', async () => {
    assert.equal(
      addresses[0],
      await diamondLoupeFacet.facetAddress('0x1f931c1c')
    );
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress('0xcdffacc6')
    );
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress('0x01ffc9a7')
    );
    assert.equal(
      addresses[2],
      await diamondLoupeFacet.facetAddress('0xf2fde38b')
    );
  });

  it('should add test1 functions', async () => {
    const Test1Facet = await ethers.getContractFactory(
      Constants.Contract.Test1Facet
    );
    const test1Facet = await Test1Facet.deploy();
    addresses.push(await test1Facet.getAddress());

    const selectors = Helper.DiamondHelper.getSelectors(test1Facet).remove([
      'supportsInterface(bytes4)',
    ]);
    const tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: await test1Facet.getAddress(),
          action: Helper.DiamondHelper.FacetCutAction.Add,
          functionSelectors: selectors,
        },
      ],
      ethers.ZeroAddress,
      '0x',
      Constants.GAS_LIMIT_1_000_000
    );

    if (!(await tx.wait()).status) {
      await assert.Fail(`Diamond upgrade failed: ${tx.hash}`);
    }

    assert.sameMembers(
      Array.from(
        await diamondLoupeFacet.facetFunctionSelectors(
          await test1Facet.getAddress()
        )
      ),
      selectors
    );
  });

  it('should test function call', async () => {
    const test1Facet = await ethers.getContractAt(
      Constants.Contract.Test1Facet,
      await diamond.getAddress()
    );
    const tx = await test1Facet.test1Func10();

    if (!(await tx.wait()).status) {
      await assert.Fail(`Function call failed: ${tx.hash}`);
    }
  });

  it('should replace supportsInterface function', async () => {
    const Test1Facet = await ethers.getContractFactory(
      Constants.Contract.Test1Facet
    );
    const selectors = Helper.DiamondHelper.getSelectors(Test1Facet).get([
      'supportsInterface(bytes4)',
    ]);
    const testFacetAddress = addresses[3];

    const tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: testFacetAddress,
          action: Helper.DiamondHelper.FacetCutAction.Replace,
          functionSelectors: selectors,
        },
      ],
      ethers.ZeroAddress,
      '0x',
      Constants.GAS_LIMIT_800000
    );

    if (!(await tx.wait()).status) {
      await assert.Fail(`Diamond upgrade failed: ${tx.hash}`);
    }

    assert.sameMembers(
      Array.from(
        await diamondLoupeFacet.facetFunctionSelectors(testFacetAddress)
      ),
      Helper.DiamondHelper.getSelectors(Test1Facet)
    );
  });

  it('should add test2 functions', async () => {
    const Test2Facet = await ethers.getContractFactory(
      Constants.Contract.Test2Facet
    );
    const test2Facet = await Test2Facet.deploy();
    addresses.push(await test2Facet.getAddress());

    const selectors = Helper.DiamondHelper.getSelectors(test2Facet);
    const tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: await test2Facet.getAddress(),
          action: Helper.DiamondHelper.FacetCutAction.Add,
          functionSelectors: selectors,
        },
      ],
      ethers.ZeroAddress,
      '0x',
      Constants.GAS_LIMIT_800000
    );

    if (!(await tx.wait()).status) {
      await assert.Fail(`Diamond upgrade failed: ${tx.hash}`);
    }

    assert.sameMembers(
      Array.from(
        await diamondLoupeFacet.facetFunctionSelectors(
          await test2Facet.getAddress()
        )
      ),
      selectors
    );
  });

  it('should remove some test2 functions', async () => {
    const test2Facet = await ethers.getContractAt(
      Constants.Contract.Test2Facet,
      await diamond.getAddress()
    );
    const functionsToKeep = ['test2Func1()', 'test2Func5()', 'test2Func6()'];
    const selectors =
      Helper.DiamondHelper.getSelectors(test2Facet).remove(functionsToKeep);

    const tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: ethers.ZeroAddress,
          action: Helper.DiamondHelper.FacetCutAction.Remove,
          functionSelectors: selectors,
        },
      ],
      ethers.ZeroAddress,
      '0x',
      Constants.GAS_LIMIT_1_000_000
    );

    if (!(await tx.wait()).status) {
      await assert.Fail(
        `${Constants.Contract.Diamond} upgrade failed: ${tx.hash}`
      );
    }

    assert.sameMembers(
      Array.from(await diamondLoupeFacet.facetFunctionSelectors(addresses[4])),
      Helper.DiamondHelper.getSelectors(test2Facet).get(functionsToKeep)
    );
  });

  it('should remove some test1 functions', async () => {
    const test1Facet = await ethers.getContractAt(
      Constants.Contract.Test1Facet,
      await diamond.getAddress()
    );
    const functionsToKeep = ['test1Func2()', 'test1Func11()', 'test1Func12()'];
    const selectors =
      Helper.DiamondHelper.getSelectors(test1Facet).remove(functionsToKeep);

    const tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: ethers.ZeroAddress,
          action: Helper.DiamondHelper.FacetCutAction.Remove,
          functionSelectors: selectors,
        },
      ],
      ethers.ZeroAddress,
      '0x',
      Constants.GAS_LIMIT_800000
    );

    if (!(await tx.wait()).status) {
      await assert.Fail(
        `${Constants.Contract.Diamond} upgrade failed: ${tx.hash}`
      );
    }

    assert.sameMembers(
      Array.from(await diamondLoupeFacet.facetFunctionSelectors(addresses[3])),
      Helper.DiamondHelper.getSelectors(test1Facet).get(functionsToKeep)
    );
  });

  it("remove all functions and facets except 'diamondCut' and 'facets'", async () => {
    let selectors = [];
    let facets = await diamondLoupeFacet.facets();
    for (let i = 0; i < facets.length; i++) {
      selectors.push(...facets[i].functionSelectors);
    }
    selectors = Helper.DiamondHelper.removeSelectors(selectors, [
      'facets()',
      'diamondCut(tuple(address,uint8,bytes4[])[],address,bytes)',
    ]);

    const tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: ethers.ZeroAddress,
          action: Helper.DiamondHelper.FacetCutAction.Remove,
          functionSelectors: selectors,
        },
      ],
      ethers.ZeroAddress,
      '0x',
      Constants.GAS_LIMIT_800000
    );

    if (!(await tx.wait()).status) {
      await assert.Fail(
        `${Constants.Contract.Diamond} upgrade failed: ${tx.hash}`
      );
    }

    facets = await diamondLoupeFacet.facets();

    assert.equal(facets.length, 2);
    assert.equal(facets[0][0], addresses[0]);
    assert.sameMembers(Array.from(facets[0][1]), ['0x1f931c1c']);
    assert.equal(facets[1][0], addresses[1]);
    assert.sameMembers(Array.from(facets[1][1]), ['0x7a0ed627']);
  });

  it('add most functions and facets', async () => {
    const diamondLoupeFacetSelectors = Helper.DiamondHelper.getSelectors(
      diamondLoupeFacet
    ).remove(['supportsInterface(bytes4)']);
    const Test1Facet = await ethers.getContractFactory(
      Constants.Contract.Test1Facet
    );
    const Test2Facet = await ethers.getContractFactory(
      Constants.Contract.Test2Facet
    );

    const cuts = [
      {
        facetAddress: addresses[1],
        action: Helper.DiamondHelper.FacetCutAction.Add,
        functionSelectors: diamondLoupeFacetSelectors.remove(['facets()']),
      },
      {
        facetAddress: addresses[2],
        action: Helper.DiamondHelper.FacetCutAction.Add,
        functionSelectors: Helper.DiamondHelper.getSelectors(ownershipFacet),
      },
      {
        facetAddress: addresses[3],
        action: Helper.DiamondHelper.FacetCutAction.Add,
        functionSelectors: Helper.DiamondHelper.getSelectors(Test1Facet),
      },
      {
        facetAddress: addresses[4],
        action: Helper.DiamondHelper.FacetCutAction.Add,
        functionSelectors: Helper.DiamondHelper.getSelectors(Test2Facet),
      },
    ];

    const tx = await diamondCutFacet.diamondCut(
      cuts,
      ethers.ZeroAddress,
      '0x',
      Constants.GAS_LIMIT_8000000
    );
    if (!(await tx.wait()).status) {
      await assert.Fail(
        `${Constants.Contract.Diamond} upgrade failed: ${tx.hash}`
      );
    }

    const facets = await diamondLoupeFacet.facets();

    const facetAddresses = await diamondLoupeFacet.facetAddresses();
    assert.equal(facetAddresses.length, 5);
    assert.equal(facets.length, 5);
    assert.sameMembers(Array.from(facetAddresses), addresses);
    assert.equal(facets[0][0], facetAddresses[0], 'first facet');
    assert.equal(facets[1][0], facetAddresses[1], 'second facet');
    assert.equal(facets[2][0], facetAddresses[2], 'third facet');
    assert.equal(facets[3][0], facetAddresses[3], 'fourth facet');
    assert.equal(facets[4][0], facetAddresses[4], 'fifth facet');
    assert.sameMembers(
      Array.from(
        facets[
          Helper.DiamondHelper.findAddressPositionInFacets(addresses[0], facets)
        ][1]
      ),
      Helper.DiamondHelper.getSelectors(diamondCutFacet)
    );
    assert.sameMembers(
      Array.from(
        facets[
          Helper.DiamondHelper.findAddressPositionInFacets(addresses[1], facets)
        ][1]
      ),
      diamondLoupeFacetSelectors
    );
    assert.sameMembers(
      Array.from(
        facets[
          Helper.DiamondHelper.findAddressPositionInFacets(addresses[2], facets)
        ][1]
      ),
      Helper.DiamondHelper.getSelectors(ownershipFacet)
    );
    assert.sameMembers(
      Array.from(
        facets[
          Helper.DiamondHelper.findAddressPositionInFacets(addresses[3], facets)
        ][1]
      ),
      Helper.DiamondHelper.getSelectors(Test1Facet)
    );
    assert.sameMembers(
      Array.from(
        facets[
          Helper.DiamondHelper.findAddressPositionInFacets(addresses[4], facets)
        ][1]
      ),
      Helper.DiamondHelper.getSelectors(Test2Facet)
    );
  });
});
