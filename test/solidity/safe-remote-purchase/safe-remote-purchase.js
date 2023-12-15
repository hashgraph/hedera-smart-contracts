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

const contractStates = {
    Created: 0,
    Locked: 1,
    Release: 2,
    Inactive: 3
}
const tinybarToHbarCoef = 100_000_000
const EVEN_VALUE = 30_000_000_000
const EVEN_NUMBER_PRICE = 1 * tinybarToHbarCoef
const ODD_NUMBER_PRICE = 1 * tinybarToHbarCoef - 1
async function setupContract() {
    const signers = await ethers.getSigners()
    const seller = signers[0]
    const buyer = signers[1]
    const factoryPurchase = await ethers.getContractFactory('Purchase')
    const contract = await factoryPurchase.deploy({
        value : EVEN_NUMBER_PRICE
    })

    return {
        contract,
        seller,
        buyer,
        factoryPurchase
    }
}

describe('@solidityequiv2 Safe remote purchase', function () {
    let contract, factoryPurchase, seller, buyer
    
    beforeEach(async function () {
        const setup = await setupContract()
        contract = setup.contract
        factoryPurchase = setup.factoryPurchase
        seller = setup.seller
        buyer = setup.buyer
    })

    it('should deploy contract', async function () {
        const deployed = await contract.deployed()
        expect(deployed).to.exist
    })

    it('should revert deployment', async function () {
        const hasError = false
        try {
            const cont = await factoryPurchase.deploy({
                value : EVEN_VALUE - 1
            })
            const rec = await cont.deployTransaction.wait()
            console.log(rec)
        } catch (err) {
            hasError = true
        }
        expect(hasError).to.be.true
    })

    it('should Abort contract', async function () {
        const initialBalance = await ethers.provider.getBalance(seller.address)
        const value = await contract.value()
        const initialState = await contract.state()
        expect(initialState).to.equal(contractStates.Created)

        const trxAbort = await contract.abort()
        const receiptAbort = await trxAbort.wait()

        const finalBalance = await ethers.provider.getBalance(seller.address)
        const finalState = await contract.state()

        //expect(initialBalance.sub(finalBalance).sub(EVEN_NUMBER_PRICE) > 0).to.be.true
        expect(receiptAbort.events[0].event).to.equal('Aborted')
        expect(finalState).to.equal(contractStates.Inactive)
    })

    describe('standart flow buyer -> seller tests: ', async function () {
        let contract, factoryPurchase, seller, buyer

        before(async function () {
            const setup = await setupContract()
            contract = setup.contract
            factoryPurchase = setup.factoryPurchase
            seller = setup.seller
            buyer = setup.buyer
        })

        it('should Confirm the purchase as buyer', async function () {
            const initialState = await contract.state()
            expect(initialState).to.equal(contractStates.Created)
    
            const trxConfirm = await contract.connect(buyer).confirmPurchase({value: 2 * EVEN_NUMBER_PRICE})
            const receiptConfirm = await trxConfirm.wait()
    
            expect(receiptConfirm.events[0].event).to.equal('PurchaseConfirmed')
            const finalState = await contract.state()
            expect(finalState).to.equal(contractStates.Locked)
        })
        
        it('should confirm that purchase is Received', async function () {
            const initialState = await contract.state()
            expect(initialState).to.equal(contractStates.Locked)
    
            const trxConfirm = await contract.connect(buyer).confirmReceived()
            const receiptConfirm = await trxConfirm.wait()
            
            expect(receiptConfirm.events[0].event).to.equal('ItemReceived')
            const finalState = await contract.state()
            expect(finalState).to.equal(contractStates.Release)
        })

        it('should confirm that seller can be refunded', async function () {
            const initialState = await contract.state()
            expect(initialState).to.equal(contractStates.Release)
    
            const trxRefund = await contract.connect(seller).refundSeller()
            const receiptRefund = await trxRefund.wait()
            
            expect(receiptRefund.events[0].event).to.equal('SellerRefunded')
            const finalState = await contract.state()
            expect(finalState).to.equal(contractStates.Inactive)
        })
    })

    describe('test contract modifiers', async () => {
        it('should confirm onlyBuyer modifier', async function () {
            const trxConfirm = await contract.connect(buyer).confirmPurchase({value: 2 * EVEN_NUMBER_PRICE})
            await trxConfirm.wait()
            
            await expect(
                contract.connect(seller).callStatic.confirmReceived()
            ).to.eventually.be.rejected.and.have.property('errorName', 'OnlyBuyer')
        })

        it('should confirm onlySeller modifier', async function () {            
            await expect(
                contract.connect(buyer).callStatic.abort()
            ).to.eventually.be.rejected.and.have.property('errorName', 'OnlySeller')
        })

        it('should confirm inState modifier', async function () {
            const trxConfirm = await contract.connect(buyer).confirmPurchase({value: 2 * EVEN_NUMBER_PRICE})
            await trxConfirm.wait()
            
            await expect(
                contract.connect(seller).callStatic.abort()
            ).to.eventually.be.rejected.and.have.property('errorName', 'InvalidState')
        })

        it('should confirm condition modifier', async function () {
            const value = await contract.value()
            await expect(
                contract.connect(buyer).callStatic.confirmPurchase({value: EVEN_NUMBER_PRICE})
            ).to.eventually.be.rejected.and.have.property('errorName', 'InvalidState')
        })
    })
})
