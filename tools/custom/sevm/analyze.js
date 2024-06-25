#!/usr/bin/env node

import c from 'chalk';
import * as fs from 'fs';
import { Contract, Shanghai, sol } from 'sevm';

const name = 'testnet';

function analyze(code, path) {
    try {
        new Contract(code, new class extends Shanghai {
            STATICCALL = (state) => {
                super.STATICCALL(state);
                const call = state.stack.top;
                const address = call.address.eval();
                if (address.tag === 'Val') {
                    console.log('0x' + address.val.toString(16), path, sol`${call.eval()}`)
                }
            };

            CALL = (state) => {
                super.CALL(state);
                const call = state.stack.top;
                const address = call.address.eval();
                if (address.tag === 'Val') {
                    console.log('0x' + address.val.toString(16), path, sol`${call.eval()}`)
                }
            };

            DELEGATECALL = (state) => {
                super.DELEGATECALL(state);
                const call = state.stack.top;
                const address = call.address.eval();
                if (address.tag === 'Val') {
                    console.log('0x' + address.val.toString(16), path, sol`${call.eval()}`)
                }
            };
        }());
    } catch (err) {
        console.info(path, err);
    }
}

function main() {
    let prefixes = process.argv.slice(2);
    prefixes = prefixes.length === 0 ? fs.readdirSync(`.${name}`) : prefixes;

    for (const prefix of prefixes) {
        process.stdout.write(`${c.dim(prefix)} `);
        for (const file of fs.readdirSync(`.${name}/${prefix}`)) {
            const path = `.${name}/${prefix}/${file}`;
            // console.info(`Running ${c.cyan('sevm')} analysis on ${c.magenta(file.slice(0, 8) + '..' + file.slice(-9 - 6))}`);
            const code = fs.readFileSync(path, 'utf8');
            analyze(code, path);
        }
    }
}

main();
