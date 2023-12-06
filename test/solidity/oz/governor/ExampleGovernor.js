const { expect } = require('chai')
const { ethers, waffle } = require('hardhat')

describe('ExampleGovernor', function () {
  let actions, exampleToken, governor, simpleStore, timelock
  let deployer, user1, user2
  let proposalId
  const MIN_DELAY = 3600 // 1 hour in seconds

  const description = 'Proposal #1: '
  const descriptionHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(description)
  )

  before(async function () {
    ;[deployer, projectTeam] = await ethers.getSigners()

    // Deploy the token contract
    const ExampleToken = await ethers.getContractFactory('ExampleToken') // Replace with your token contract
    exampleToken = await ExampleToken.deploy()
    await exampleToken.deployed()

    await exampleToken.mint(deployer.address, 1000)

    // Deploy the TimelockController
    const TimelockController = await ethers.getContractFactory(
      'TimelockController'
    )
    timelock = await TimelockController.deploy(
      MIN_DELAY,
      [],
      [],
      deployer.address
    )
    await timelock.deployed()

    // Deploy the ExampleGovernor
    const ExampleGovernor = await ethers.getContractFactory('ExampleGovernor')
    governor = await ExampleGovernor.deploy(
      exampleToken.address,
      timelock.address
    )
    await governor.deployed()

    // const SimpleStore = await ethers.getContractFactory("SimpleStore");
    // simpleStore = await SimpleStore.deploy();
    // await simpleStore.deployed();

    // const tokenAddress = ;
    // const token = await ethers.getContractAt(‘ERC20’, tokenAddress);

    const teamAddress = projectTeam.address
    const grantAmount = 100
    const transferCalldata = exampleToken.interface.encodeFunctionData(
      'transfer',
      [teamAddress, grantAmount]
    )

    // const newStoreValue = 42;
    // const encodedAction = simpleStore.interface.encodeFunctionData("setValue", [newStoreValue]);

    actions = {
      targets: [deployer.address],
      values: [0], // ETH value for the transaction, typically 0 for non-payable functions
      calldatas: [transferCalldata],
    }
  })

  it('should allow creating proposals', async function () {
    await exampleToken.connect(deployer).delegate(deployer.address) // Delegate votes
    await ethers.provider.send('evm_mine', []) // Mine a block

    const tx = await governor
      .connect(deployer)
      .propose(actions.targets, actions.values, actions.calldatas, description)
    const receipt = await tx.wait()

    const event = receipt.events.find(
      (event) => event.event === 'ProposalCreated'
    )
    proposalId = event.args.proposalId
    console.log(`DEBUG: In test, proposalId: ${proposalId}`)
    const voteStart = event.args.voteStart
    console.log(`DEBUG: voteStart: ${voteStart}`)
    // const proposal = await governor.connect(deployer).getProposal(proposalId);
    // console.log(`Debug: proposal: ${JSON.stringify(proposal)}`);

    expect(proposalId).to.not.be.undefined
    expect(event.args.description).to.eq(description)
  })

  it('should allow voting on a proposal', async function () {
    // const proposal = await governor.connect(deployer).getProposal(proposalId);
    // console.log(`Debug: proposal: ${JSON.stringify(proposal)}`);
    // await exampleToken.connect(deployer).delegate(deployer.address);
    // const votingUnits = exampleToken.connect(deployer).getVotingUnits();
    console.log('About to cast vote')
    await governor.connect(deployer).castVote(proposalId, 1) // 1 = For, 0 = Against, 2 = Abstain
    await ethers.provider.send('evm_mine', []) // Mine a block to process the vote

    // Proposal Succeeded
    const proposalState = await governor.state(proposalId)
    expect(proposalState).to.equal(4) // 4 = Succeeded
  })

  it('should execute a proposal after it is successful', async function () {
    // Fast-forward time to surpass the voting period
    await ethers.provider.send('evm_increaseTime', [604800]) // 7 days in seconds
    await ethers.provider.send('evm_mine', [])

    // Queue and execute the proposal
    console.log(`DEBUG: desciptionHash: ${descriptionHash}`)

    const encoded = ethers.utils.defaultAbiCoder.encode(
      ['address[]', 'uint256[]', 'bytes[]', 'bytes32'],
      [actions.targets, actions.values, actions.calldatas, descriptionHash]
    )

    console.log('Encoded Data:', encoded)

    await governor
      .connect(deployer)
      .queue(
        actions.targets,
        actions.values,
        actions.calldatas,
        descriptionHash
      )
    await ethers.provider.send('evm_increaseTime', [MIN_DELAY + 1])
    await ethers.provider.send('evm_mine', [])
    console.log('DEBUG After queue')

    // await governor.connect(deployer).execute(proposalId);
    console.log('About to execute')
    console.log(
      `Values: targets: ${actions.targets} value: ${actions.values} calldatas: ${actions.calldatas} descriptionHash: ${descriptionHash}`
    )
    await governor
      .connect(deployer)
      .execute(
        actions.targets,
        actions.values,
        actions.calldatas,
        descriptionHash
      )
    console.log('after execute')

    // Check the proposal state
    const proposalState = await governor.state(proposalId)
    console.log('proposalState: %s', proposalState)
    expect(proposalState).to.equal(7) // 7 = Executed
  })
})
