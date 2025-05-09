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
        name: 'Sample Smart Contract deployment using Create2',
        cases: [
            { name:  'Deploying a new contract', code: 'create2::deploy' },
        ],
    },
    {
        name: 'Sample Smart Contract deployment with deterministic address',
        cases: [
            { name:  'Deploying a new contract', code: 'deterministic::deploy' },
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
            { name: 'Transferring tokens', code: 'erc20::transfer' },
        ],
    },
    {
        name: 'Erc721 token',
        cases: [
            { name: 'Deploying a new contract', code: 'erc721::deploy' },
            { name: 'Minting token', code: 'erc721::mint' },
            { name: 'Transferring tokens', code: 'erc721::transfer' },
        ],
    }
];

module.exports = {
    executors: get('executors'),
    tests: tests.map(test => ({
        ...test, cases: test.cases.filter(testCase => operations.length === 0 || operations.includes(testCase.code)),
    })).filter(test => operations.length === 0 || test.cases.length > 0),
};
