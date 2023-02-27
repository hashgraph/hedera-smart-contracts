const {expect} = require("chai");
const utils = require('./utils');

describe("RedirectForToken test", function () {
  const amount = 33;
  let signers;
  let tokenCreateContract;
  let tokenAddress;
  let IERC20;

  const parseCallResponseEventData = async (tx) => {
    return (await tx.wait()).events.filter(e => e.event === 'CallResponseEvent')[0].args;
  }

  const decodeHexToASCII = (message) => {
    message = message.replace(/^0x/, "");

    const strLen = parseInt(message.slice(64, 128), 16);
    const hex = message.slice(128, 128 + strLen * 2);

    let str = '';
    for (let n = 0; n < hex.length; n += 2) {
      str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }

    return str;
  }

  before(async () => {
    signers = await ethers.getSigners();

    const tokenCreateFactory = await ethers.getContractFactory("TokenCreateContract");
    const tokenCreateTx = await tokenCreateFactory.deploy({gasLimit: 1_000_000});
    tokenCreateContract = await ethers.getContractAt("TokenCreateContract", (await tokenCreateTx.deployTransaction.wait()).contractAddress);

    const tokenAddressTx = await tokenCreateContract.createFungibleTokenWithSECP256K1AdminKeyPublic(signers[0].address, utils.getSignerCompressedPublicKey(), {
      value: "10000000000000000000",
      gasLimit: 1_000_000,
    });
    tokenAddress = (await tokenAddressTx.wait()).events.filter((e) => e.event === "CreatedToken")[0].args.tokenAddress;

    await utils.associateToken(tokenCreateContract, tokenAddress, 'TokenCreateContract');
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);

    IERC20 = new ethers.utils.Interface((await hre.artifacts.readArtifact("ERC20")).abi);
  });

  it('should be able to execute name()', async function () {
    const encodedFunc = IERC20.encodeFunctionData("name()");
    const tx = await tokenCreateContract.redirectForToken(tokenAddress, encodedFunc);
    const [success, result] = await parseCallResponseEventData(tx);
    expect(success).to.eq(true);
    expect(decodeHexToASCII(result)).to.eq('tokenName');
  });

  it('should be able to execute symbol()', async function () {
    const encodedFunc = IERC20.encodeFunctionData("symbol()");
    const tx = await tokenCreateContract.redirectForToken(tokenAddress, encodedFunc);
    const [success, result] = await parseCallResponseEventData(tx);
    expect(success).to.eq(true);
    expect(decodeHexToASCII(result)).to.eq('tokenSymbol');
  });

  it('should be able to execute decimals()', async function () {
    const encodedFunc = IERC20.encodeFunctionData("decimals()");
    const tx = await tokenCreateContract.redirectForToken(tokenAddress, encodedFunc);
    const [success, result] = await parseCallResponseEventData(tx);
    expect(success).to.eq(true);
    expect(Number(result)).to.eq(8);
  });

  it('should be able to execute totalSupply()', async function () {
    const encodedFunc = IERC20.encodeFunctionData("totalSupply()");
    const tx = await tokenCreateContract.redirectForToken(tokenAddress, encodedFunc);
    const [success, result] = await parseCallResponseEventData(tx);
    expect(success).to.eq(true);
    expect(Number(result)).to.eq(1000);
  });

  it('should be able to execute balanceOf(address)', async function () {
    const encodedFuncSigner0 = IERC20.encodeFunctionData("balanceOf(address)", [signers[0].address]);
    const tx0 = await tokenCreateContract.redirectForToken(tokenAddress, encodedFuncSigner0);
    const [success0, result0] = await parseCallResponseEventData(tx0);
    expect(success0).to.eq(true);
    expect(Number(result0)).to.eq(1000);

    const encodedFuncSigner1 = IERC20.encodeFunctionData("balanceOf(address)", [signers[1].address]);
    const tx1 = await tokenCreateContract.redirectForToken(tokenAddress, encodedFuncSigner1);
    const [success1, result1] = await parseCallResponseEventData(tx1);
    expect(success1).to.eq(true);
    expect(Number(result1)).to.eq(0);
  });

  it('should be able to execute approve(address,uint256)', async function () {
    const encodedFunc = IERC20.encodeFunctionData("approve(address,uint256)", [signers[1].address, amount]);
    const tx = await tokenCreateContract.redirectForToken(tokenAddress, encodedFunc, {gasLimit: 10_000_000});
    const [success] = await parseCallResponseEventData(tx);
    expect(success).to.eq(true);
  });

  it('should be able to execute allowance(address,address)', async function () {
    const encodedFunc = IERC20.encodeFunctionData("allowance(address,address)", [tokenCreateContract.address, signers[1].address]);
    const tx = await tokenCreateContract.redirectForToken(tokenAddress, encodedFunc, {gasLimit: 10_000_000});
    const [success, result] = await parseCallResponseEventData(tx);
    expect(success).to.eq(true);
    expect(Number(result)).to.eq(amount);
  });

  it('should be able to execute transfer(address,uint256)', async function () {
    const erc20 = await ethers.getContractAt('ERC20Mock', tokenAddress);
    await erc20.transfer(tokenCreateContract.address, amount);

    const balanceBefore = await erc20.balanceOf(signers[1].address);

    const encodedFunc = IERC20.encodeFunctionData("transfer(address,uint256)", [signers[1].address, amount]);
    const tx = await tokenCreateContract.redirectForToken(tokenAddress, encodedFunc);
    const [success] = await parseCallResponseEventData(tx);
    expect(success).to.eq(true);

    const balanceAfter = await erc20.balanceOf(signers[1].address);
    expect(balanceBefore).to.not.eq(balanceAfter);
    expect(balanceAfter).to.eq(balanceBefore + amount);
  });

  it('should be able to execute transferFrom(address,address,uint256)', async function () {
    const erc20 = await ethers.getContractAt('ERC20Mock', tokenAddress);
    await erc20.transfer(tokenCreateContract.address, amount);

    const balanceBefore = await erc20.balanceOf(signers[1].address);

    const encodedFunc = IERC20.encodeFunctionData("transferFrom(address,address,uint256)", [tokenCreateContract.address, signers[1].address, amount]);
    const tx = await tokenCreateContract.redirectForToken(tokenAddress, encodedFunc);
    const [success] = await parseCallResponseEventData(tx);
    expect(success).to.eq(true);

    const balanceAfter = await erc20.balanceOf(signers[1].address);
    expect(balanceBefore).to.not.eq(balanceAfter);
    expect(balanceAfter).to.eq(parseInt(balanceBefore) + parseInt(amount));
  });
});
