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
const { expect } = require('chai')
const { ethers } = require('hardhat')
const Constants = require('../../constants')

describe('@solidityequiv4 Ballot Units tests', function () {
    let ballotContract, owner, addressB, addressC, addressD, addressE, addressF, addrs;

    beforeEach(async function() {
        const Ballot = await ethers.getContractFactory("Ballot");
        const proposalBytes = ["proposal1", "proposal2", "proposal3"].map(proposal => ethers.utils.formatBytes32String(proposal));
        ballotContract = await Ballot.deploy(proposalBytes);
        await ballotContract.deployed();
        [owner, addressB, addressC, addressD, addressE, addressF, ...addrs] = await ethers.getSigners();
    });

    it("Should have the correct chairperson", async function() {
        const chairperson = await ballotContract.chairperson();
        expect(chairperson).to.equal(owner.address);
    });

    it("Should give voting rights", async function() {
        await ballotContract.giveRightToVote(addressB.address);
        const voter = await ballotContract.voters(addressB.address);
        expect(voter.weight).to.equal(1);
    });

    it("Should allow a voter to delegate their vote", async function() {
        await ballotContract.giveRightToVote(addressB.address);
        await ballotContract.connect(addressB).delegate(owner.address);
        const ownerVoter = await ballotContract.voters(owner.address);
        expect(ownerVoter.weight).to.equal(2); // 1 (original) + 1 (delegated)
    }); 
    
    it("Should allow voting for a proposal", async function() {
        await ballotContract.giveRightToVote(addressB.address);
        await ballotContract.connect(addressB).vote(1); // voting for proposal2
        const proposal = await ballotContract.proposals(1);
        expect(proposal.voteCount).to.equal(1);
    });

    it("Should correctly determine the winning proposal", async function() {

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

})