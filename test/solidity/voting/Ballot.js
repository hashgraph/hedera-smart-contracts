// SPDX-License-Identifier: Apache-2.0
const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

/**
 * @notice This specific test suite necessitates the presence of 6 accounts for completion.
 * @notice Ensure that you include 6 private keys in the .env file under the `PRIVATE_KEYS` variable.
 */

describe('@solidityequiv3 Ballot Units Test Suite', function () {
  let ballotContract, owner, addressB, addressC, addressD, addressE, addrs;

  beforeEach(async function () {
    const Ballot = await ethers.getContractFactory(Constants.Contract.Ballot);
    const proposalBytes = ['proposal1', 'proposal2', 'proposal3'].map(
      (proposal) => ethers.encodeBytes32String(proposal)
    );
    ballotContract = await Ballot.deploy(proposalBytes);
    [owner, addressB, addressC, addressD, addressE, addressF, ...addrs] =
      await ethers.getSigners();
  });

  it('Should have the correct chairperson', async function () {
    const chairperson = await ballotContract.chairperson();
    expect(chairperson).to.equal(owner.address);
  });

  it('Should give voting rights', async function () {
    const tx = await ballotContract.giveRightToVote(addressB.address);
    await tx.wait();
    const voter = await ballotContract.voters(addressB.address);
    expect(voter.weight).to.equal(1);
  });

  it('Should allow a voter to delegate their vote', async function () {
    const giveRightToVoteTx = await ballotContract.giveRightToVote(
      addressB.address
    );
    await giveRightToVoteTx.wait();

    const delegateTx = await ballotContract
      .connect(addressB)
      .delegate(owner.address);
    await delegateTx.wait();

    const ownerVoter = await ballotContract.voters(owner.address);
    expect(ownerVoter.weight).to.equal(2); // 1 (original) + 1 (delegated)
  });

  it('Should allow voting for a proposal', async function () {
    const giveRightToVoteTx = await ballotContract.giveRightToVote(
      addressB.address
    );
    await giveRightToVoteTx.wait();

    const voteTx = await ballotContract.connect(addressB).vote(1); // voting for proposal2
    await voteTx.wait();

    const proposal = await ballotContract.proposals(1);
    expect(proposal.voteCount).to.equal(1);
  });

  it('Should correctly determine the winning proposal', async function () {
    await ballotContract.giveRightToVote(addressB.address);
    await ballotContract.connect(addressB).vote(1); // voting for proposal2

    await ballotContract.giveRightToVote(addressC.address);
    await ballotContract.connect(addressC).vote(1); // voting for proposal2

    await ballotContract.giveRightToVote(addressD.address);
    await ballotContract.connect(addressD).vote(2); // voting for proposal3

    await ballotContract.giveRightToVote(addressE.address);
    await ballotContract.connect(addressE).vote(0); // voting for proposal1

    const winningProposalId = await ballotContract.winningProposal();
    expect(winningProposalId).to.equal(1);
  });
});
