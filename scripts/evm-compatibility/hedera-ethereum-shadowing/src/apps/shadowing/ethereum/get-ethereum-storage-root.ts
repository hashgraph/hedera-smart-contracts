import { Level } from "level"
import { keccak256, toBuffer } from "ethereumjs-util";
import { BaseTrie } from "merkle-patricia-tree";

// export async function getEthereumStorageRoot(chainDataPath: any, blockStateRoot: any, contractAddress: any) {
//     const db = new Level(chainDataPath);
//     const root = toBuffer(blockStateRoot);
//     const address = toBuffer(contractAddress);
//     const addressHashBytes = keccak256(address);
//     const trie = new BaseTrie(db, root);
//     return await trie.get(addressHashBytes);
// };