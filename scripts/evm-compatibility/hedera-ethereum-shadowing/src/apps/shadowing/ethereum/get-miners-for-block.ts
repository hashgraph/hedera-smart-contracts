import { getBlockByHashErigon } from "@/api/erigon/get-block-by-hash";

export async function getMinersForBlock(block: any): Promise<any> {
    let miners = [];
    if (block.miner) {
        miners.push(block.miner);
    }
    if (block.uncles) {
        for (const hash of block.uncles) {
            const uncle = await getBlockByHashErigon(hash);
            if (uncle && uncle.miner) {
                miners.push(uncle.miner);
            }
        }
    }
    return miners;
}
