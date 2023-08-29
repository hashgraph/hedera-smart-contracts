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

import {
  CommonKeyObject,
  TokenCreateCustomSmartContractResult,
} from '@/types/contract-interactions/HTS';
import { prepareHederaTokenKeyArray } from '@/utils/contract-interactions/HTS/helpers';
import { Contract, ethers, isAddress } from 'ethers';

/**
 * @dev creates a Hedera fungible token
 *
 * @dev integrates tokenCreateCustomContract.createFungibleTokenPublic() and tokenCreateCustomContract.createFungibleTokenWithCustomFeesPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param name: string
 *
 * @param symbol: string
 *
 * @param memo: string
 *
 * @param initialTotalSupply: number
 *
 * @param maxSupply: number
 *
 * @param decimals: number
 *
 * @param freezeDefaultStatus: boolean
 *
 * @param treasury: string
 *
 * @param inputKeys: CommonKeyObject[],
 *
 * @param msgValue: string
 *
 * @param feeTokenAddress?: string
 *
 * @return Promise<TokenCreateCustomSmartContractResult>
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L136
 *      for more information on the purposes of the params
 */
export const createHederaFungibleToken = async (
  baseContract: Contract,
  name: string,
  symbol: string,
  memo: string,
  initialTotalSupply: number,
  maxSupply: number,
  decimals: number,
  freezeDefaultStatus: boolean,
  treasury: string,
  inputKeys: CommonKeyObject[],
  msgValue: string,
  feeTokenAddress?: string
): Promise<TokenCreateCustomSmartContractResult> => {
  // sanitize params
  let sanitizeErr;
  if (initialTotalSupply < 0) {
    sanitizeErr = 'initial total supply cannot be negative';
  } else if (maxSupply < 0) {
    sanitizeErr = 'max supply cannot be negative';
  } else if (decimals < 0) {
    sanitizeErr = 'decimals cannot be negative';
  } else if (!isAddress(treasury)) {
    sanitizeErr = 'invalid treasury address';
  } else if (feeTokenAddress && !isAddress(feeTokenAddress)) {
    sanitizeErr = 'invalid fee token address';
  }
  if (sanitizeErr) {
    console.error(sanitizeErr);
    return { err: sanitizeErr };
  }

  // prepare keys array
  const keyRes = prepareHederaTokenKeyArray(inputKeys);

  // handle error
  if (keyRes.err) {
    console.error(keyRes.err);
    return { err: keyRes.err };
  }

  try {
    let tokenCreateTx;
    if (feeTokenAddress) {
      tokenCreateTx = await baseContract.createFungibleTokenWithCustomFeesPublic(
        treasury,
        feeTokenAddress,
        name,
        symbol,
        memo,
        initialTotalSupply,
        maxSupply,
        decimals,
        keyRes.hederaTokenKeys,
        {
          value: ethers.parseEther(msgValue),
          gasLimit: 1_000_000,
        }
      );
    } else {
      tokenCreateTx = await baseContract.createFungibleTokenPublic(
        name,
        symbol,
        memo,
        initialTotalSupply,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        treasury,
        keyRes.hederaTokenKeys,
        {
          value: ethers.parseEther(msgValue),
          gasLimit: 1_000_000,
        }
      );
    }

    const txReceipt = await tokenCreateTx.wait();

    const { data } = txReceipt.logs.filter(
      (event: any) => event.fragment.name === 'CreatedToken'
    )[0];

    // @notice since the returned `data` is 32 byte, convert it to the public 20-byte address standard
    const tokenAddress = `0x${data.slice(-40)}`;

    return { tokenAddress, transactionHash: txReceipt.hash };
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev creates a Hedera non fungible token
 *
 * @dev integrates tokenCreateCustomContract.createNonFungibleTokenPublic() and tokenCreateCustomContract.createNonFungibleTokenWithCustomFeesPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param name: string
 *
 * @param symbol: string
 *
 * @param memo: string
 *
 * @param maxSupply: number
 *
 * @param treasury: string
 *
 * @param inputKeys: CommonKeyObject[],
 *
 * @param msgValue: string
 *
 * @param feeTokenAddress?: string
 *
 * @return Promise<TokenCreateCustomSmartContractResult>
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L136
 *      for more information on the purposes of the params
 */
export const createHederaNonFungibleToken = async (
  baseContract: Contract,
  name: string,
  symbol: string,
  memo: string,
  maxSupply: number,
  treasury: string,
  inputKeys: CommonKeyObject[],
  msgValue: string,
  feeTokenAddress?: string
): Promise<TokenCreateCustomSmartContractResult> => {
  // sanitize params
  let sanitizeErr;
  if (maxSupply < 0) {
    sanitizeErr = 'max supply cannot be negative';
  } else if (!isAddress(treasury)) {
    sanitizeErr = 'invalid treasury address';
  } else if (feeTokenAddress && !isAddress(feeTokenAddress)) {
    sanitizeErr = 'invalid fee token address';
  }

  if (sanitizeErr) {
    console.error(sanitizeErr);
    return { err: sanitizeErr };
  }

  // prepare keys array
  const keyRes = prepareHederaTokenKeyArray(inputKeys);

  // handle error
  if (keyRes.err) {
    return { err: keyRes.err };
  }

  try {
    let tokenCreateTx;
    if (feeTokenAddress) {
      tokenCreateTx = await baseContract.createNonFungibleTokenWithCustomFeesPublic(
        treasury,
        feeTokenAddress,
        name,
        symbol,
        memo,
        maxSupply,
        keyRes.hederaTokenKeys,
        {
          value: ethers.parseEther(msgValue),
          gasLimit: 1_000_000,
        }
      );
    } else {
      tokenCreateTx = await baseContract.createNonFungibleTokenPublic(
        name,
        symbol,
        memo,
        maxSupply,
        treasury,
        keyRes.hederaTokenKeys,
        {
          value: ethers.parseEther(msgValue),
          gasLimit: 1_000_000,
        }
      );
    }

    const txReceipt = await tokenCreateTx.wait();

    const { data } = txReceipt.logs.filter(
      (event: any) => event.fragment.name === 'CreatedToken'
    )[0];

    // @notice since the returned `data` is 32 byte, convert it to the public 20-byte address standard
    const tokenAddress = `0x${data.slice(-40)}`;

    return { tokenAddress, transactionHash: txReceipt.hash };
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev mints Hedera tokens
 *
 * @dev integrates tokenCreateCustomContract.mintTokenPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param tokenType: 'FUNGIBLE' | 'NON_FUNGIBLE'
 *
 * @param hederaTokenAddress: string
 *
 * @param amountToMint: number
 *
 * @param metadata: string[]
 *
 * @return Promise<TokenCreateCustomSmartContractResult>
 */
export const mintHederaToken = async (
  baseContract: Contract,
  tokenType: 'FUNGIBLE' | 'NON_FUNGIBLE',
  hederaTokenAddress: string,
  amountToMint: number,
  metadata: string[]
): Promise<TokenCreateCustomSmartContractResult> => {
  // sanitize params
  let sanitizeErr;
  if (!isAddress(hederaTokenAddress)) {
    sanitizeErr = 'invalid Hedera token address';
  } else if (tokenType === 'FUNGIBLE' && amountToMint < 0) {
    sanitizeErr = 'amount to mint cannot be negative when minting a fungible token';
  } else if (tokenType === 'NON_FUNGIBLE' && amountToMint !== 0) {
    sanitizeErr = 'amount to mint must be 0 when minting a non-fungible token';
  }

  if (sanitizeErr) {
    console.error(sanitizeErr);
    return { err: sanitizeErr };
  }

  // convert metadata to Buffer[]
  const bufferedMetadata = metadata.map((meta) => Buffer.from(meta));

  // execute .mintTokenPublic() method
  try {
    const tx = await baseContract.mintTokenPublic(
      hederaTokenAddress,
      amountToMint,
      bufferedMetadata,
      {
        gasLimit: 1_000_000,
      }
    );

    const txReceipt = await tx.wait();

    const { data: mintedTokenData } = txReceipt.logs.filter(
      (event: any) => event.fragment.name === 'MintedToken'
    )[0];

    return { transactionHash: txReceipt.hash, mintedTokenEventData: mintedTokenData };
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev mints Hedera tokens and transfer it to another address
 *
 * @dev integrates tokenCreateCustomContract.mintTokenToAddressPublic() & tokenCreateCustomContract.mintNonFungibleTokenToAddressPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param tokenType: 'FUNGIBLE' | 'NON_FUNGIBLE'
 *
 * @param hederaTokenAddress: string
 *
 * @param recipientAddress: string
 *
 * @param amountToMint: number
 *
 * @param metadata: string[]
 *
 * @return Promise<TokenCreateCustomSmartContractResult>
 */
export const mintHederaTokenToAddress = async (
  baseContract: Contract,
  tokenType: 'FUNGIBLE' | 'NON_FUNGIBLE',
  hederaTokenAddress: string,
  recipientAddress: string,
  amountToMint: number,
  metadata: string[]
): Promise<TokenCreateCustomSmartContractResult> => {
  // sanitize params
  let sanitizeErr;
  if (!isAddress(hederaTokenAddress)) {
    sanitizeErr = 'invalid Hedera token address';
  } else if (!isAddress(recipientAddress)) {
    sanitizeErr = 'invalid recipient address';
  } else if (tokenType === 'FUNGIBLE' && amountToMint < 0) {
    sanitizeErr = 'amount to mint cannot be negative when minting a fungible token';
  } else if (tokenType === 'NON_FUNGIBLE' && amountToMint !== 0) {
    sanitizeErr = 'amount to mint must be 0 when minting a non-fungible token';
  }

  if (sanitizeErr) {
    console.error(sanitizeErr);
    return { err: sanitizeErr };
  }

  // convert metadata to Buffer[]
  const bufferedMetadata = metadata.map((meta) => Buffer.from(meta));

  try {
    let tx;
    if (tokenType === 'FUNGIBLE') {
      tx = await baseContract.mintTokenToAddressPublic(
        hederaTokenAddress,
        recipientAddress,
        amountToMint,
        bufferedMetadata,
        {
          gasLimit: 1_000_000,
        }
      );
    } else {
      tx = await baseContract.mintNonFungibleTokenToAddressPublic(
        hederaTokenAddress,
        recipientAddress,
        amountToMint,
        bufferedMetadata,
        {
          gasLimit: 1_000_000,
        }
      );
    }

    const txReceipt = await tx.wait();

    const { data: mintedTokenData } = txReceipt.logs.filter(
      (event: any) => event.fragment.name === 'MintedToken'
    )[0];

    const { data: transferTokenData } = txReceipt.logs.filter(
      (event: any) => event.fragment.name === 'TransferToken'
    )[0];

    return {
      transactionHash: txReceipt.hash,
      mintedTokenEventData: mintedTokenData,
      transferTokenEventData: transferTokenData,
    };
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev associates Hedera tokens to accounts
 *
 * @dev integrates tokenCreateCustomContract.associateTokensPublic() and tokenCreateCustomContract.associateTokenPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param hederaTokenAddresses: string[]
 *
 * @param associtingAccountAddress: string
 *
 * @return Promise<TokenCreateCustomSmartContractResult>
 */
export const associateHederaTokensToAccounts = async (
  baseContract: Contract,
  hederaTokenAddresses: string[],
  associtingAccountAddress: string
): Promise<TokenCreateCustomSmartContractResult> => {
  // sanitize params
  let sanitizeErr;
  if (hederaTokenAddresses.length === 0) {
    sanitizeErr = 'must have at least one token address to associate';
  } else if (!isAddress(associtingAccountAddress)) {
    sanitizeErr = 'associating account address is invalid';
  }
  let invalidTokens = [] as any;
  hederaTokenAddresses.forEach((address) => {
    if (!isAddress(address.trim())) {
      invalidTokens.push(address);
    }
  });

  if (invalidTokens.length > 0) {
    sanitizeErr = { invalidTokens };
  }

  if (sanitizeErr) {
    console.error(sanitizeErr);
    return { err: sanitizeErr };
  }

  try {
    let tx;
    if (hederaTokenAddresses.length === 1) {
      tx = await baseContract.associateTokenPublic(
        associtingAccountAddress,
        hederaTokenAddresses[0],
        {
          gasLimit: 1_000_000,
        }
      );
    } else {
      tx = await baseContract.associateTokensPublic(
        associtingAccountAddress,
        hederaTokenAddresses,
        {
          gasLimit: 1_000_000,
        }
      );
    }

    const txReceipt = await tx.wait();

    return { transactionHash: txReceipt.hash };
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev grants token KYC to an account
 *
 * @dev integrates tokenCreateCustomContract.grantTokenKycPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param hederaTokenAddress: string
 *
 * @param grantingKYCAccountAddress: string
 *
 * @return Promise<TokenCreateCustomSmartContractResult>
 */
export const grantTokenKYCToAccount = async (
  baseContract: Contract,
  hederaTokenAddress: string,
  grantingKYCAccountAddress: string
): Promise<TokenCreateCustomSmartContractResult> => {
  // sanitize params
  let sanitizeErr;
  if (!isAddress(hederaTokenAddress)) {
    sanitizeErr = 'invalid Hedera token address';
  } else if (!isAddress(grantingKYCAccountAddress)) {
    sanitizeErr = 'invalid associating account address';
  }

  if (sanitizeErr) {
    console.error(sanitizeErr);
    return { err: sanitizeErr };
  }

  try {
    const tx = await baseContract.grantTokenKycPublic(
      hederaTokenAddress,
      grantingKYCAccountAddress,
      { gasLimit: 1_000_000 }
    );

    const txReceipt = await tx.wait();

    return { transactionHash: txReceipt.hash };
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};
