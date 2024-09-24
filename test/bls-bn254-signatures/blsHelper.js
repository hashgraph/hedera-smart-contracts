const {ethers} = require('hardhat');
const mcl = require('mcl-wasm');

module.exports = class BLSHelper {
  constructor() {
    this.G1 = new mcl.G1();
    const g1x = new mcl.Fp();
    const g1y = new mcl.Fp();
    const g1z = new mcl.Fp();
    g1x.setStr('01', 16);
    g1y.setStr('02', 16);
    g1z.setInt(1);
    this.G1.setX(g1x);
    this.G1.setY(g1y);
    this.G1.setZ(g1z);

    this.G2 = new mcl.G2();
    const g2x = this.createFp2(
        '0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed',
        '0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2'
    );
    const g2y = this.createFp2(
        '0x12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa',
        '0x090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b'
    );
    const g2z = this.createFp2('0x01', '0x00');
    this.G2.setX(g2x);
    this.G2.setY(g2y);
    this.G2.setZ(g2z);
  }

  createFp2(a, b) {
    const fp2_a = new mcl.Fp();
    const fp2_b = new mcl.Fp();
    fp2_a.setStr(a);
    fp2_b.setStr(b);

    const fp2 = new mcl.Fp2();
    fp2.set_a(fp2_a);
    fp2.set_b(fp2_b);

    return fp2;
  }

  createKeyPairG1Pub() {
    const generatedPrivateKey = ethers.Wallet.createRandom().privateKey;

    const secretKeyFr = new mcl.Fr();
    secretKeyFr.setHashOf(generatedPrivateKey);

    const pubKeyG1 = mcl.mul(this.G1, secretKeyFr);
    pubKeyG1.normalize();

    return {
      secretKeyFr,
      pubKeyG1
    };
  }

  createKeyPairG2Pub() {
    const generatedPrivateKey = ethers.Wallet.createRandom().privateKey;

    const secretKeyFr = new mcl.Fr();
    secretKeyFr.setHashOf(generatedPrivateKey);

    const pubKeyG2 = mcl.mul(this.G2, secretKeyFr);
    pubKeyG2.normalize();

    return {
      secretKeyFr,
      pubKeyG2
    };
  }

  g1FromHex(hex) {
    const frRep = new mcl.Fr();
    frRep.setHashOf(hex);

    const g1Point = mcl.mul(this.G1, frRep);
    g1Point.normalize();

    return g1Point;
  }

  g2FromHex(hex) {
    const frRep = new mcl.Fr();
    frRep.setHashOf(hex);

    const g2Point = mcl.mul(this.G2, frRep);
    g2Point.normalize();

    return g2Point;
  }

  signG1(messageG1, secretFr) {
    const signatureG1 = mcl.mul(messageG1, secretFr);
    signatureG1.normalize();

    return signatureG1;
  }

  signG2(messageG2, secretFr) {
    const signatureG2 = mcl.mul(messageG2, secretFr);
    signatureG2.normalize();

    return signatureG2;
  }

  serializeFp(p) {
    return ('0x' +
        Array.from(p.serialize())
            .reverse()
            .map((value) => value.toString(16).padStart(2, '0'))
            .join(''));
  }

  serializeG1Point(pG1) {
    pG1.normalize();

    return [BigInt(this.serializeFp(pG1.getX())), BigInt(this.serializeFp(pG1.getY()))];
  }

  serializeG2Point(pG2) {
    const x = this.serializeFp(pG2.getX());
    const y = this.serializeFp(pG2.getY());

    return [
      BigInt(ethers.dataSlice(x, 32)),
      BigInt(ethers.dataSlice(x, 0, 32)),
      BigInt(ethers.dataSlice(y, 32)),
      BigInt(ethers.dataSlice(y, 0, 32))
    ];
  }
}
