import sqlite3 from 'sqlite3';
import {open} from 'sqlite';

async function main() {
  const name = 'mainnet-public';

  const db = await open({
    filename: `${name}.sqlite`,
    driver: sqlite3.Database
  });

  await db.exec(`CREATE TABLE IF NOT EXISTS transaction_actions_3 (tx_hash TEXT, call_operation_type TEXT, caller TEXT, caller_type TEXT, "from" TEXT, input TEXT, recipient TEXT, recipient_type TEXT, result_data TEXT, "to" TEXT, value TEXT) STRICT`);

  let transactionHashes = [];
  await db.each('select hash from transactions where hash not in (select imported_hash from imported_hashes)', function (err, row) {
    transactionHashes.push(row.hash);
  });
  console.log(`Total tx hashes: ${transactionHashes.length}`);

  let startTime;
  let importedHashesQuery = `insert into imported_hashes (imported_hash) values `;
  let importActionsQuery = `insert into transaction_actions_3 (tx_hash, call_operation_type, caller, caller_type, "from", input, recipient, recipient_type, result_data, "to", value) values `;
  let counterHashes = 0;
  let counterActions = 0;
  let totalTxHashes = 0;
  let actionPromises = [];
  let hashesArray = [];
  for (const txHash of transactionHashes) {
    startTime = new Date();
    importedHashesQuery += ` ("${txHash}"),`;
    counterHashes++;
    totalTxHashes++;
    hashesArray.push(txHash);

    if (actionPromises.length < 3) {
      actionPromises.push(new Promise(async function (resolve) {
        resolve(await (await fetch(`https://${name}.mirrornode.hedera.com/api/v1/contracts/results/${txHash}/actions?limit=100`)).json());
      }));

      continue;
    }

    const responses = await Promise.all(actionPromises);
    for (const index in responses) {
      const {actions} = responses[index];
      console.log(`network time: ${new Date() - startTime} ms`);

      for (const res of actions) {
        counterActions++;
        importActionsQuery += ` ("${hashesArray[index]}", "${res.call_operation_type}", "${res.caller}", "${res.caller_type}", "${res.from}", "${res.input}",
         "${res.recipient}", "${res.recipient_type}", "${res.result_data}", "${res.to}", "${res.value}"),`;
      }
    }

    if (counterHashes > 650) {
      await db.run(importedHashesQuery.slice(0, -1));
      counterHashes = 0;
      importedHashesQuery = `insert into imported_hashes (imported_hash) values `;
      console.log('--- ' + totalTxHashes + ' hashes imported of ' + transactionHashes.length);
    }

    if (counterActions > 2000) {
      await db.run(importActionsQuery.slice(0, -1));
      counterActions = 0;
      importActionsQuery = `insert into transaction_actions_3 (tx_hash, call_operation_type, caller, caller_type, "from", input, recipient, recipient_type, result_data, "to", value) values `;
      console.log('--- 2000 actions imported');
    }

    actionPromises = [];
    hashesArray = [];
    console.log(`execution time: ${new Date() - startTime} ms`);
  }
}

main().catch(console.error);
