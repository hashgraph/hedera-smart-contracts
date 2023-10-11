# Source code documentation

## Codebase Walkthrough - **\_\_tests\_\_** folder

### a. Overview

The DApp employs the Jest testing framework, with its unit tests organized within the `__tests__/` directory.

**_Note_**: It's important to note that the structure of the `__tests__/` folder is designed to closely resemble that of the `src/api/` folder, with the exception of certain API folders that are primarily focused on client-browser interactions.

Here is a breakdown of the **\_\_tests\_\_** folders:

- `ethers/` folder: Contains unit tests for functionalities connected to the `ethers.js` library. This includes tasks such as contract deployment, the generation of `ethers.Contract` instances, and related operations.

- `hedera/` folder: Comprises unit tests that pertain to interactions with Hedera System Contracts. It covers a range of tests related to these contract interactions.

- `mirror-node/` folder: Encompasses unit tests related to the utilization of Restful APIs for communicating with Hedera's mirror nodes.

### b. Adding New Unit Tests

#### b1. Convention

- **Folder Structure**: Ensure that any newly added unit tests are placed in the correct folders. Whenever feasible, aim to align the structure of these tests with that of the `src/api/` folder.
- **API-Specific Folders**: Each API should possess its dedicated folder. Additionally, to maintain uniformity and alignment with the `jest` testing framework's naming conventions, the primary index file of each folder should be named `index.test.ts`.

#### b2. Mocking

Based on the different type of APIs, different mocking strategies are employed.

- **Restul APIs**: This project uses `axios` library to make restful APIs, so the unit test should mock the `Axios adapter` using `MockAdapter` from `axios-mock-adapter` library.

Below is an example showcasing how to achieve this:

```typescript
    const RestMock = new MockAdapter(axios);
    const expectedUrl = `https:...`
    const mockResponse = {...}
    RestMock.onGet(expectedUrl).reply(200, mockResponse)
```

- **Mocking External Libraries**: In the context of testing external libraries, the `jest` framework's `.mock` property is utilized. This feature enables the mock implementation of entire library modules, allowing for the assignment of predefined mock values to necessary methods.

Here's an example demonstrating the mock implementation of the `ethers.Contract` constructor within the project:

```typescript
// Mock the ethers.Contract constructor
jest.mock('ethers', () => {
  const actualEthers = jest.requireActual('ethers');
  return {
    ...actualEthers,
    Contract: jest.fn().mockImplementation(() => ({
      name: jest.fn().mockResolvedValue('Hedera'),
    })),
  };
});
```

- **Contract Interaction**: A fundamental functionality of the DApp involves interactions with smart contracts deployed on the blockchain. Therefore, in all unit tests within the `__tests__/hedera/` directory, you will encounter the mocking of a `baseContract` instance, which serves as a representation of the deployed contracts.

Below is a basic example of how a `baseContract` instance is mocked for an ERC20 contract:

```typescript
const expectedName = 'Onasium';
const expectedSymbol = 'ONAS';
const expectedDecimals = '8';
const expectedTotalSupply = '50000000000';

// Mocked baseContract object
const baseContract = {
  name: jest.fn().mockResolvedValue(expectedName),
  symbol: jest.fn().mockResolvedValue(expectedSymbol),
  totalSupply: jest.fn().mockResolvedValue(expectedTotalSupply),
  decimals: jest.fn().mockResolvedValue(expectedDecimals),
};
```

#### b3. Unit Testing Guidelines

- **Grouping Related Tests**: Unit tests that share a specific focus, such as testing a particular method, should be logically grouped within a `describe` block. This organizational approach enhances test readability and maintainability.

- **Comprehensive Testing**: Each unit test should comprehensively evaluate the targeted feature. This includes testing both successful execution cases and failure scenarios. This ensures thorough coverage and robustness in testing the code's behavior.
