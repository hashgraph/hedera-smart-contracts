const { expect } = require('chai')
const { ethers } = require('hardhat')
const Constants = require('../../constants')
const Utils = require('../../hts-precompile/utils')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe('Solidity Simple Auction example', function () {
  let factory, signers, wallet, wallet1, 
      contract, hasError, bidAmount,
      contractShortLived, bidAmountSmall, initialEvent
  const CONTRACT_DURATION = 10000000000
  const CONTRACT_SHORT_DURATION = 1
  const TRANSACTION_VALUE = '100'
  const TRANSACTION_VALUE_SMALL = '10'

  before(async function () {
    signers = await ethers.getSigners()
    wallet = signers[0]
    wallet1 = signers[1]

    factory = await ethers.getContractFactory(Constants.Contract.SimpleAuction)
    contractShortLived = await factory.deploy(CONTRACT_SHORT_DURATION, wallet1.address)
    await contractShortLived.deployed();

    bidAmount = ethers.utils.parseUnits(TRANSACTION_VALUE, 'gwei')
    bidAmountSmall = ethers.utils.parseUnits(TRANSACTION_VALUE_SMALL, 'gwei')
    await sleep(5000)
  })

  beforeEach(async function () {
    hasError = false
    contract = await factory.deploy(CONTRACT_DURATION, wallet.address)
    await contract.deployed();

    const trx = await contract.bid({ value: bidAmountSmall })
    const receipt = await trx.wait()
    initialEvent = receipt.events[0].event
  })

  it('should confirm "bid" function works', async function () {    
    const highestBid = await contract.highestBid()
    const highestBidder = await contract.highestBidder()

    expect(highestBid.mul(Utils.tinybarToWeibarCoef)).to.equal(bidAmountSmall)
    expect(highestBidder).to.equal(wallet.address)
    expect(initialEvent).to.equal('HighestBidIncreased')
  })

  it('should confirm bid not high enough scenario works: BidNotHighEnough', async function () {
    try {
      const tr = await contract.bid({ value: bidAmountSmall })
      const receipt = await tr.wait();
      expect(receipt).to.not.be.null
    } catch (error) {
      hasError = true
      expect(error.code).to.be.equal('CALL_EXCEPTION')
    }

    expect(hasError).to.equal(true)
  })

  it('should revert a bid with "AuctionAlreadyEnded" error', async function () {
    try {
      console.log("Waiting for the next block")
      await sleep(5000)
      console.log("Done")
      const tr = await contractShortLived.bid({ value: bidAmountSmall })
      await tr.wait()
    } catch (error) {
      hasError = true
    }

    expect(hasError).to.equal(true)
  })

  it('should confirm "withdraw" function works', async function () {
    expect(initialEvent, "Initial bid").to.equal('HighestBidIncreased')

    const initialHighestBidder = await contract.highestBidder()
    const previousContractBalance = await ethers.provider.getBalance(contract.address)
    expect(previousContractBalance, `Initial Contract balance to be: ${bidAmountSmall}`).to.equal(bidAmountSmall)
    expect(initialHighestBidder, `Initial Highest bidder to be: ${initialHighestBidder}`).to.equal(wallet.address)

    const tr = await contract.connect(wallet1).bid({ value: bidAmount })
    await tr.wait()

    await sleep(1000)
    const newHighestBidder = await contract.highestBidder()
    expect(newHighestBidder, "New Highest bidder to be: --Wallet1--").to.equal(wallet1.address)
    const currentContractBalance = await ethers.provider.getBalance(contract.address)
    
    const combined = bidAmount.add(bidAmountSmall)
    expect(currentContractBalance, "The contract balance to be the combined of the two transactions").to.equal(combined)

    // Call the withdraw function with the previous highest bidder's address
    const withdrawTx = await contract.connect(wallet).withdraw()
    await withdrawTx.wait()
  
    await sleep(1000)
    // Check that the amount of Ether returned to the previous highest bidder is correct
    const newContractBalance = await ethers.provider.getBalance(contract.address)
    expect(newContractBalance, "The new balance to be bidAmount").to.equal(bidAmount)
  })

  it('should confirm "auctionEnd" function works', async function () {
    expect(initialEvent, "Initial bid").to.equal('HighestBidIncreased')
    const previousContractBalance = await ethers.provider.getBalance(contract.address)
    expect(previousContractBalance, `Initial Contract balance to be: ${bidAmountSmall}`).to.equal(bidAmountSmall)

    const tr = await contractShortLived.connect(wallet).auctionEnd()
    await tr.wait()

    await sleep(1000)
    const contractBalance = await ethers.provider.getBalance(contract.address)
    expect(contractBalance, `Contract balance after "auctionEnd" to be: ${bidAmountSmall}`).to.equal(bidAmountSmall)
  })
})
