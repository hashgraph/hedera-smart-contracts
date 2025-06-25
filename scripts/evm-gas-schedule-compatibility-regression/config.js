const get = function (parameter) {
    const valueArg = process.argv.find(arg => arg.startsWith(`--${parameter}=`)) || '';
    let value = valueArg.replace(`--${parameter}=`, '').split(',').filter(Boolean);
    const envKey = parameter.toUpperCase();
    if (value.length === 0 && process.env[envKey]) value = process.env[envKey].split(',').filter(Boolean);
    return value;
}
const operations = get('operations');
const tests = [
    {
        name: 'Sample Smart Contract deployment',
        cases: [
            { name:  'Deploying a new contract', code: 'new-contract::deploy' },
        ],
    },
    {
        name: 'Sample Smart Contract deployment via a factory',
        cases: [
            { name:  'Deploying a new contract', code: 'create-via-factory::deploy' },
        ],
    },
    {
        name: 'Sample Smart Contract deployment via a factory with deterministic addressing (using CREATE2)',
        cases: [
            { name:  'Deploying a new contract', code: 'create-via-factory-deterministic::deploy' },
        ],
    },
    {
        name: 'Calling delegate call',
        cases: [
            { name: 'Executing delegate call', code: 'delegate::call' },
        ],
    },
    {
        name: 'Erc20 token',
        cases: [
            { name: 'Deploying a new contract', code: 'erc20::deploy' },
            { name: 'Minting tokens', code: 'erc20::mint' },
            { name: 'Burning tokens', code: 'erc20::burn' },
            { name: 'Transferring tokens', code: 'erc20::transfer' },
            { name: 'Approving token', code: 'erc20::approve' },
            { name: 'Transferring tokens with transfer from method', code: 'erc20::transferFrom' },
        ],
    },
    {
        name: 'Erc721 token',
        cases: [
            { name: 'Deploying a new contract', code: 'erc721::deploy' },
            { name: 'Minting token', code: 'erc721::mint' },
            { name: 'Burning token', code: 'erc721::burn' },
            { name: 'Approving token', code: 'erc721::approve' },
            { name: 'Approving all', code: 'erc721::setApprovalForAll' },
            { name: 'Transferring token with transfer from method', code: 'erc721::transferFrom' },
            { name: 'Transferring token with safe transfer from method', code: 'erc721::safeTransferFrom' },
        ],
    }
];

const executors = get('executors');
if (executors.length === 0) {
    console.error(`Please specify at least one executor, e.g.: \nnpm run test --executors=Hedera::Testnet::EVM\n`);
    process.exit(1);
}

module.exports = {
    executors,
    tests: tests.map(test => ({
        ...test, cases: test.cases.filter(testCase => operations.length === 0 || operations.includes(testCase.code)),
    })).filter(test => operations.length === 0 || test.cases.length > 0),
};
