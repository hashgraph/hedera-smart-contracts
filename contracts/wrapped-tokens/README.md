:warning: :bangbang: ***All examples under this folder are exploration code and have NOT been audited. Use them at your own risk!*** :bangbang: :warning:

---

### WHBAR

The WHBAR contract for Wrapped HBAR to help transactions that use native token payments.

##### Properties:
- name - ```string``` "Wrapped HBAR"
- symbol - ```string``` "WHBAR"decimals
- decimals - ```uint8``` 8
- balanceOf - ``` mapping(address => uint256) balanceOf```
- allowance - ```mapping(address => mapping(address => uint256)) allowance```

##### Events:
- Approval - ```event Approval(address src, address guy, uint256 wad)```
- Transfer - ``` event Transfer(address src, address dst, uint256 wad)```
- Deposit - ``` event Deposit(address dst, uint256 wad)```
- Withdrawal - ``` event Withdrawal(address src, uint256 wad)```

##### Errors:
- InsufficientFunds - ```error InsufficientFunds()```
- InsufficientAllowance - ```error InsufficientAllowance()```

##### Methods:
- receive - ```receive() external payable```
- fallback - ```fallback() external payable```
- deposit - ```function deposit() external payable```
- withdraw - ```function withdraw(uint256 wad) external```
- totalSupply - ```function totalSupply() public view returns (uint256)```
- approve - ```function approve(address guy, uint256 wad) public returns (bool)```
- transfer - ```function transfer(address dst, uint256 wad) public returns (bool)```
- transferFrom - ```function transferFrom(address src, address dst, uint256 wad) public returns (bool)```
