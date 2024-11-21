const axios = require('axios');
const fs = require('fs');

// Mirror Node API Base URL for Hedera
const MIRROR_NODE_API = 'https://testnet.mirrornode.hedera.com'; // You can change 'testnet' to 'mainnet' for mainnet contracts
const JSON_FILE_PATH = 'erc_contracts.json'; // JSON file to store results

// ERC-20 and ERC-721 function signatures
const ERC20_FUNCTION_SIGNATURES = [
  '70a08231', // balanceOf
  'a9059cbb', // transfer
  'dd62ed3e', // allowance
  '095ea7b3', // approve
  '18160ddd', // totalSupply
  '313ce567', // decimals
  '06fdde03', // name
];

const ERC721_FUNCTION_SIGNATURES = [
  '6352211e', // ownerOf
  '42842e0e', // safeTransferFrom
  '18160ddd', // totalSupply (shared with ERC-20)
  '70a08231', // balanceOf (shared with ERC-20)
  '95d89b41', // symbol
  '06fdde03', // name
  'c87b56dd', // getApproved
  '081812fc', // tokenURI
];

// Fetch all contracts from the mirror node API
async function fetchContracts(next = null) {
  let url = `${MIRROR_NODE_API}/api/v1/contracts`;
  if (next) {
    url = MIRROR_NODE_API + next;
  }

  console.log('Fetching contracts from URL:', url);
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return null;
  }
}

// Fetch bytecode of a contract from the mirror node API
async function fetchContractBytecode(contractId) {
  try {
    const response = await axios.get(
      `${MIRROR_NODE_API}/api/v1/contracts/${contractId}`
    );
    return response.data.bytecode;
  } catch (error) {
    console.error(`Error fetching bytecode for contract ${contractId}:`, error);
    return null;
  }
}

// Analyze bytecode to determine if it follows ERC-20 or ERC-721 standards
function analyzeBytecode(bytecode) {
  let isERC20 = false;
  let isERC721 = false;

  // Create regex patterns for ERC-20 and ERC-721 signatures
  // This allows us to check for the presence of any signature in one pass through the bytecode,
  // which can significantly improve performance, especially with larger bytecode strings.
  const erc20Pattern = new RegExp(ERC20_FUNCTION_SIGNATURES.join('|'), 'g');
  const erc721Pattern = new RegExp(ERC721_FUNCTION_SIGNATURES.join('|'), 'g');

  // Check for unique ERC-20 signatures (e.g., decimals, totalSupply)
  isERC20 = erc20Pattern.test(bytecode);

  // Check for unique ERC-721 signatures (e.g., ownerOf, tokenURI)
  isERC721 = erc721Pattern.test(bytecode);

  isERC20 = isERC721 ? false : isERC20;
  return { isERC20, isERC721 };
}

// Fetch contract name (standard across ERC-20 and ERC-721)
async function fetchContractName(contractId) {
  try {
    // For now, returning a placeholder until you integrate with a proper Hedera JSON-RPC call.
    return 'Sample ERC Token Name';
  } catch (error) {
    console.error(`Error fetching name for contract ${contractId}:`, error);
    return 'Unknown';
  }
}

// Append new ERC contracts to the JSON file
function updateJsonFile(contractsList) {
  let existingContracts = [];

  // Check if the JSON file already exists
  if (fs.existsSync(JSON_FILE_PATH)) {
    const data = fs.readFileSync(JSON_FILE_PATH);
    existingContracts = JSON.parse(data);
  }

  // Add new contracts to the existing list
  const updatedContracts = existingContracts.concat(contractsList);

  // Write updated list to the JSON file
  fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(updatedContracts, null, 2));

  console.log(
    `Updated ${JSON_FILE_PATH} with ${contractsList.length} new contracts.`
  );
}

// Main function to scan Hedera contracts
async function scanHederaContracts() {
  let next = null;

  do {
    const contractsData = await fetchContracts(next);
    if (!contractsData) {
      break;
    }

    const contractsList = [];

    // Fetch bytecode for all contracts concurrently
    const bytecodePromises = contractsData.contracts.map((contract) =>
      fetchContractBytecode(contract.contract_id)
    );

    const bytecodes = await Promise.all(bytecodePromises);

    // Analyze bytecodes and filter contracts
    for (let i = 0; i < contractsData.contracts.length; i++) {
      const bytecode = bytecodes[i];
      if (bytecode) {
        const { isERC20, isERC721 } = analyzeBytecode(bytecode);
        if (isERC20 || isERC721) {
          //   const contractName = await fetchContractName(contractsData.contracts[i].contract_id);
          contractsList.push({
            contractId: contractsData.contracts[i].contract_id,
            isERC20,
            isERC721,
            // name: contractName,
          });
        }
      }
    }

    // Update the JSON file after processing each batch of contracts
    if (contractsList.length > 0) {
      updateJsonFile(contractsList);
    }

    // If there are more pages, update `next` to fetch the next batch of contracts
    next =
      contractsData.links && contractsData.links.next
        ? contractsData.links.next
        : null;
  } while (next);

  console.log('Completed scanning Hedera contracts.');
}

// Run the scanning function
scanHederaContracts();
