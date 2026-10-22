// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract TransactionInfo {

    constructor() payable {}

    /// gas still available to execution
    function getGasLeft() external view returns (uint256 result) {
        assembly{
            result := gas()
        }
    }
    
    /// address of the current contract / execution context
    function getContractAddress() external view returns (address addr) {
        assembly {
            addr := address()
        }
    }

    /// get wei balance at address a
    function getBalance(address a) external view returns (uint256 bal) {
        assembly {
            bal := balance(a)
        }
    }

    /// get self balance - equivalent to balance(address()), but cheaper
    function getSelfBalance() external view returns (uint256 bal) {
        assembly {
            bal := selfbalance()
        }
    }

    /// get call sender
    function getMsgCaller() external view returns (address msgCaller) {
        assembly {
            msgCaller := caller()
        }
    }

    /// get wei sent together with the current call
    event CallValue(uint256 callBalance);
    function getCallValue() external payable {
        uint256 callBalance;
        assembly {
            callBalance := callvalue()
        }
        emit CallValue(callBalance);
    }
    
    /// call msg.data starting from position p (32 bytes)
    /// msg.data is a byte array that contains the function arguments encoded according to the function's signature.
    function getCallDataLoad(uint256 p) external pure returns (bytes32 data) {
        assembly {
            data := calldataload(p)
        }
    }

    /// size of call data in bytes
    function getCallDataSize() external pure returns (uint256 datasize) {
        assembly {
            datasize := calldatasize()
        }
    }

    /// calldatacopy(t, f, s) - copy `s` bytes from calldata at position `f` to memory at position `t`
    function callDataCopier(uint256 t, uint256 f, uint256 s) external pure returns (bytes32 data) {
        assembly {
            calldatacopy(t, f, s)
            data := mload(t)
        }
    }

    /// chainid() - ID of the executing chain
    function getChainId() external view returns (uint256 chainId) {
        assembly {
            chainId := chainid()
        }
    }

    /// origin() - transaction sender
    function getOrigin() external view returns (address originSender) {
        assembly{
            originSender := origin()
        }
    }

    /// gasprice() - gas price of the transaction
    function getGasPrice() external view returns (uint256 gasPrice) {
        assembly {
            gasPrice := gasprice()
        }
    }

    /// coinbase() - current mining beneficiary
    function getCoinbase() external view returns (address beneficiary) {
        assembly {
            beneficiary := coinbase()
        }
    }

    /// timestamp() - timestamp of the current block in seconds since the epoch
    function getTimestamp() external view returns (uint256 currentTimestamp) {
        assembly {
            currentTimestamp := timestamp()
        }
    }

    /// number() - current block number
    function getCurrentBlockNumber() external view returns (uint256 blockNumber) {
        assembly {
            blockNumber := number()
        }
    }

    /// gaslimit() - block gas limit of the current block
    function getGasLimit() external view returns (uint256 gasLimit) {
        assembly {
            gasLimit := gaslimit()
        }
    }
}

