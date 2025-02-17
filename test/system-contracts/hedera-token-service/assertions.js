// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');

const expectValidHash = (hash, len = 0) => {
  let regex;
  if (len && len > 0) {
    regex = new RegExp(`^0x[a-fA-F0-9]{${len}}$`);
  } else {
    regex = new RegExp(`^0x[a-fA-F0-9]*$`);
  }

  expect(!!hash.match(regex)).to.eq(true);
};

module.exports = {
  expectValidHash,
};
