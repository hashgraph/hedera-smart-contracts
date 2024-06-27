#!/usr/bin/env node

import c from 'chalk';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as path from 'path';
import { keccak256 } from 'ethers';
import { mkdir, writeFile } from 'fs/promises';

const name = 'testnet';

const info = (message, ...optionalParams) => console.info(c.dim('[info]'), message, ...optionalParams);

/**
 * 
 * @param {sqlite3.Database} db
 * @param {string} contract_id
 * @param {string} address
 */
async function fetchCode(db, contract_id, address) {
    const { bytecode: content } = await (await fetch(`https://testnet.mirrornode.hedera.com/api/v1/contracts/${address}`)).json();

    const hash = keccak256(content);

    await Promise.all([
        writeFile(path.join(`.${name}`, hash.slice(2, 4), hash + '.bytecode'), content, 'utf8'),
        db.run('INSERT INTO contracts (address, contract_id, hash, size) VALUES ($address, $contract_id, $hash, $size)', {
            $address: address,
            $contract_id: contract_id,
            $hash: hash,
            $size: content.length,
        })
    ]);
}

async function main() {
    const dbname = `${name}.sqlite`;

    info('Opening db', c.magenta(dbname));
    const db = await open({
        filename: dbname,
        driver: sqlite3.Database
    });

    await db.exec('CREATE TABLE IF NOT EXISTS contracts (address TEXT PRIMARY KEY ON CONFLICT REPLACE, contract_id TEXT NOT NULL, hash TEXT NOT NULL, size INTEGER NOT NULL) STRICT');

    info(`Creating directory prefixes under ${c.magenta('.' + name)}`);
    for (let i = 0; i < 256; i++) {
        const prefix = i.toString(16).padStart(2, '0');
        await mkdir(path.join(`.${name}`, prefix), { recursive: true });
    }

    const row = await db.get('SELECT MIN(contract_id) AS contract_id FROM contracts');
    const params = row.contract_id ? `&contract.id=lt:${row.contract_id}` : '';

    let next = `https://${name}.mirrornode.hedera.com/api/v1/contracts?limit=100&order=desc${params}`;
    for (let i = 0; i < 20; i++) {
        info(`Using URL \`${next}\` to fetch the next contracts`)
        let { contracts, links } = await (await fetch(next)).json();
        for (const contract of contracts) {
            info(`Fetching code ${contract.contract_id}:${contract.evm_address}`)
            await fetchCode(db, contract.contract_id, contract.evm_address);
        }

        next = `https://${name}.mirrornode.hedera.com${links.next}`;
    }
}

main().catch(console.error);
