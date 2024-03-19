const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@OZGovernor Test Suite', function () {
  let actions, exampleToken, governor, projectTeam, deployer, proposalId;
  const GAS_LIMIT = 1_000_000;
  const VOTE_WEIGHT = 1000;
  const VOTE_SUPPORT = 1; // 1 = For, 0 = Against, 2 = Abstain
  const GRANT_AMOUNT = 100;

  const description = 'Proposal #1: ';
  const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));

  before(async function () {
    [deployer, projectTeam] = await ethers.getSigners();

    // Deploy the token contract
    const ExampleToken = await ethers.getContractFactory(
      Constants.Contract.ExampleTokenVote
    );
    exampleToken = await ExampleToken.deploy({ gasLimit: GAS_LIMIT });

    await exampleToken.mint(deployer.address, VOTE_WEIGHT);

    // Deploy the ExampleGovernor
    const ExampleGovernor = await ethers.getContractFactory(
      Constants.Contract.ExampleGovernor
    );
    governor = await ExampleGovernor.deploy(await exampleToken.getAddress(), {
      gasLimit: GAS_LIMIT,
    });

    const teamAddress = await projectTeam.getAddress();
    const transferCalldata = exampleToken.interface.encodeFunctionData(
      'transfer',
      [teamAddress, GRANT_AMOUNT]
    );

    actions = {
      targets: [await exampleToken.getAddress()],
      values: [0], // ETH value for the transaction, typically 0 for non-payable functions
      calldatas: [transferCalldata],
    };
  });

  it('Should allow creating proposals', async function () {
    await exampleToken.connect(deployer).delegate(deployer.address); // Delegate votes
    const tx = await governor
      .connect(deployer)
      .propose(actions.targets, actions.values, actions.calldatas, description);
    const receipt = await tx.wait();

    const event = receipt.logs.find(
      (event) => event.fragment.name === 'ProposalCreated'
    );

    proposalId = event.args.proposalId;

    expect(proposalId).to.not.be.undefined;
    expect(event.args.description).to.eq(description);
    expect(event.args.targets[0]).to.eq(await exampleToken.getAddress());
    expect(event.args.proposer).to.eq(await deployer.getAddress());
  });

  it('Should allow voting on a proposal', async function () {
    const tx = await governor
      .connect(deployer)
      .castVote(proposalId, VOTE_SUPPORT, Constants.GAS_LIMIT_1_000_000);
    const receipt = await tx.wait();
    const event = receipt.logs.find((e) => e.fragment.name === 'VoteCast');
    const proposalDeadline = await governor.proposalDeadline(proposalId);

    const proposalState = await governor.state(proposalId);

    expect(proposalState).to.eq(1); // active
    expect(event.args.support).to.eq(VOTE_SUPPORT);
    expect(event.args.proposalId).to.eq(proposalId);
    expect(event.blockNumber).to.lte(proposalDeadline);
    expect(event.args.voter).to.eq(await deployer.getAddress());
    expect(event.args.weight).to.eq(BigInt(VOTE_WEIGHT));
  });

  it('Should wait until the Vote Period passes and return a successful state on the proposal', async () => {
    // wait for voting period to be over => Proposal Succeeded as the quorum has reached and the majority of the vote is in favor
    let blockNum = await ethers.provider.getBlockNumber();
    const proposalDeadline = await governor.proposalDeadline(proposalId);

    while (blockNum <= proposalDeadline) {
      new Promise((r) => setTimeout(r, 500));
      blockNum = await ethers.provider.getBlockNumber();
    }

    const proposalState = await governor.state(proposalId);
    expect(proposalState).to.equal(4); // 4 = Succeeded
  });

  it('Should execute a proposal', async () => {
    // in production, there should be a treasury account for this task
    // funding governor contract
    await exampleToken
      .connect(deployer)
      .transfer(await governor.getAddress(), GRANT_AMOUNT);

    expect(await exampleToken.balanceOf(await governor.getAddress())).to.eq(
      GRANT_AMOUNT
    );

    // execute proposal
    const tx = await governor
      .connect(deployer)
      .execute(
        actions.targets,
        actions.values,
        actions.calldatas,
        descriptionHash
      );
    await tx.wait();

    expect(await exampleToken.balanceOf(deployer.address)).to.eq(
      BigInt(VOTE_WEIGHT - GRANT_AMOUNT)
    );
    expect(await exampleToken.balanceOf(await governor.getAddress())).to.eq(
      BigInt(0)
    );
    expect(await exampleToken.balanceOf(projectTeam.address)).to.eq(
      BigInt(GRANT_AMOUNT)
    );

    const proposalState = await governor.state(proposalId);
    expect(proposalState).to.eq(7); // 7 = Executed
  });
});
