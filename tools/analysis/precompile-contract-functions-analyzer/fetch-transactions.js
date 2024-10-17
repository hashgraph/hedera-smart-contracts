import sqlite3 from 'sqlite3';
import {open} from 'sqlite';

async function main() {
  const name = 'mainnet-public';

  const db = await open({
    filename: `${name}.sqlite`,
    driver: sqlite3.Database
  });

  await db.exec('CREATE TABLE IF NOT EXISTS transactions (address TEXT, contract_id TEXT, "to" TEXT, hash TEXT, function_parameters TEXT, call_result TEXT, created_contract_ids TEXT, amount TEXT, "from" TEXT) STRICT');

  let contractIds = [];
  await db.each('select contract_id from contracts c where contract_id not in (select contract_id from transactions t group by contract_id)', function (err, row) {
    contractIds.push(row.contract_id);
  });

  let totalTransactions = 0;
  for (const contractId of contractIds) {
    let next = `https://${name}.mirrornode.hedera.com/api/v1/contracts/${contractId}/results?limit=100`;
    let hasNext = true;
    while (hasNext) {
      try {
        const {results, links} = await (await fetch(next)).json();

        for (const res of results) {
          totalTransactions++;
          await db.run('INSERT INTO transactions (address, contract_id, "to", hash, function_parameters, call_result, created_contract_ids, amount, "from") VALUES ($address, $contract_id, $to, $hash, $function_parameters, $call_result, $created_contract_ids, $amount, $from)', {
            $address: res.address,
            $contract_id: res.contract_id,
            $to: res.to,
            $hash: res.hash,
            $function_parameters: res.function_parameters,
            $call_result: res.call_result,
            $created_contract_ids: JSON.stringify(res.created_contract_ids),
            $amount: res.amount,
            $from: res.from
          });
        }

        next = `https://${name}.mirrornode.hedera.com${links.next}`;
        hasNext = !!links.next;

        console.log(next);
      } catch (e) {
        console.log(e);
      }
    }
  }
  console.log(`${totalTransactions} transactions have been fetched successfully.`);
}

main().catch(console.error);
