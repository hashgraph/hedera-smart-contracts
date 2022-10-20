const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

const { Contract } = require('ethers');
const { abi } = require('../../../artifacts/contracts/hts-precompile/IHederaTokenService.sol/IHederaTokenService.json');

const SUCCESS = 22;

describe("IHederaToken create tests", function () {
  let htsPreCompileContractSigner0;
  let htsPreCompileContractSigner1;
  let signers;
  let signer0Address;
  let signer1Address;
  let signer0StartBalance;
  let signer1StartBalance;
  let tokenCreateContract;
  let tokenAddress;

  before(async function () {
    signers = await ethers.getSigners();
    htsPreCompileContractSigner0 = new Contract('0x0000000000000000000000000000000000000167', abi, signers[0]);
    htsPreCompileContractSigner1 = new Contract('0x0000000000000000000000000000000000000167', abi, signers[0]);
    signer0Address = signers[0].address;
    signer1Address = signers[1].address;
    signer0StartBalance = await utils.getRelayBalance(signer0Address);
    signer1StartBalance = await utils.getRelayBalance(signer1Address);
    console.log(`${signer0Address} starting balance: ${signer0StartBalance}`);
    console.log(`${signer1Address} starting balance: ${signer1StartBalance}`);


    // tokenCreateContract = await utils.deployTokenCreateContract();
    tokenAddress = '0x0000000000000000000000000000000002e634d6';//await utils.createFungibleToken(tokenCreateContract);
  });

  after(async function () {
    let endBalance = await utils.getRelayBalance(signer0Address);
    console.log(`${signer0Address} ending balance: ${endBalance}, tests spent ${signer0StartBalance - endBalance}`);


    endBalance = await utils.getRelayBalance(signer1Address);
    console.log(`${signer1Address} ending balance: ${endBalance}, tests spent ${signer1StartBalance - endBalance}`);
  })


  it('should be able to get token info using IHederaTokenService', async function() {
    const txInfo = await htsPreCompileContractSigner0.getTokenInfo(tokenAddress, { gasLimit: 100000 });
    verifyTransaction(txInfo);

    const tokenInfoReceipt = await txInfo.wait();
    verifyTransactionReceipt(tokenInfoReceipt);

    const contractResult = await utils.getMirrorContractResult(txInfo.hash);
    utils.decodeInterfaceCallResult(abi, 'getTokenInfo', contractResult.call_result);
    utils.decodeInterfaceErrorMessage(abi, 'getTokenInfo', contractResult.error_message);
  });

  it('should be able to associate token using IHederaTokenService', async function() {
    const txInfo = await htsPreCompileContractSigner1.associateToken(signer1Address, '0x0000000000000000000000000000000002e634d6', { gasLimit: 1000000 });
    verifyTransaction(txInfo);

    const tokenAssociateReceipt = await txInfo.wait();
    verifyTransactionReceipt(tokenAssociateReceipt);

    const contractResult = await utils.getMirrorContractResult(txInfo.hash);
    utils.decodeInterfaceCallResult(abi, 'associateToken', contractResult.call_result);
    utils.decodeInterfaceErrorMessage(abi, 'associateToken', contractResult.error_message);
    expect(contractResult.call_result).to.eq(SUCCESS);
  });

  it('should be able to dissocaite token using IHederaTokenService', async function() {
    const txInfo = await htsPreCompileContractSigner1.dissociateToken(signer1Address, '0x0000000000000000000000000000000002e634d6', { gasLimit: 1000000 });
    verifyTransaction(txInfo);

    const tokenDissociateReceipt = await txInfo.wait();
    verifyTransactionReceipt(tokenDissociateReceipt);

    const contractResult = await utils.getMirrorContractResult(txInfo.hash);
    utils.decodeInterfaceCallResult(abi, 'dissociateToken', contractResult.call_result);
    utils.decodeInterfaceErrorMessage(abi, 'dissociateToken', contractResult.error_message);
    expect(contractResult.call_result).to.eq(SUCCESS);
  });

  const validateHash = (hash, len = '') => {
    let regex;
    if (len && len > 0) {
      regex = new RegExp(`^0x[a-f0-9]{${len}}$`);
    } else {
      regex = new RegExp(`^0x[a-f0-9]*$`);
    }
  
    return !!hash.match(regex);
  };

  const verifyTransaction = (txInfo) => {
    expect(txInfo).to.exist;
    // console.log(`*** txInfo: ${JSON.stringify(txInfo)}`);
    expect(validateHash(txInfo.hash, 64)).to.eq(true);
    expect(validateHash(txInfo.blockHash, 64)).to.eq(true);
    expect(txInfo.blockNumber).to.be.greaterThan(0);
  };

  const verifyTransactionReceipt = (tokenInfoReceipt) => {
    expect(tokenInfoReceipt).to.exist;
    // console.log(`*** tokenInfoReceipt: ${JSON.stringify(tokenInfoReceipt)}`);
    // expect(validateHash(tokenInfoReceipt.from, 40)).to.eq(true);
    // expect(validateHash(tokenInfoReceipt.to, 40)).to.eq(true);
    expect(validateHash(tokenInfoReceipt.transactionHash, 64)).to.eq(true);
    expect(tokenInfoReceipt.blockNumber).to.be.greaterThan(0);
    expect(tokenInfoReceipt.status).to.eq(1);
  };
});
