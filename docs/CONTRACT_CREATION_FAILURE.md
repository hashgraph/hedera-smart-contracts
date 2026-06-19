# Contract Creation Failure Behavior

## Overview
This document describes the behavior of contract creation failures in the Hedera Smart Contracts system, specifically addressing the inconsistency between record files and blocks when a contract creation fails with `CONTRACT_REVERT_EXECUTED`.

## Issue
Previously, when a contract creation failed with `CONTRACT_REVERT_EXECUTED`:
- Record files correctly did not contain a contract ID
- Block items incorrectly contained a contract ID
- This inconsistency could cause issues for applications relying on either record files or blocks

## Solution
The solution ensures consistent behavior between record files and blocks by:
1. Emitting a `ContractCreationFailed` event before reverting
2. Ensuring no contract ID is generated or stored in either record files or blocks
3. Maintaining the same behavior for both `create` and `create2` operations

## Implementation Details
- Added `ContractCreationFailed` event to track failed contract creations
- Modified contract creation logic to emit failure event before reverting
- Updated tests to verify consistent behavior
- Ensured both `create` and `create2` operations handle failures consistently

## Testing
The solution includes comprehensive tests that verify:
- Failed contract creation with `create` operation
- Failed contract creation with `create2` operation
- Consistent behavior between record files and blocks
- Proper event emission and transaction reversion

## Migration
No migration is required for existing contracts. The changes are backward compatible and only affect the internal handling of contract creation failures.

## References
- Issue #1280: Block item with Failed Contract Create Result contains a Contract ID
- HIP 1056: Block item with Failed Contract Create Result contains a Contract ID 