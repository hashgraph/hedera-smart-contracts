// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract TargetContract {
    uint256 count;

    constructor(uint256 _count) {
        count = _count;
    }

    function setCount(uint256 _count) external {
        count = _count;
    }

    function getCount() external view returns (uint256) {
        return count;
    }
}


contract ContractCaller {
    uint256 public count;

    event CallResult(bool success);
    event CallReturnedData(uint256 count);

    /// call(g, a, v, in, insize, out, outsize)
    /// `g`: Amount of gas to be provided for the execution of called contract
    /// `a`: Address of the called contract
    /// `v`: callvalue() (a.k.a. msg.value)
    /// `in`: Input data that will be provided to the called contract
    /// `insize`: Input data size
    /// `out`: Output data produced by the called contract
    /// `outsize`: Output data size
    function call(uint256 gasLimit, address payable _targetContractAddress, bytes memory input) external payable {
        bool success;
        uint256 returnedData;

        assembly {
            let returnedDataPlaceholder := mload(0x40) // load the data at free memory pointer
            
            success := call(gasLimit, _targetContractAddress, callvalue(), add(input, 0x20), mload(input), returnedDataPlaceholder, 0x20)
            
            returnedData := mload(returnedDataPlaceholder)
        }

        emit CallResult(success);
        emit CallReturnedData(returnedData);
    }

    /// staticcall(g, a, in, insize, out, outsize) - identical to `call` but do not allow state modifications
    /// `g`: Amount of gas to be provided for the execution of called contract
    /// `a`: Address of the called contract
    /// `in`: Input data that will be provided to the called contract
    /// `insize`: Input data size
    /// `out`: Output data produced by the called contract
    /// `outsize`: Output data size
    function staticcall(uint256 gasLimit, address payable _targetContractAddress, bytes memory input) external {
        bool success;
        uint256 returnedData;

        assembly {
            let returnedDataPlaceholder := mload(0x40) // load the data at free memory pointer
            
            success := staticcall(gasLimit, _targetContractAddress, add(input, 0x20), mload(input), returnedDataPlaceholder, 0x20)
            
            returnedData := mload(returnedDataPlaceholder)
        }

        emit CallResult(success);
        emit CallReturnedData(returnedData);
    }


    /// callcode(g, a, v, in, insize, out, outsize) - identical to `call` but only use the code from a and stay in the context of the current contract otherwise
    /// `g`: Amount of gas to be provided for the execution of called contract
    /// `a`: Address of the called contract
    /// `in`: Input data that will be provided to the called contract
    /// `insize`: Input data size
    /// `out`: Output data produced by the called contract
    /// `outsize`: Output data size
    function callCode(uint256 gasLimit, address payable _targetContractAddress, bytes memory input) external payable {
        bool success;
        assembly {
            /// @notice callcode uses the code from `_targetContractAddress` to update current contract's states
            success := callcode(gasLimit, _targetContractAddress, callvalue(), add(input, 0x20), mload(input), 0, 0)
        }
        emit CallResult(success);
    }

    /// delegatecall(g, a, in, insize, out, outsize) - identical to `callcode` but also keep caller and callvalue 
    /// `g`: Amount of gas to be provided for the execution of called contract
    /// `a`: Address of the called contract
    /// `in`: Input data that will be provided to the called contract
    /// `insize`: Input data size
    /// `out`: Output data produced by the called contract
    /// `outsize`: Output data size
    function delegateCall(uint256 gasLimit, address payable _targetContractAddress, bytes memory input) external {
        bool success;
        assembly {
            /// @notice delegatecall uses the code from `_targetContractAddress` to update current contract's states
            success := delegatecall(gasLimit, _targetContractAddress, add(input, 0x20), mload(input), 0, 0)
        }
        emit CallResult(success);
    }
}
