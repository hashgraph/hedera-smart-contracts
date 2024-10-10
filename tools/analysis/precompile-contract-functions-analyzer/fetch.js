import sqlite3 from 'sqlite3';
import {open} from 'sqlite';

async function main() {
  const name = 'mainnet-public';

  const db = await open({
    filename: `${name}.sqlite`,
    driver: sqlite3.Database
  });

  await db.exec('CREATE TABLE IF NOT EXISTS contracts (address TEXT PRIMARY KEY ON CONFLICT REPLACE, contract_id TEXT NOT NULL, bytecode TEXT, runtime_bytecode TEXT) STRICT');

  let lastContractId = (await (await fetch(`https://${name}.mirrornode.hedera.com/api/v1/contracts?limit=1&order=desc`)).json()).contracts[0].contract_id;
  let next = `https://${name}.mirrornode.hedera.com/api/v1/contracts?limit=100&order=desc&contract.id=lt:${lastContractId}`;
  let hasNext = true;
  let totalContracts = 0;
  while (hasNext) {
    console.log(`Using URL ${next} to fetch the next contracts`);

    let {contracts, links} = await (await fetch(next)).json();
    for (const contract of contracts) {
      totalContracts++;
      const res = await (await fetch(`https://${name}.mirrornode.hedera.com/api/v1/contracts/${contract.evm_address}`)).json();
      await db.run('INSERT INTO contracts (address, contract_id, bytecode, runtime_bytecode) VALUES ($address, $contract_id, $bytecode, $runtime_bytecode)', {
        $address: contract.evm_address,
        $contract_id: contract.contract_id,
        $bytecode: res.bytecode,
        $runtime_bytecode: res.runtime_bytecode
      });
    }

    next = `https://${name}.mirrornode.hedera.com${links.next}`;
    hasNext = !!links.next;
  }

  console.log(`${totalContracts} contracts have been fetched successfully.`);
}

main().catch(console.error);
