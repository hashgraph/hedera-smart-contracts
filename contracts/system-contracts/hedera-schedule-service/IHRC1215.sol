// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;
pragma experimental ABIEncoderV2;

import "./IHederaScheduleService.sol";

interface IHRC1215 is IHederaScheduleService {

    /// Allows for the creation of a schedule transaction to schedule any contract call for a given smart contract
    /// address, expiration time, the gas limit for the future call, the value to send with that call
    /// and the call data to use.
    /// @param to the address of the smart contract for the future call
    /// @param expirySecond an expiration time of the future call
    /// @param gasLimit a maximum limit to the amount of gas to use for future call
    /// @param value an amount of tinybar sent via this future contract call
    /// @param callData the smart contract function to call. This MUST contain The application binary interface (ABI)
    /// encoding of the function call per the Ethereum contract ABI standard, giving the function signature and
    /// arguments being passed to the function.
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    /// @return scheduleAddress The address of the newly created schedule transaction.
    function scheduleCall(address to, uint256 expirySecond, uint256 gasLimit, uint64 value, bytes memory callData)
    external returns (int64 responseCode, address scheduleAddress);

    /// Allows for the creation of a schedule transaction to schedule any contract call for a given smart contract
    /// address, with a payer for the scheduled transaction, expiration time, the gas limit for the future call,
    /// the value to send with that call and the call data to use. The main difference with a scheduleCall is that
    /// via scheduleCallWithPayer a payer can be specified and the scheduled call can only execute after receiving
    /// enough valid signatures to activate the payer's key.
    /// Waits until the consensus second is not before `expirySecond` to execute.
    /// @param to the address of the smart contract for the future call
    /// @param payer an account identifier of a `payer` for the scheduled transaction
    /// @param expirySecond an expiration time of the future call
    /// @param gasLimit a maximum limit to the amount of gas to use for future call
    /// @param value an amount of tinybar sent via this future contract call
    /// @param callData the smart contract function to call. This MUST contain The application binary interface (ABI)
    /// encoding of the function call per the Ethereum contract ABI standard, giving the function signature and
    /// arguments being passed to the function.
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    /// @return scheduleAddress The address of the newly created schedule transaction.
    function scheduleCallWithPayer(address to, address payer, uint256 expirySecond, uint256 gasLimit, uint64 value, bytes memory callData)
    external returns (int64 responseCode, address scheduleAddress);

    /// Allows for the creation of a schedule transaction to schedule any contract call for a given smart contract
    /// address, with a payer for the scheduled transaction, expiration time, the gas limit for the future call,
    /// the value to send with that call and the call data to use.
    /// Executes as soon as the payer signs (unless consensus time is already past the `expirySecond`, of course).
    /// The difference between scheduleCallWithPayer() and executeCallOnPayerSignature() is that the former still waits
    /// until the consensus second is not before expirySecond to execute, while the latter executes as soon as the
    /// payer signs (unless consensus time is already past the expirySecond, of course).
    /// @param to the address of the smart contract for the future call
    /// @param payer an account identifier of a `payer` for the scheduled transaction
    /// @param expirySecond an expiration time of the future call
    /// @param gasLimit a maximum limit to the amount of gas to use for future call
    /// @param value an amount of tinybar sent via this future contract call
    /// @param callData the smart contract function to call. This MUST contain The application binary interface (ABI)
    /// encoding of the function call per the Ethereum contract ABI standard, giving the function signature and
    /// arguments being passed to the function.
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    /// @return scheduleAddress The address of the newly created schedule transaction.
    function executeCallOnPayerSignature(address to, address payer, uint256 expirySecond, uint256 gasLimit, uint64 value, bytes memory callData)
    external returns (int64 responseCode, address scheduleAddress);

    /// Delete the targeted schedule transaction.
    /// @param scheduleAddress the address of the schedule transaction.
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    function deleteSchedule(address scheduleAddress) external returns (int64 responseCode);

    /// Allows to check if the given second still has capacity to schedule a contract call with the specified gas limit.
    /// @param expirySecond an expiration time of the future call
    /// @param gasLimit a maximum limit to the amount of gas to use for future call
    /// @return hasCapacity returns `true` iff the given second still has capacity to schedule a contract call
    /// with the specified gas limit.
    function hasScheduleCapacity(uint256 expirySecond, uint256 gasLimit) view external returns (bool hasCapacity);
}
