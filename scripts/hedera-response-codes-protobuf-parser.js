// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const axios = require('axios');
const protobufjs = require('protobufjs');

async function main() {
  const version = (await axios.get('https://raw.githubusercontent.com/hashgraph/hedera-services/refs/heads/main/version.txt')).data.replace('\n', '');
  const res = (await axios.get('https://raw.githubusercontent.com/hashgraph/hedera-services/refs/heads/main/hapi/hedera-protobufs/services/response_code.proto')).data;
  const parsedProto = protobufjs.parse(res, {
    keepCase: true,
    alternateCommentMode: true,
    preferTrailingComment: true
  });
  const responseCodes = parsedProto.root.nested.proto.nested.ResponseCodeEnum;

  let contract =
      `// SPDX-License-Identifier: Apache-2.0\n` +
      `pragma solidity >=0.4.9 <0.9.0;\n` +
      `\n// this contract is auto-generated by a manual triggered script in utils/hedera-response-codes-protobuf-parser.js` +
      `\n// the generated contract is using hedera response codes from services version ${version}` +
      `\n// https://github.com/hashgraph/hedera-services/blob/main/hapi/hedera-protobufs/services/response_code.proto\n\n` +
      `library HederaResponseCodes {\n`;
  for (const [name, code] of Object.entries(responseCodes.values)) {
    const comment = responseCodes?.comments[name];
    if (comment) {
      contract += `    /// ${comment.replaceAll('\n', ' ') ?? ''}\n`;
    }
    contract += `    int32 internal constant ${name} = ${code};\n\n`;
  }
  contract += '}\n';

  console.log(`The generated contract is using hedera response codes from services version ${version}`);

  fs.writeFileSync('./contracts/system-contracts/HederaResponseCodes.sol', contract);
}

main();
