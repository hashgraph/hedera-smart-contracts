// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./Pairing.sol";
import "./BLS.sol";

/**
 * @title BLSTest
 * @dev Testing contract for the BLS library.
 */
contract BLSTest {
    /*
     * Storage
     */

    Pairing.G2Point verificationKey;

    /*
     * Constructor
     */

    constructor() {
        verificationKey = Pairing.G2Point({
            x: [
                18523194229674161632574346342370534213928970227736813349975332190798837787897,
                5725452645840548248571879966249653216818629536104756116202892528545334967238
            ],
            y: [
                3816656720215352836236372430537606984911914992659540439626020770732736710924,
                677280212051826798882467475639465784259337739185938192379192340908771705870
            ]
        });
    }

    /*
     * Public functions
     */

    function verify(bytes memory _message, uint _signatureX, uint _signatureY) public view returns (bool) {
        Pairing.G1Point memory signature = Pairing.G1Point({
            x: _signatureX,
            y: _signatureY
        });
        return BLS.verify(verificationKey, _message, signature);
    }
}
