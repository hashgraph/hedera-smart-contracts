const { ethers } = require('hardhat');
const fs = require('fs');
const path = require( 'path');
const { HEDERA_MIRRORNODE } =  require('./config');

async function deploy() {
    const EcrecoverCheck = await ethers.getContractFactory('EcrecoverCheck');
    try {
        const ecrecoverCheck = await EcrecoverCheck.deploy();
        await ecrecoverCheck.waitForDeployment();
        const address = await ecrecoverCheck.getAddress();
        const result = await fetch(HEDERA_MIRRORNODE + 'contracts/' + address);
        const json = await result.json();
        return json.contract_id;
    } catch(e) {
        return null;
    }
}

export const deployCached = async () => {
    const addressPath = path.resolve(__dirname, '../cache/deploy');
    let address = getAddressState(addressPath) || await deploy();
    if (address) {
        try {
            fs.writeFileSync(addressPath, address);
        } catch (err) {
            console.error(err);
        }
    }
    return address;
}

const getAddressState = (path) => fs.existsSync(path) ? fs.readFileSync(path) : null;

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
