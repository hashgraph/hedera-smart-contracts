// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;


interface ContractInterface {
  function sumThemUp (int a, int b) external returns (int);
}

contract Functions is ContractInterface {
    uint myInteger;
    address messageFrameAddresses;
    address addr;
    string str;
    uint num;
    event MsgValue(uint256);

    function getMessage() internal pure returns (string memory) {
        return "Hello World";
    }

    function checkGasleft() external view returns (uint256) {
        return gasleft();
    }

    function checkGasleftFromExternalCall() external view returns (uint256) {
        return this.checkGasleft();
    }

    function deposit() public payable {}

    function notPayable() public {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function manyInputs(uint _num, address _addr, string memory _str) internal returns (bool) {
        num = _num;
        addr = _addr;
        str = _str;

        return true;
    }

    function manyInputsProxyCall() external returns (bool){
        return manyInputs({
            _str: 'string',
            _num: 12,
            _addr: address(this)
        });
    }

    function sumThemUp (int a, int) external pure override returns (int) {
        return a;
    }

}
