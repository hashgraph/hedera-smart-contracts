// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

// note from EIP-6780
// When SELFDESTRUCT is executed in the same transaction as the contract was created:
//      - SELFDESTRUCT continues to behave as it did prior to EIP-6780, this includes the following actions
//          - SELFDESTRUCT deletes data as previously specified.
//          - SELFDESTRUCT transfers the entire account balance to the target
//          - The account balance of the contact calling SELFDESTRUCT is set to 0.
//      - Note that if the target is the same as the contract calling SELFDESTRUCT that Ether will be burnt.
//      - Note that no refund is given since EIP-3529.
//      - Note that the rules of EIP-2929 regarding SELFDESTRUCT remain unchanged.
contract SelfDestructInSameCreateTx {
    constructor(address payable _target) payable {
        // Transfer all contract balance to the target and self-destruct
        selfdestruct(_target);
    }
}
contract SelfDestructInSameCreateTxSameTarget {
     constructor() payable {
        // Transfer all contract balance to the target and self-destruct
        selfdestruct(payable(address(this)));
    }
}

// note from EIP-6780
// When SELFDESTRUCT is executed in a transaction that is not the same as the contract calling SELFDESTRUCT was created:
//      - The current execution frame halts.
//      - SELFDESTRUCT does not delete any data (including storage keys, code, or the account itself).
//      - SELFDESTRUCT transfers the entire account balance to the target.
//      - Note that if the target is the same as the contract calling SELFDESTRUCT there is no net change in balances. Unlike the prior specification, Ether will not be burnt in this case.
//      - Note that no refund is given since EIP-3529.
//      - Note that the rules of EIP-2929 regarding SELFDESTRUCT remain unchanged.
contract SelfDestructInSeparateTx {
    constructor() payable{}
    function triggerSelfDestruct(address payable _target) public {
        // Transfer all contract balance to the target
        selfdestruct(_target);
    }
}



