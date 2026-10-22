// SPDX-License-Identifier: Apache-2.0

export interface ERCOutputInterface {
  address: string;
  contractId: string;
}

export interface ERC20OutputInterface extends ERCOutputInterface {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
}

export interface ERC721OutputInterface extends ERCOutputInterface {
  name: string;
  symbol: string;
}

export interface ERC1155OutputInterface extends ERCOutputInterface {}

export type TokenOutputInterface =
  | ERC20OutputInterface
  | ERC721OutputInterface
  | ERC1155OutputInterface;

export interface ERCTokenInfoSelectors {
  type: string;
  field: string;
  sighash: string;
}
