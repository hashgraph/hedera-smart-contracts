:warning: :bangbang: All examples under this folder are exploration code and have NOT been audited. Use them at your own risk! :bangbang: :warning:

---

# Layer Zero examples

### OApp

Message-passing interface to send and receive arbitrary pieces of data between contracts existing on different chains.

##### Action steps:

- Deploying the oapp contract on each network we're going to interact

- In order to connect oapps together, we need to set the peer of the target oapp, more info can be found here https://docs.layerzero.network/v2/developers/evm/getting-started#connecting-your-contracts

- Now, we're sending messages from one chain to another and vice versa

- Wait a couple of minutes, the LZ progress can be tracked on https://testnet.layerzeroscan.com/tx/<tx_hash>

- Finally we're checking whether the messages are received on both chains

### OFT

Allows fungible tokens to be transferred across multiple chains.

##### Action steps:

- Deploying OFT tokens which under the hood are ERC20s and contain the messaging between chains functionality provided by LZ

- In order to connect OFTs together, we need to set the peer of the target OFT, more info can be found here https://docs.layerzero.network/v2/developers/evm/getting-started#connecting-your-contracts

- Now, we're sending tokens between chains. That means we're burning tokens on the source chain and minting new ones on the destination chain

- Wait a couple of minutes, the LZ progress can be tracked on https://testnet.layerzeroscan.com/tx/<tx_hash>

- Finally we're checking whether the token balances are as expected on both the source and destination chains.

### OFT Adapter

If your token already exists on the chain you want to connect, you can deploy the OFT Adapter contract to act as an intermediary lockbox for the token.

##### Action steps:

- Deploying ERC20 tokens on each chain

- Deploying an OFT Adapters which will be used as a lockbox of ERC20s deployed the step above, you can use an already existing HTS token as well

- In order to connect OFT Adapters together, we need to set the peer of the target OFT Adapter, more info can be found here https://docs.layerzero.network/v2/developers/evm/getting-started#connecting-your-contracts

- We're funding the Adapter on both chains with some liquidity and after that we're approving it to spend the signer's token

- Now, we're sending already existing tokens that are used by OFT Adapter between different chains

- Wait a couple of minutes, the LZ progress can be tracked on https://testnet.layerzeroscan.com/tx/<tx_hash>

- Finally we're checking the balances on each chain

### ONFT

Allows non-fungible tokens to be transferred across multiple chains.

##### Action steps:

- Deploying ONFT tokens which under the hood are ERC721s and contain the messaging between chains functionality provided by LZ

- In order to connect ONFTs together, we need to set the peer of the target ONFT, more info can be found here https://docs.layerzero.network/v2/developers/evm/getting-started#connecting-your-contracts

- Now, we're sending NFTs between chains. That means we're burning the NFT on the source chain and minting new one on the destination chain

- Wait a couple of minutes, the LZ progress can be tracked on https://testnet.layerzeroscan.com/tx/<tx_hash>

- Finally we're checking whether the NFTs are transferred successfully

### ONFT Adapter

If your NFT contract already exists on the chain you want to connect, you can deploy the ONFT Adapter contract to act as an intermediary lockbox.

##### Action steps:

- Deploying ERC721s on each chain we want to connect

- Deploying an ONFT Adapter which will be used as a lockbox of ERC721s deployed the step above

- In order to connect ONFT Adapters together, we need to set the peer of the target ONFT Adapter, more info can be found here https://docs.layerzero.network/v2/developers/evm/getting-started#connecting-your-contracts

- First, we have to mint some NFTs on each chain

- Then, we have to approve the Adapter to be able to spend the NFT we want to send to another chain

- Now, we're sending already existing NFTs between chains

- Wait a couple of minutes, the LZ progress can be tracked on https://testnet.layerzeroscan.com/tx/<tx_hash>

- Finally we're checking whether the NFTs are transferred successfully

### HTS Connector

That's a variant of OFT but using an HTS token. Due to several incompatibilities between ERC20 and HTS tokens, we're not able to use them out of the box. All of them are described in the "HTS Adapter vs HTS Connector" section below.

##### Action steps:

- Deploying OFT on an EVM chain and HTS Connector on the Hedera chain. The HTS Connector extends OFTCore and creates HTS token within its constructor. Also, overrides OFTCore _debit and _credit with related HTS mint and burn precompile calls

- In order to connect OFTs together, we need to set the peer of the target OFT, more info can be found here https://docs.layerzero.network/v2/developers/evm/getting-started#connecting-your-contracts

- Approving HTS Connector to use some signer's tokens

- Now, we're sending tokens from an EVM chain to Hedera and receiving HTS tokens and vice versa

- Wait a couple of minutes, the LZ progress can be tracked on https://testnet.layerzeroscan.com/tx/<tx_hash>

Finally we're checking whether the balances are expected on both source and destination chains

### HTS Connector for existing HTS token

That's a variant of OFT but using an already existing HTS token. Keep in mind that "supply key" of the token must contains the HTS Connector contract's address.

##### Action steps:

- Create an HTS token

- Deploying OFT on an EVM chain and HTS Connector on the Hedera chain. The HTS Connector for existing token extends OFTCore and receives the HTS tokens address as constructor parameter. Also, overrides OFTCore _debit and _credit with related HTS mint and burn precompile calls

- In order to connect OFTs together, we need to set the peer of the target OFT, more info can be found here https://docs.layerzero.network/v2/developers/evm/getting-started#connecting-your-contracts

- Adding the HTSConnectorExistingToken contract's address as a supply key of the existing HTS token

- Funding the HTSConnectorExistingToken contract

- Approving HTS Connector to use some signer's tokens

- Now, we're sending tokens from an EVM chain to Hedera and receiving HTS tokens and vice versa

- Wait a couple of minutes, the LZ progress can be tracked on https://testnet.layerzeroscan.com/tx/<tx_hash>

- Finally we're checking whether the balances are expected on both source and destination chains

### Useful information:
- The addresses of endpoints [here](https://github.com/hashgraph/hedera-json-rpc-relay/blob/1030-lz-setup/tools/layer-zero-example/hardhat.config.js#L60) are the official LZ endpoints. A entire list of LZ supported endpoints can be found on https://docs.layerzero.network/v2/developers/evm/technical-reference/deployed-contracts.

### HTS Adapter vs HTS Connector
- You could use a HTS Adapter when you already have an existing HTS token on the fly.
- You could use a HTS Connector when you want to create a new token.
- You could use a HTS Connector with the existing HTS token but you have to add the HTS Connector contract as the Supply Key of the HTS token in order to execute the needed burnToken/mintToken precompile calls.
- The main reason of using a HTS Connector instead of HTS Adapter is to avoid liquidity logic.
