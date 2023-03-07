const {assert} = require('chai');
const {ethers} = require('hardhat');

const DiamondHelper = {
  FacetCutAction: {Add: 0, Replace: 1, Remove: 2},

  getSelectors: function (contract) {
    const selectors = Object.keys(contract.interface.functions).reduce((acc, val) => {
      if (val !== 'init(bytes)') {
        acc.push(contract.interface.getSighash(val));
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
        if (v === this.contract.interface.getSighash(functionName)) {
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
        if (v === this.contract.interface.getSighash(functionName)) {
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
    const iface = new ethers.utils.Interface(signatures.map(v => 'function ' + v));
    const removeSelectors = signatures.map(v => iface.getSighash(v));
    selectors = selectors.filter(v => !removeSelectors.includes(v));

    return selectors;
  },

  findAddressPositionInFacets: function (facetAddress, facets) {
    for (let i = 0; i < facets.length; i++) {
      if (facets[i].facetAddress === facetAddress) {
        return i;
      }
    }
  }
}

describe('DiamondTest', async function () {
  let signers;
  let diamondCutFacet;
  let diamondLoupeFacet;
  let ownershipFacet;
  let diamond;
  let diamondInit;

  const addresses = [];

  before(async function () {
    signers = await ethers.getSigners();

    const DiamondCutFacetFactory = await ethers.getContractFactory('DiamondCutFacet');
    diamondCutFacet = await DiamondCutFacetFactory.deploy();
    console.log(`DiamondCutFacet deployed: ${diamondCutFacet.address}`);

    const DiamondFactory = await ethers.getContractFactory('Diamond');
    diamond = await DiamondFactory.deploy(signers[0].address, diamondCutFacet.address);
    console.log(`Diamond deployed: ${diamond.address}`);

    const DiamondInitFactory = await ethers.getContractFactory('DiamondInit');
    diamondInit = await DiamondInitFactory.deploy();
    console.log(`DiamondInit deployed: ${diamondInit.address}`);

    console.log(`\nDeploying facets`);
    const cuts = [];
    for (const facetName of ['DiamondLoupeFacet', 'OwnershipFacet']) {
      const FacetFactory = await ethers.getContractFactory(facetName);
      const facet = await FacetFactory.deploy();
      console.log(`${facetName} deployed: ${facet.address}`);

      cuts.push({
        facetAddress: facet.address,
        action: DiamondHelper.FacetCutAction.Add,
        functionSelectors: DiamondHelper.getSelectors(facet)
      });
    }

    console.log(`\nDiamond Cut:`, cuts);
    const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address);
    const diamondCutTx = await diamondCut.diamondCut(cuts, diamondInit.address, diamondInit.interface.encodeFunctionData('init'), {gasLimit: 10_000_000});

    if (!(await diamondCutTx.wait()).status) {
      throw Error(`Diamond upgrade failed: ${diamondCutTx.hash}`);
    }

    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamond.address);
    diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamond.address);
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamond.address);
  })

  it('should have three facets -- call to facetAddresses function', async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address);
    }

    assert.equal(addresses.length, 3);
  })

  it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
    let result, selectors;

    selectors = DiamondHelper.getSelectors(diamondCutFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0]);
    assert.sameMembers(result, selectors);

    selectors = DiamondHelper.getSelectors(diamondLoupeFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1]);
    assert.sameMembers(result, selectors);

    selectors = DiamondHelper.getSelectors(ownershipFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2]);
    assert.sameMembers(result, selectors);
  })

  it('selectors should be associated to facets correctly -- multiple calls to facetAddress function', async () => {
    assert.equal(addresses[0], await diamondLoupeFacet.facetAddress('0x1f931c1c'));
    assert.equal(addresses[1], await diamondLoupeFacet.facetAddress('0xcdffacc6'));
    assert.equal(addresses[1], await diamondLoupeFacet.facetAddress('0x01ffc9a7'));
    assert.equal(addresses[2], await diamondLoupeFacet.facetAddress('0xf2fde38b'));
  })

  it('should add test1 functions', async () => {
    const Test1Facet = await ethers.getContractFactory('Test1Facet');
    const test1Facet = await Test1Facet.deploy();
    addresses.push(test1Facet.address);

    const selectors = DiamondHelper.getSelectors(test1Facet).remove(['supportsInterface(bytes4)'])
    const tx = await diamondCutFacet.diamondCut(
        [{
          facetAddress: test1Facet.address,
          action: DiamondHelper.FacetCutAction.Add,
          functionSelectors: selectors
        }],
        ethers.constants.AddressZero, '0x', {gasLimit: 1_000_000});

    if (!(await tx.wait()).status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }

    assert.sameMembers(await diamondLoupeFacet.facetFunctionSelectors(test1Facet.address), selectors);
  })

  it('should test function call', async () => {
    const test1Facet = await ethers.getContractAt('Test1Facet', diamond.address);
    const tx = await test1Facet.test1Func10();

    if (!(await tx.wait()).status) {
      throw Error(`Function call failed: ${tx.hash}`);
    }
  })

  it('should replace supportsInterface function', async () => {
    const Test1Facet = await ethers.getContractFactory('Test1Facet');
    const selectors = DiamondHelper.getSelectors(Test1Facet).get(['supportsInterface(bytes4)']);
    const testFacetAddress = addresses[3];

    const tx = await diamondCutFacet.diamondCut(
        [{
          facetAddress: testFacetAddress,
          action: DiamondHelper.FacetCutAction.Replace,
          functionSelectors: selectors
        }],
        ethers.constants.AddressZero, '0x', {gasLimit: 800000});

    if (!(await tx.wait()).status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }

    assert.sameMembers(await diamondLoupeFacet.facetFunctionSelectors(testFacetAddress), DiamondHelper.getSelectors(Test1Facet))
  })

  it('should add test2 functions', async () => {
    const Test2Facet = await ethers.getContractFactory('Test2Facet');
    const test2Facet = await Test2Facet.deploy();
    addresses.push(test2Facet.address);

    const selectors = DiamondHelper.getSelectors(test2Facet);
    const tx = await diamondCutFacet.diamondCut(
        [{
          facetAddress: test2Facet.address,
          action: DiamondHelper.FacetCutAction.Add,
          functionSelectors: selectors
        }],
        ethers.constants.AddressZero, '0x', {gasLimit: 800000});

    if (!(await tx.wait()).status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }

    assert.sameMembers(await diamondLoupeFacet.facetFunctionSelectors(test2Facet.address), selectors);
  })

  it('should remove some test2 functions', async () => {
    const test2Facet = await ethers.getContractAt('Test2Facet', diamond.address);
    const functionsToKeep = ['test2Func1()', 'test2Func5()', 'test2Func6()'];
    const selectors = DiamondHelper.getSelectors(test2Facet).remove(functionsToKeep);

    const tx = await diamondCutFacet.diamondCut(
        [{
          facetAddress: ethers.constants.AddressZero,
          action: DiamondHelper.FacetCutAction.Remove,
          functionSelectors: selectors
        }],
        ethers.constants.AddressZero, '0x', {gasLimit: 1_000_000});

    if (!(await tx.wait()).status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }

    assert.sameMembers(await diamondLoupeFacet.facetFunctionSelectors(addresses[4]), DiamondHelper.getSelectors(test2Facet).get(functionsToKeep));
  })

  it('should remove some test1 functions', async () => {
    const test1Facet = await ethers.getContractAt('Test1Facet', diamond.address);
    const functionsToKeep = ['test1Func2()', 'test1Func11()', 'test1Func12()'];
    const selectors = DiamondHelper.getSelectors(test1Facet).remove(functionsToKeep);

    const tx = await diamondCutFacet.diamondCut(
        [{
          facetAddress: ethers.constants.AddressZero,
          action: DiamondHelper.FacetCutAction.Remove,
          functionSelectors: selectors
        }],
        ethers.constants.AddressZero, '0x', {gasLimit: 800000});

    if (!(await tx.wait()).status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }

    assert.sameMembers(await diamondLoupeFacet.facetFunctionSelectors(addresses[3]), DiamondHelper.getSelectors(test1Facet).get(functionsToKeep));
  })

  it('remove all functions and facets except \'diamondCut\' and \'facets\'', async () => {
    let selectors = [];
    let facets = await diamondLoupeFacet.facets();
    for (let i = 0; i < facets.length; i++) {
      selectors.push(...facets[i].functionSelectors);
    }
    selectors = DiamondHelper.removeSelectors(selectors, ['facets()', 'diamondCut(tuple(address,uint8,bytes4[])[],address,bytes)']);

    const tx = await diamondCutFacet.diamondCut(
        [{
          facetAddress: ethers.constants.AddressZero,
          action: DiamondHelper.FacetCutAction.Remove,
          functionSelectors: selectors
        }],
        ethers.constants.AddressZero, '0x', {gasLimit: 800000});

    if (!(await tx.wait()).status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }

    facets = await diamondLoupeFacet.facets();
    assert.equal(facets.length, 2);
    assert.equal(facets[0][0], addresses[0]);
    assert.sameMembers(facets[0][1], ['0x1f931c1c']);
    assert.equal(facets[1][0], addresses[1]);
    assert.sameMembers(facets[1][1], ['0x7a0ed627']);
  })

  it('add most functions and facets', async () => {
    const diamondLoupeFacetSelectors = DiamondHelper.getSelectors(diamondLoupeFacet).remove(['supportsInterface(bytes4)']);
    const Test1Facet = await ethers.getContractFactory('Test1Facet');
    const Test2Facet = await ethers.getContractFactory('Test2Facet');

    const cuts = [
      {
        facetAddress: addresses[1],
        action: DiamondHelper.FacetCutAction.Add,
        functionSelectors: diamondLoupeFacetSelectors.remove(['facets()'])
      },
      {
        facetAddress: addresses[2],
        action: DiamondHelper.FacetCutAction.Add,
        functionSelectors: DiamondHelper.getSelectors(ownershipFacet)
      },
      {
        facetAddress: addresses[3],
        action: DiamondHelper.FacetCutAction.Add,
        functionSelectors: DiamondHelper.getSelectors(Test1Facet)
      },
      {
        facetAddress: addresses[4],
        action: DiamondHelper.FacetCutAction.Add,
        functionSelectors: DiamondHelper.getSelectors(Test2Facet)
      }
    ];

    const tx = await diamondCutFacet.diamondCut(cuts, ethers.constants.AddressZero, '0x', {gasLimit: 8000000});
    if (!(await tx.wait()).status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }

    const facets = await diamondLoupeFacet.facets();
    const facetAddresses = await diamondLoupeFacet.facetAddresses();
    assert.equal(facetAddresses.length, 5);
    assert.equal(facets.length, 5);
    assert.sameMembers(facetAddresses, addresses);
    assert.equal(facets[0][0], facetAddresses[0], 'first facet');
    assert.equal(facets[1][0], facetAddresses[1], 'second facet');
    assert.equal(facets[2][0], facetAddresses[2], 'third facet');
    assert.equal(facets[3][0], facetAddresses[3], 'fourth facet');
    assert.equal(facets[4][0], facetAddresses[4], 'fifth facet');
    assert.sameMembers(facets[DiamondHelper.findAddressPositionInFacets(addresses[0], facets)][1], DiamondHelper.getSelectors(diamondCutFacet));
    assert.sameMembers(facets[DiamondHelper.findAddressPositionInFacets(addresses[1], facets)][1], diamondLoupeFacetSelectors);
    assert.sameMembers(facets[DiamondHelper.findAddressPositionInFacets(addresses[2], facets)][1], DiamondHelper.getSelectors(ownershipFacet));
    assert.sameMembers(facets[DiamondHelper.findAddressPositionInFacets(addresses[3], facets)][1], DiamondHelper.getSelectors(Test1Facet));
    assert.sameMembers(facets[DiamondHelper.findAddressPositionInFacets(addresses[4], facets)][1], DiamondHelper.getSelectors(Test2Facet));
  })
})
