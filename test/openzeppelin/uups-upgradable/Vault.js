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

const { expect } = require('chai');
const Constants = require('../../constants');
const { ethers, upgrades } = require('hardhat');

describe('@OZUUPSUpgradable Upgradable Vaults Test Suite', () => {
  const DEPOSIT_AMOUNT = ethers.parseEther('3.0');
  const TINY_BAR_TO_WEI_COEF = 10_000_000_000n;
  const CALL_EXCEPTION = 'CALL_EXCEPTION';
  let vaultV1, vaultV2, owner, beneficiary;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    owner = signers[0];
    beneficiary = signers[1];

    const VaultV1 = await ethers.getContractFactory(Constants.Contract.VaultV1);
    vaultV1 = await upgrades.deployProxy(VaultV1, {
      kind: 'uups',
    });
    await vaultV1.waitForDeployment();
  });

  it('V1: Should deploy the proxy', async () => {
    expect(vaultV1).to.exist;
    expect(await vaultV1.version()).to.eq(1);
    expect(await vaultV1.totalBalance()).to.eq(0);
  });

  it('V1: Should deposit Hbar into vaultV1', async () => {
    await (await vaultV1.deposit({ value: DEPOSIT_AMOUNT })).wait();

    const totalBalance = await vaultV1.totalBalance();

    expect(totalBalance).to.eq(DEPOSIT_AMOUNT / TINY_BAR_TO_WEI_COEF);
  });

  it('V1: Should allow owner to withdraw an amount of Hbar', async () => {
    await (await vaultV1.deposit({ value: DEPOSIT_AMOUNT })).wait();
    const WITHDRAW_AMOUNT = ethers.parseEther('1.0') / TINY_BAR_TO_WEI_COEF;

    const tx = await vaultV1.withdraw(WITHDRAW_AMOUNT);
    const receipt = await tx.wait();
    const [withdrawer, amount] = receipt.logs[0].args;

    const totalLeftBalance = await vaultV1.totalBalance();

    expect(withdrawer).to.eq(await owner.getAddress());
    expect(amount).to.eq(WITHDRAW_AMOUNT);
    expect(totalLeftBalance).to.eq(
      DEPOSIT_AMOUNT / TINY_BAR_TO_WEI_COEF - WITHDRAW_AMOUNT
    );
  });

  it('V1: Should NOT allow owner to withdraw an amount of Hbar which is greater than current balance', async () => {
    const WITHDRAW_AMOUNT = ethers.parseEther('4.0') / TINY_BAR_TO_WEI_COEF;

    expect(
      vaultV1.withdraw(WITHDRAW_AMOUNT)
    ).to.eventually.be.rejected.and.have.property('code', CALL_EXCEPTION);
  });

  it('V1: Should NOT allow non-owner account to withdraw an amount of Hbar', async () => {
    const WITHDRAW_AMOUNT = ethers.parseEther('2.0') / TINY_BAR_TO_WEI_COEF;

    expect(
      vaultV1.connect(beneficiary).withdraw(WITHDRAW_AMOUNT)
    ).to.eventually.be.rejected.and.have.property('code', CALL_EXCEPTION);
  });

  describe('Vault V2 upgrade', () => {
    beforeEach(async () => {
      const VaultV2 = await ethers.getContractFactory(
        Constants.Contract.VaultV2
      );
      vaultV2 = await upgrades.upgradeProxy(
        await vaultV1.getAddress(),
        VaultV2,
        {
          kind: 'uups',
        }
      );
      // wait for the upgrade transaction to completely be done
      await vaultV2.deployTransaction.wait();

      const initTx = await vaultV2.initializeV2(await beneficiary.getAddress());
      await initTx.wait();
    });

    it('V2: Should upgrade vaultV1 to VaultV2', async () => {
      expect(await vaultV2.getAddress()).to.eq(await vaultV1.getAddress());
      expect(await vaultV2.version()).to.eq(2);
      expect(await vaultV2.getCurrentBeneficiary()).to.eq(
        await beneficiary.getAddress()
      );
    });

    it('V2: Should deposit Hbar into vaultV2', async () => {
      await (await vaultV2.deposit({ value: DEPOSIT_AMOUNT })).wait();

      const totalBalance = await vaultV1.totalBalance();

      expect(totalBalance).to.eq(DEPOSIT_AMOUNT / TINY_BAR_TO_WEI_COEF);
    });

    it('V2: Should allow the rightful beneficiary to withdraw an amount of Hbar', async () => {
      await (await vaultV2.deposit({ value: DEPOSIT_AMOUNT })).wait();

      const WITHDRAW_AMOUNT = ethers.parseEther('1.0') / TINY_BAR_TO_WEI_COEF;

      const tx = await vaultV2.connect(beneficiary).withdraw(WITHDRAW_AMOUNT);
      const receipt = await tx.wait();
      const [withdrawer, amount] = receipt.logs[0].args;
      const totalLeftBalance = await vaultV2.totalBalance();

      expect(withdrawer).to.eq(await beneficiary.getAddress());
      expect(amount).to.eq(WITHDRAW_AMOUNT);
      expect(totalLeftBalance).to.eq(
        DEPOSIT_AMOUNT / TINY_BAR_TO_WEI_COEF - WITHDRAW_AMOUNT
      );
    });

    it('V2: Should NOT allow beneficiary to withdraw an amount of Hbar which is greater than current balance', async () => {
      const WITHDRAW_AMOUNT = ethers.parseEther('4.0') / TINY_BAR_TO_WEI_COEF;

      expect(
        vaultV2.connect(beneficiary).withdraw(WITHDRAW_AMOUNT)
      ).to.eventually.be.rejected.and.have.property('code', CALL_EXCEPTION);
    });

    it('V2: Should NOT allow non-beneficial account to withdraw an amount of Hbar', async () => {
      const WITHDRAW_AMOUNT = ethers.parseEther('2.0') / TINY_BAR_TO_WEI_COEF;

      expect(
        vaultV1.connect(owner).withdraw(WITHDRAW_AMOUNT)
      ).to.eventually.be.rejected.and.have.property('code', CALL_EXCEPTION);
    });
  });
});
