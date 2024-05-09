// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

contract EmptyContract {
    address public owner;
    constructor(){
        emit DeployedContract0Address(address(this));
    }

    event DeployedContract0Address(address);
}

contract Deploys1Contract {
    address public owner;
    EmptyContract  public childContract;

    constructor() {
        owner = msg.sender;
        childContract = new EmptyContract();
        emit DeployedContract1Address(address(this));
    }

        event DeployedContract1Address(address);
}

contract ChainedContracts {
    address public owner;
    Deploys1Contract  public childContract;

    constructor() {
        owner = msg.sender;
       childContract = new Deploys1Contract();
    emit DeployedContract2Address(address(this));
    }

    event DeployedContract2Address(address);
}

contract Deploys2Contracts {
    address public owner;
    Deploys1Contract  public childContract1;
    EmptyContract public childContract2;

    constructor() {
        owner = msg.sender;
       childContract1 = new Deploys1Contract();
       childContract2 = new EmptyContract();
    emit Deploys2ContractsAddress(address(this));
    }

    event Deploys2ContractsAddress(address);
}
