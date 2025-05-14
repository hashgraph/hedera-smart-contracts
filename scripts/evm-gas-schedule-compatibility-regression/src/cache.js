// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const path = require('path');

const storage = path.resolve(__dirname, '../cache/tmp');

class Cache {
  constructor(prefix) {
    this.prefix = prefix;
  }

  /**
   * @returns {{key: string, value: string}[]}
   */
  all() {
    const cacheDir = path.dirname(storage);
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    if (!fs.existsSync(storage)){
      fs.writeFileSync(storage, '[]');
    } else {
      const content = fs.readFileSync(storage, 'utf8');
      if (!content.trim()) fs.writeFileSync(storage, '[]');
    }
    return JSON.parse(`${fs.readFileSync(storage)}`);
  }
  read(key) {
    const cache = this.all();
    for (const element of cache) {
      if (element.key === `${this.prefix}::${key}`) return element.value;
    }
    return null;
  }
  write(key, value) {
    const cache = this.all();
    for (const element of cache) {
      if (element.key === `${this.prefix}::${key}`) {
        element.value = value;
        fs.writeFileSync(storage, JSON.stringify(cache));
        return;
      }
    }
    cache.push({ key: `${this.prefix}::${key}`, value });
    fs.writeFileSync(storage, JSON.stringify(cache));
  }
}

module.exports = {
  Cache
};
