// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import '../../contracts/system-contracts/HederaResponseCodes.sol';
import '../../contracts/system-contracts/hedera-token-service/IHederaTokenService.sol';
import '../../contracts/system-contracts/hedera-token-service/KeyHelper.sol';
import './mocks/hts-precompile/HederaNonFungibleToken.sol';
import './mocks/hts-precompile/HtsSystemContractMock.sol';

import './utils/HederaNonFungibleTokenUtils.sol';
import '../../contracts/libraries/Constants.sol';

contract HederaNonFungibleTokenTest is HederaNonFungibleTokenUtils {

    // setUp is executed before each and every test function
    function setUp() public {
        _setUpHtsPrecompileMock();
        _setUpAccounts();
    }

    // positive cases
    function test_CreateHederaNonFungibleTokenViaHtsPrecompile() public {

        address sender = alice;
        string memory name = 'NFT A';
        string memory symbol = 'NFT-A';
        address treasury = bob;

        bool success;

        (success, ) = _doCreateHederaNonFungibleTokenViaHtsPrecompile(sender, name, symbol, treasury);
        assertEq(success, false, "expected failure since treasury is not sender");

        treasury = alice;

        (success, ) = _doCreateHederaNonFungibleTokenViaHtsPrecompile(sender, name, symbol, treasury);
        assertEq(success, true, "expected success since treasury is sender");

    }

    function test_CreateHederaNonFungibleTokenDirectly() public {

        address sender = alice;
        string memory name = 'NFT A';
        string memory symbol = 'NFT-A';
        address treasury = bob;

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](0);

        bool success;

        (success, ) = _doCreateHederaNonFungibleTokenDirectly(sender, name, symbol, treasury, keys);
        assertEq(success, false, "expected failure since treasury is not sender");

        treasury = alice;

        (success, ) = _doCreateHederaNonFungibleTokenDirectly(sender, name, symbol, treasury, keys);
        assertEq(success, true, "expected success since treasury is sender");

    }

    function test_ApproveViaHtsPrecompile() public {

        bytes[] memory NULL_BYTES = new bytes[](1);

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = KeyHelper.getSingleKey(KeyHelper.KeyType.SUPPLY, KeyHelper.KeyValueType.CONTRACT_ID, alice);
        address tokenAddress = _createSimpleMockNonFungibleToken(alice, keys);

        bool success;

        MintResponse memory mintResponse;
        MintParams memory mintParams;

        mintParams = MintParams({
            sender: bob,
            token: tokenAddress,
            mintAmount: 0
        });

        mintResponse = _doMintViaHtsPrecompile(mintParams);
        assertEq(mintResponse.success, false, "expected failure since bob is not supply key");

        mintParams = MintParams({
            sender: alice,
            token: tokenAddress,
            mintAmount: 0
        });

        mintResponse = _doMintViaHtsPrecompile(mintParams);
        assertEq(mintResponse.success, true, "expected success since alice is supply key");

        success = _doAssociateViaHtsPrecompile(bob, tokenAddress);
        assertEq(success, true, "bob should have associated with token");

        ApproveNftParams memory approveNftParams;

        approveNftParams = ApproveNftParams({
            sender: bob,
            token: tokenAddress,
            spender: carol,
            serialId: mintResponse.serialId
        });

        success = _doApproveNftViaHtsPrecompile(approveNftParams);
        assertEq(success, false, "should have failed as bob does not own NFT with serialId");

        approveNftParams = ApproveNftParams({
            sender: alice,
            token: tokenAddress,
            spender: carol,
            serialId: mintResponse.serialId
        });

        success = _doApproveNftViaHtsPrecompile(approveNftParams);
        assertEq(success, true, "should have succeeded as alice does own NFT with serialId");
    }

    function test_ApproveDirectly() public {

        bytes[] memory NULL_BYTES = new bytes[](1);

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = KeyHelper.getSingleKey(KeyHelper.KeyType.SUPPLY, KeyHelper.KeyValueType.CONTRACT_ID, alice);
        address tokenAddress = _createSimpleMockNonFungibleToken(alice, keys);

        bool success;

        MintResponse memory mintResponse;
        MintParams memory mintParams;

        mintParams = MintParams({
            sender: alice,
            token: tokenAddress,
            mintAmount: 0
        });

        mintResponse = _doMintViaHtsPrecompile(mintParams);
        assertEq(mintResponse.success, true, "expected success since alice is supply key");

        success = _doAssociateViaHtsPrecompile(bob, tokenAddress);
        assertEq(success, true, "bob should have associated with token");

        ApproveNftParams memory approveNftParams;

        approveNftParams = ApproveNftParams({
            sender: bob,
            token: tokenAddress,
            spender: carol,
            serialId: mintResponse.serialId
        });

        success = _doApproveNftDirectly(approveNftParams);
        assertEq(success, false, "should have failed as bob does not own NFT with serialId");

        approveNftParams = ApproveNftParams({
            sender: alice,
            token: tokenAddress,
            spender: carol,
            serialId: mintResponse.serialId
        });

        success = _doApproveNftDirectly(approveNftParams);
        assertEq(success, true, "should have succeeded as alice does own NFT with serialId");
    }

    function test_TransferViaHtsPrecompile() public {

        bytes[] memory NULL_BYTES = new bytes[](1);

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = KeyHelper.getSingleKey(KeyHelper.KeyType.SUPPLY, KeyHelper.KeyValueType.CONTRACT_ID, alice);
        address tokenAddress = _createSimpleMockNonFungibleToken(alice, keys);

        bool success;
        uint256 serialIdU256;

        MintResponse memory mintResponse;
        MintParams memory mintParams;

        mintParams = MintParams({
            sender: alice,
            token: tokenAddress,
            mintAmount: 0
        });

        mintResponse = _doMintViaHtsPrecompile(mintParams);
        serialIdU256 = uint64(mintResponse.serialId);

        assertEq(mintResponse.success, true, "expected success since alice is supply key");

        success = _doAssociateViaHtsPrecompile(bob, tokenAddress);
        assertEq(success, true, "bob should have associated with token");

        TransferParams memory transferParams;

        transferParams = TransferParams({
            sender: bob,
            token: tokenAddress,
            from: alice,
            to: carol,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferViaHtsPrecompile(transferParams);
        assertEq(success, false, 'expected fail since bob does not own nft or have approval');

        transferParams = TransferParams({
            sender: alice,
            token: tokenAddress,
            from: alice,
            to: carol,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferViaHtsPrecompile(transferParams);
        assertEq(success, false, 'expected fail since carol is not associated with nft');

        transferParams = TransferParams({
            sender: alice,
            token: tokenAddress,
            from: alice,
            to: bob,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferViaHtsPrecompile(transferParams);
        assertEq(success, true, 'expected success');
    }

    function test_TransferDirectly() public {

        bytes[] memory NULL_BYTES = new bytes[](1);

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = KeyHelper.getSingleKey(KeyHelper.KeyType.SUPPLY, KeyHelper.KeyValueType.CONTRACT_ID, alice);
        address tokenAddress = _createSimpleMockNonFungibleToken(alice, keys);

        bool success;
        uint256 serialIdU256;

        MintResponse memory mintResponse;
        MintParams memory mintParams;

        mintParams = MintParams({
            sender: alice,
            token: tokenAddress,
            mintAmount: 0
        });

        mintResponse = _doMintViaHtsPrecompile(mintParams);
        serialIdU256 = uint64(mintResponse.serialId);

        assertEq(mintResponse.success, true, "expected success since alice is supply key");

        success = _doAssociateViaHtsPrecompile(bob, tokenAddress);
        assertEq(success, true, "bob should have associated with token");

        TransferParams memory transferParams;

        transferParams = TransferParams({
            sender: bob,
            token: tokenAddress,
            from: alice,
            to: carol,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferDirectly(transferParams);
        assertEq(success, false, 'expected fail since bob does not own nft or have approval');

        transferParams = TransferParams({
            sender: alice,
            token: tokenAddress,
            from: alice,
            to: carol,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferDirectly(transferParams);
        assertEq(success, false, 'expected fail since carol is not associated with nft');

        transferParams = TransferParams({
            sender: alice,
            token: tokenAddress,
            from: alice,
            to: bob,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferDirectly(transferParams);
        assertEq(success, true, 'expected success');
    }

    function test_TransferUsingAllowanceViaHtsPrecompile() public {

        bytes[] memory NULL_BYTES = new bytes[](1);

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = KeyHelper.getSingleKey(KeyHelper.KeyType.SUPPLY, KeyHelper.KeyValueType.CONTRACT_ID, alice);
        address tokenAddress = _createSimpleMockNonFungibleToken(alice, keys);

        bool success;
        uint256 serialIdU256;

        MintResponse memory mintResponse;
        MintParams memory mintParams;

        TransferParams memory transferParams;

        ApproveNftParams memory approveNftParams;

        mintParams = MintParams({
            sender: alice,
            token: tokenAddress,
            mintAmount: 0
        });

        mintResponse = _doMintViaHtsPrecompile(mintParams);
        serialIdU256 = uint64(mintResponse.serialId);

        assertEq(mintResponse.success, true, "expected success since alice is supply key");

        transferParams = TransferParams({
            sender: carol,
            token: tokenAddress,
            from: alice,
            to: bob,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferViaHtsPrecompile(transferParams);
        assertEq(success, false, 'expected fail since carol is not approved');

        approveNftParams = ApproveNftParams({
            sender: alice,
            token: tokenAddress,
            spender: carol,
            serialId: mintResponse.serialId
        });

        _doApproveNftDirectly(approveNftParams);

        transferParams = TransferParams({
            sender: carol,
            token: tokenAddress,
            from: alice,
            to: bob,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferViaHtsPrecompile(transferParams);
        assertEq(success, false, 'expected fail since bob is not associated with nft');

        success = _doAssociateViaHtsPrecompile(bob, tokenAddress);
        assertEq(success, true, "bob should have associated with token");

        transferParams = TransferParams({
            sender: carol,
            token: tokenAddress,
            from: alice,
            to: bob,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferViaHtsPrecompile(transferParams);
        assertEq(success, true, 'expected success');
    }

    function test_TransferUsingAllowanceDirectly() public {

        bytes[] memory NULL_BYTES = new bytes[](1);

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = KeyHelper.getSingleKey(KeyHelper.KeyType.SUPPLY, KeyHelper.KeyValueType.CONTRACT_ID, alice);
        address tokenAddress = _createSimpleMockNonFungibleToken(alice, keys);

        bool success;
        uint256 serialIdU256;

        MintResponse memory mintResponse;
        MintParams memory mintParams;

        TransferParams memory transferParams;

        ApproveNftParams memory approveNftParams;

        mintParams = MintParams({
            sender: alice,
            token: tokenAddress,
            mintAmount: 0
        });

        mintResponse = _doMintViaHtsPrecompile(mintParams);
        serialIdU256 = uint64(mintResponse.serialId);

        assertEq(mintResponse.success, true, "expected success since alice is supply key");

        transferParams = TransferParams({
            sender: carol,
            token: tokenAddress,
            from: alice,
            to: bob,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferViaHtsPrecompile(transferParams);
        assertEq(success, false, 'expected fail since carol is not approved');

        approveNftParams = ApproveNftParams({
            sender: alice,
            token: tokenAddress,
            spender: carol,
            serialId: mintResponse.serialId
        });

        _doApproveNftDirectly(approveNftParams);

        transferParams = TransferParams({
            sender: carol,
            token: tokenAddress,
            from: alice,
            to: bob,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferDirectly(transferParams);
        assertEq(success, false, 'expected fail since bob is not associated with nft');

        success = _doAssociateViaHtsPrecompile(bob, tokenAddress);
        assertEq(success, true, "bob should have associated with token");

        transferParams = TransferParams({
            sender: carol,
            token: tokenAddress,
            from: alice,
            to: bob,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferDirectly(transferParams);
        assertEq(success, true, 'expected success');
    }

    /// @dev there is no test_CanBurnDirectly as the ERC20 standard does not typically allow direct burns
    function test_CanBurnViaHtsPrecompile() public {

        bytes[] memory NULL_BYTES = new bytes[](1);

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = KeyHelper.getSingleKey(KeyHelper.KeyType.SUPPLY, KeyHelper.KeyValueType.CONTRACT_ID, alice);
        address tokenAddress = _createSimpleMockNonFungibleToken(alice, keys);

        bool success;
        uint256 serialIdU256;

        MintResponse memory mintResponse;
        MintParams memory mintParams;
        BurnParams memory burnParams;

        mintParams = MintParams({
            sender: alice,
            token: tokenAddress,
            mintAmount: 0
        });

        mintResponse = _doMintViaHtsPrecompile(mintParams);
        serialIdU256 = uint64(mintResponse.serialId);

        assertEq(mintResponse.success, true, "expected success since alice is supply key");

        success = _doAssociateViaHtsPrecompile(bob, tokenAddress);
        assertEq(success, true, "bob should have associated with token");

        TransferParams memory transferParams;

        transferParams = TransferParams({
            sender: alice,
            token: tokenAddress,
            from: alice,
            to: bob,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferDirectly(transferParams);
        assertEq(success, true, 'expected success');

        burnParams = BurnParams({
            sender: alice,
            token: tokenAddress,
            amountOrSerialNumber: mintResponse.serialId
        });

        (success, ) = _doBurnViaHtsPrecompile(burnParams);
        assertEq(success, false, "burn should fail, since treasury does not own nft");

        transferParams = TransferParams({
            sender: bob,
            token: tokenAddress,
            from: bob,
            to: alice,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferDirectly(transferParams);
        assertEq(success, true, 'expected success');

        burnParams = BurnParams({
            sender: alice,
            token: tokenAddress,
            amountOrSerialNumber: mintResponse.serialId
        });

        (success, ) = _doBurnViaHtsPrecompile(burnParams);
        assertEq(success, true, "burn should succeed");
    }

    function test_CanAssociateAndDissociateDirectly() public {

        bytes[] memory NULL_BYTES = new bytes[](1);

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = KeyHelper.getSingleKey(KeyHelper.KeyType.SUPPLY, KeyHelper.KeyValueType.CONTRACT_ID, alice);
        address tokenAddress = _createSimpleMockNonFungibleToken(alice, keys);

        bool success;
        uint256 serialIdU256;

        MintResponse memory mintResponse;
        MintParams memory mintParams;
        BurnParams memory burnParams;

        mintParams = MintParams({
            sender: alice,
            token: tokenAddress,
            mintAmount: 0
        });

        mintResponse = _doMintViaHtsPrecompile(mintParams);
        serialIdU256 = uint64(mintResponse.serialId);

        assertEq(mintResponse.success, true, "expected success since alice is supply key");

        success = _doAssociateDirectly(bob, tokenAddress);
        assertEq(success, true, 'expected bob to associate with token');

        TransferParams memory transferFromAliceToBob;
        TransferParams memory transferFromBobToAlice;

        transferFromAliceToBob = TransferParams({
            sender: alice,
            token: tokenAddress,
            from: alice,
            to: bob,
            amountOrSerialNumber: serialIdU256
        });

        transferFromBobToAlice = TransferParams({
            sender: bob,
            token: tokenAddress,
            from: bob,
            to: alice,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferDirectly(transferFromAliceToBob);
        assertEq(success, true, 'expected success');

        success = _doDissociateDirectly(bob, tokenAddress);
        assertEq(success, false, 'expected bob to not dissociate with token while postive balance');

        (success, ) = _doTransferDirectly(transferFromBobToAlice);
        assertEq(success, true, 'expected transfer to succeed');

        success = _doDissociateDirectly(bob, tokenAddress);
        assertEq(success, true, 'expected bob to dissociate');

    }

    // negative cases
    function test_CannotApproveIfSpenderNotAssociated() public {
        /// @dev already demonstrated in some of the postive test cases
        // cannot approve spender if spender is not associated with HederaNonFungibleToken BOTH directly and viaHtsPrecompile
    }

    function test_CannotTransferIfRecipientNotAssociated() public {
        /// @dev already demonstrated in some of the postive test cases
        // cannot transfer to recipient if recipient is not associated with HederaNonFungibleToken BOTH directly and viaHtsPrecompile
    }

    function test_CannotRepeatedlyAssociateAndDissociateDirectly() public {
        bytes[] memory NULL_BYTES = new bytes[](1);

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = KeyHelper.getSingleKey(KeyHelper.KeyType.SUPPLY, KeyHelper.KeyValueType.CONTRACT_ID, alice);
        address tokenAddress = _createSimpleMockNonFungibleToken(alice, keys);

        bool success;
        uint256 serialIdU256;

        MintResponse memory mintResponse;
        MintParams memory mintParams;
        BurnParams memory burnParams;

        mintParams = MintParams({
            sender: alice,
            token: tokenAddress,
            mintAmount: 0
        });

        mintResponse = _doMintViaHtsPrecompile(mintParams);
        serialIdU256 = uint64(mintResponse.serialId);

        assertEq(mintResponse.success, true, "expected success since alice is supply key");

        TransferParams memory transferFromAliceToBob;
        TransferParams memory transferFromBobToAlice;

        transferFromAliceToBob = TransferParams({
            sender: alice,
            token: tokenAddress,
            from: alice,
            to: bob,
            amountOrSerialNumber: serialIdU256
        });

        transferFromBobToAlice = TransferParams({
            sender: bob,
            token: tokenAddress,
            from: bob,
            to: alice,
            amountOrSerialNumber: serialIdU256
        });

        (success, ) = _doTransferDirectly(transferFromAliceToBob);
        assertEq(success, false, 'expected transfer to fail since recipient is not associated with token');

        success = _doAssociateDirectly(bob, tokenAddress);
        assertEq(success, true, 'expected bob to associate with token');

        success = _doAssociateDirectly(bob, tokenAddress);
        assertEq(success, false, 'expected bob to not re-associate with already associated token');

        (success, ) = _doTransferDirectly(transferFromAliceToBob);
        assertEq(success, true, 'expected transfer to succeed');

        (success, ) = _doTransferDirectly(transferFromBobToAlice);
        assertEq(success, true, 'expected transfer to succeed');

        success = _doDissociateDirectly(bob, tokenAddress);
        assertEq(success, true, 'expected bob to dissociate with token');

        success = _doDissociateDirectly(bob, tokenAddress);
        assertEq(success, false, 'expected bob to not re-dissociate with already unassociated token');

        (success, ) = _doTransferDirectly(transferFromAliceToBob);
        assertEq(success, false, 'expected transfer to fail since bob is not associated');
    }
}

// forge test --match-contract HederaNonFungibleTokenTest --match-test test_TransferUsingAllowanceDirectly -vv
// forge test --match-contract HederaNonFungibleTokenTest -vv