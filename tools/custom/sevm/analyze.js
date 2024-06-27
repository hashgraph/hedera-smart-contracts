#!/usr/bin/env node

import c from 'chalk';
import * as fs from 'fs';
import { Contract, Shanghai, sol } from 'sevm';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const info = (message, ...optionalParams) => console.info(c.dim('[info]'), message, ...optionalParams);

const name = 'testnet';

/**
 * @param {sqlite3.Database} db
 * @param {string} code 
 * @param {string} hash 
 * @param {string} path 
 */
async function analyze(db, code, hash, path) {
    const row = await db.get('SELECT address FROM contracts WHERE hash = ?', hash);
    const contractAddress = row?.address;

    try {
        new Contract(code, new class extends Shanghai {
            STATICCALL = (state) => {
                super.STATICCALL(state);
                const call = state.stack.top;
                const address = call.address.eval();
                if (address.tag === 'Val') {
                    console.log(contractAddress, '0x' + address.val.toString(16), path, sol`${call.eval()}`)
                }
            };

            CALL = (state) => {
                super.CALL(state);
                const call = state.stack.top;
                const address = call.address.eval();
                if (address.tag === 'Val') {
                    console.log(contractAddress, '0x' + address.val.toString(16), path, sol`${call.eval()}`)
                }
            };

            DELEGATECALL = (state) => {
                super.DELEGATECALL(state);
                const call = state.stack.top;
                const address = call.address.eval();
                if (address.tag === 'Val') {
                    console.log(contractAddress, '0x' + address.val.toString(16), path, sol`${call.eval()}`)
                }
            };
        }());
    } catch (err) {
        console.info(path, err);
    }
}

const shortened = hash => hash.slice(0, 8) + '[..]' + hash.slice(-6);

async function main() {
    const dbname = `${name}.sqlite`;
    info('Opening db', c.magenta(dbname));

    const db = await open({
        filename: dbname,
        driver: sqlite3.Database
    });

    let prefixes = process.argv.slice(2);
    prefixes = prefixes.length === 0 ? fs.readdirSync(`.${name}`) : prefixes;

    for (const prefix of prefixes) {
        // process.stdout.write(`${c.dim(prefix)} `);
        for (const file of fs.readdirSync(`.${name}/${prefix}`)) {
            const path = `.${name}/${prefix}/${file}`;
            // console.info(`Running ${c.cyan('sevm')} analysis on ${c.magenta(file.slice(0, 8) + '..' + file.slice(-9 - 6))}`);
            const code = fs.readFileSync(path, 'utf8');

            if (code === '0x') {
                continue;
            }

            const [hash, ext] = file.split('.');
            const shortenedPath = `.${name}/${prefix}/${shortened(hash)}.${ext}`
            await analyze(db, code, hash, shortenedPath);
        }
    }
}

main().catch(console.error);
