from evmdasm import EvmBytecode
import sqlite3

precompile_selectors = {
    # cryptoTransfer(TokenTransferList[] memory tokenTransfers)
    '189a554c': 'ABI_ID_CRYPTO_TRANSFER',
    # cryptoTransfer(TransferList memory transferList, TokenTransferList[] memory tokenTransfers)
    '0e71804f': 'ABI_ID_CRYPTO_TRANSFER_V2',
    # mintToken(address token, uint64 amount, bytes[] memory metadata)
    '278e0b88': 'ABI_ID_MINT_TOKEN',
    # mintToken(address token, int64 amount, bytes[] memory metadata)
    'e0f4059a': 'ABI_ID_MINT_TOKEN_V2',
    # burnToken(address token, uint64 amount, int64[] memory serialNumbers)
    'acb9cff9': 'ABI_ID_BURN_TOKEN',
    # burnToken(address token, int64 amount, int64[] memory serialNumbers)
    'd6910d06': 'ABI_ID_BURN_TOKEN_V2',
    # associateTokens(address account, address[] memory tokens)
    '2e63879b': 'ABI_ID_ASSOCIATE_TOKENS',
    # associateToken(address account, address token)
    '49146bde': 'ABI_ID_ASSOCIATE_TOKEN',
    # dissociateTokens(address account, address[] memory tokens)
    '78b63918': 'ABI_ID_DISSOCIATE_TOKENS',
    # dissociateToken(address account, address token)
    '099794e8': 'ABI_ID_DISSOCIATE_TOKEN',
    # createFungibleToken(HederaToken memory token, uint initialTotalSupply, uint decimals)
    '7812a04b': 'ABI_ID_CREATE_FUNGIBLE_TOKEN',
    # createFungibleToken(HederaToken memory token, uint64 initialTotalSupply, uint32 decimals)
    'c23baeb6': 'ABI_ID_CREATE_FUNGIBLE_TOKEN_V2',
    # createFungibleToken(HederaToken memory token, int64 initialTotalSupply, int32 decimals)
    '0fb65bf3': 'ABI_ID_CREATE_FUNGIBLE_TOKEN_V3',
    # createFungibleTokenWithCustomFees(HederaToken memory token, uint initialTotalSupply, uint decimals, FixedFee[] memory fixedFees, FractionalFee[] memory fractionalFees)
    '4c381ae7': 'ABI_ID_CREATE_FUNGIBLE_TOKEN_WITH_FEES',
    # createFungibleTokenWithCustomFees(HederaToken memory token, uint64 initialTotalSupply, uint32 decimals, FixedFee[] memory fixedFees, FractionalFee[] memory fractionalFees)
    'b937581a': 'ABI_ID_CREATE_FUNGIBLE_TOKEN_WITH_FEES_V2',
    # createFungibleTokenWithCustomFees(HederaToken memory token, int64 initialTotalSupply, int32 decimals, FixedFee[] memory fixedFees, FractionalFee[] memory fractionalFees)
    '2af0c59a': 'ABI_ID_CREATE_FUNGIBLE_TOKEN_WITH_FEES_V3',
    # createNonFungibleToken(HederaToken memory token)
    '9dc711e0': 'ABI_ID_CREATE_NON_FUNGIBLE_TOKEN',
    # createNonFungibleToken(HederaToken memory token)
    # HederaToken field maxSupply updated to int64
    '9c89bb35': 'ABI_ID_CREATE_NON_FUNGIBLE_TOKEN_V2',
    # createNonFungibleToken(HederaToken memory token)
    'ea83f293': 'ABI_ID_CREATE_NON_FUNGIBLE_TOKEN_V3',
    # createNonFungibleTokenWithCustomFees(HederaToken memory token, FixedFee[] memory fixedFees, RoyaltyFee[] memory royaltyFees)
    '5bc7c0e6': 'ABI_ID_CREATE_NON_FUNGIBLE_TOKEN_WITH_FEES',
    # createNonFungibleTokenWithCustomFees(HederaToken memory token, FixedFee[] memory fixedFees, RoyaltyFee[] memory royaltyFees) HederaToken field maxSupply updated to int64
    '45733969': 'ABI_ID_CREATE_NON_FUNGIBLE_TOKEN_WITH_FEES_V2',
    # createNonFungibleTokenWithCustomFees(HederaToken memory token, FixedFee[] memory fixedFees, RoyaltyFee[] memory royaltyFees)
    'abb54eb5': 'ABI_ID_CREATE_NON_FUNGIBLE_TOKEN_WITH_FEES_V3',
    # transferTokens(address token, address[] memory accountId, int64[] memory amount)
    '82bba493': 'ABI_ID_TRANSFER_TOKENS',
    # transferToken(address token, address sender, address recipient, int64 amount)
    'eca36917': 'ABI_ID_TRANSFER_TOKEN',
    # transferNFTs(address token, address[] memory sender, address[] memory receiver, int64[] memory serialNumber)
    '2c4ba191': 'ABI_ID_TRANSFER_NFTS',
    # transferNFT(address token,  address sender, address recipient, int64 serialNum)
    '5cfc9011': 'ABI_ID_TRANSFER_NFT',
    # approve(address token, address spender, uint256 amount)
    'e1f21c67': 'ABI_ID_APPROVE',
    # transferFrom(address token, address from, address to, uint256 amount)
    '15dacbea': 'ABI_ID_TRANSFER_FROM',
    # allowance(address owner, address spender)
    'dd62ed3e': 'ABI_ID_ERC_ALLOWANCE',
    # approveNFT(address token, address to, uint256 tokenId)
    '7336aaf0': 'ABI_ID_APPROVE_NFT',
    # transferFromNFT(address token, address from, address to, uint256 serialNumber)
    '9b23d3d9': 'ABI_ID_TRANSFER_FROM_NFT',
    # getApproved(address token, uint256 tokenId)
    '098f2366': 'ABI_ID_GET_APPROVED',
    # setApprovalForAll(address token, address operator, bool approved)
    '367605ca': 'ABI_ID_SET_APPROVAL_FOR_ALL',
    # isApprovedForAll(address token, address owner, address operator)
    'f49f40db': 'ABI_ID_IS_APPROVED_FOR_ALL',
    # isFrozen(address token, address account)
    '46de0fb1': 'ABI_ID_IS_FROZEN',
    # isKyc(address token, address account)
    'f2c31ff4': 'ABI_ID_IS_KYC',
    # deleteToken(address token)
    'f069f712': 'ABI_ID_DELETE_TOKEN',
    # getTokenCustomFees(address token)
    'ae7611a0': 'ABI_ID_GET_TOKEN_CUSTOM_FEES',
    # getTokenDefaultFreezeStatus(address token)
    'a7daa18d': 'ABI_ID_GET_TOKEN_DEFAULT_FREEZE_STATUS',
    # getTokenDefaultKycStatus(address token)
    '335e04c1': 'ABI_ID_GET_TOKEN_DEFAULT_KYC_STATUS',
    # getTokenExpiryInfo(address token)
    'd614cdb8': 'ABI_ID_GET_TOKEN_EXPIRY_INFO',
    # getFungibleTokenInfo(address token)
    '3f28a19b': 'ABI_ID_GET_FUNGIBLE_TOKEN_INFO',
    # getTokenInfo(address token)
    '1f69565f': 'ABI_ID_GET_TOKEN_INFO',
    # getNonFungibleTokenInfo(address token, int64 serialNumber)
    '287e1da8': 'ABI_ID_GET_NON_FUNGIBLE_TOKEN_INFO',
    # getTokenKey(address token, uint tokenType)
    '3c4dd32e': 'ABI_ID_GET_TOKEN_KEY',
    # freezeToken(address token, address account)
    '5b8f8584': 'ABI_ID_FREEZE',
    # unfreezeToken(address token, address account)
    '52f91387': 'ABI_ID_UNFREEZE',
    # grantTokenKyc(address  token, address account)
    '8f8d7f99': 'ABI_ID_GRANT_TOKEN_KYC',
    # revokeTokenKyc(address token, address account)
    'af99c633': 'ABI_ID_REVOKE_TOKEN_KYC',
    # pauseToken(address token)
    '7c41ad2c': 'ABI_ID_PAUSE_TOKEN',
    # unpauseToken(address token)
    '3b3bff0f': 'ABI_ID_UNPAUSE_TOKEN',
    # wipeTokenAccount(address, address, uint32)
    '9790686d': 'ABI_WIPE_TOKEN_ACCOUNT_FUNGIBLE',
    # wipeTokenAccount(address, address, int64)
    'efef57f9': 'ABI_WIPE_TOKEN_ACCOUNT_FUNGIBLE_V2',
    # wipeTokenAccountNFT(address, address, int64[])
    'f7f38e26': 'ABI_WIPE_TOKEN_ACCOUNT_NFT',
    # updateTokenInfo(address token, HederaToken tokenInfo)
    '2cccc36f': 'ABI_ID_UPDATE_TOKEN_INFO',
    # updateTokenInfo(address token, HederaToken tokenInfo)
    '18370d34': 'ABI_ID_UPDATE_TOKEN_INFO_V2',
    # updateTokenInfo(address token, HederaToken tokenInfo)
    '7d305cfa': 'ABI_ID_UPDATE_TOKEN_INFO_V3',
    # updateTokenExpiryInfo(address token, Expiry expiryInfoStruct)
    '593d6e82': 'ABI_ID_UPDATE_TOKEN_EXPIRY_INFO',
    # updateTokenExpiryInfo(address token, Expiry expiryInfoStruct)
    'd27be6cd': 'ABI_ID_UPDATE_TOKEN_EXPIRY_INFO_V2',
    # updateTokenKeys(address token, TokenKey [])
    '6fc3cbaf': 'ABI_ID_UPDATE_TOKEN_KEYS',
    # isToken(address token)
    '19f37361': 'ABI_ID_IS_TOKEN',
    # getTokenType(address token)
    '93272baf': 'ABI_ID_GET_TOKEN_TYPE',
    # redirectForToken(address token, bytes memory data)
    '618dc65e': 'ABI_ID_REDIRECT_FOR_TOKEN',
}

def detect_system_contract_operations(bytecode):
    call_detected = False
    address_detected = False
    method_detected = False

    evm_bytecode = EvmBytecode(bytecode)
    disassembled_code = evm_bytecode.disassemble()
    selectors = []
    for instruction in disassembled_code:
        if instruction.name == 'CALL':
            call_detected = True
        if instruction.name[:4] != 'PUSH':
            continue
        if instruction.operand == '0167':
            address_detected = True
        if instruction.operand in precompile_selectors.keys():
            selectors.append(instruction.operand)
            method_detected = True

    return call_detected and address_detected and method_detected, selectors

def main():
    con = sqlite3.connect("mainnet-public.sqlite")
    cur = con.cursor()

    total = 0
    uniqueContracts = 0
    parsedSelectors = {}
    for row in cur.execute("SELECT * FROM contracts ORDER BY contract_id DESC"):
        total += 1
        hasPrecompileCall, selectors = detect_system_contract_operations(row[3] if len(row[2]) == 2 else row[2])
        if hasPrecompileCall:
            uniqueContracts += 1
            for selector in selectors:
                parsedSelectors[selector] = parsedSelectors.get(selector, 0) + 1

    print("Total: ", total)
    print("Unique contracts with at least 1 precompile call: ", uniqueContracts)
    print()

    for key, value in dict(sorted(parsedSelectors.items(), key=lambda item: item[1], reverse=True)).items():
        print(precompile_selectors[key], key, value)

if __name__ == "__main__":
    main()
