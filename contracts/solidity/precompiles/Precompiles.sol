// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract Precompiles {

    event DebugBytes(bytes data);
    event DebugUint256(uint256 value);
    uint256 constant dummy = 0;

    // Generated for the ecPairing, using circom's "Getting started", "Verifying from a Smart Contract", example: https://docs.circom.io/getting-started/proving-circuits/#verifying-a-proof 
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 1992193412575387772633166300059621656894667020589796054599256571938481924230;
    uint256 constant alphay  = 17286394816897329629069822916679309371076736310284017855248312609568383258237;
    uint256 constant betax1  = 11964323460734694315238111140642024467452813403052111330212995086166809270885;
    uint256 constant betax2  = 12267908196455409001876930296230756523799830500981645004963998667454025535434;
    uint256 constant betay1  = 21275906100829937195191642051557308290074855814227086905366055391443466419712;
    uint256 constant betay2  = 11626206177405313309349477264020271977827652855514445334498513782927752593000;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 2009753607463674868643623849162140280453293590938413759204491084610780506800;
    uint256 constant deltax2 = 2318786346813288613910245922805240833314377829481066116275566236397337633311;
    uint256 constant deltay1 = 10136331428626930676893265737858796788982376651161771565051197160272857837902;
    uint256 constant deltay2 = 10244858826673312074376951503947532249080874861318982996096318922537363359310;

    
    uint256 constant IC0x = 8932029301015886160530317842397264455712404585681011305111252155919622321955;
    uint256 constant IC0y = 8277775186538355354365054546186421179471810889108665599571530260894812131569;
    
    uint256 constant IC1x = 10605992167215957342338540958692483139633228909008555813480804645225067260597;
    uint256 constant IC1y = 18983729039899565301459273836628802849991503687662293824406539434384123854551;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;
    // End of generated data


    function verifySignature(
        bytes32 hashedMessage,
        uint8 v,
        bytes32 r,
        bytes32 s,
        address expectedSigner
    ) public pure returns (bool) {
        // Recover the address from the signature
        address recoveredAddress = ecrecover(hashedMessage, v, r, s);

        // Compare the recovered address with the expected signer's address
        return recoveredAddress == expectedSigner;
    }

    function computeSha256Hash(string memory input) public pure returns (bytes32) {
        return sha256(abi.encodePacked(input));
    }

    function computeRipemd160Hash(string memory input) public pure returns (bytes20) {
        return ripemd160(abi.encodePacked(input));
    }

    function getIdentity(uint256 input) public pure returns (uint256) {
        uint256 output;
        assert(output != input);
        assembly {
            // Load data from the call data at the specified index
            output := calldataload(4) // 4 bytes offset for the function selector
        }
        return output;
    }  

    function modExp(uint256 base, uint256 exponent, uint256 modulus) public returns (uint256 result) {
        // Input length for base, exponent, and modulus
        uint256 length = 32; // for simplicity, assuming all inputs are 32 bytes

        emit DebugUint256(base);
        emit DebugUint256(exponent);
        emit DebugUint256(modulus);
        emit DebugBytes(bytes.concat(abi.encode(base), abi.encode(exponent), abi.encode(modulus)));

        assembly {
            // Free memory pointer
            let p := mload(0x40)

            // Define length and position for base, exponent, and modulus
            mstore(p, length)           // Length of base
            mstore(add(p, 0x20), length) // Length of exponent
            mstore(add(p, 0x40), length) // Length of modulus
            mstore(add(p, 0x60), base)   // Base
            mstore(add(p, 0x80), exponent) // Exponent
            mstore(add(p, 0xA0), modulus)  // Modulus

            // Call the MODEXP precompiled contract at address 0x5
            if iszero(call(not(0), 0x05, 0, p, 0xC0, p, 0x20)) {
                revert(0, 0)
            }

            // Load the result
            result := mload(p)
        }
    }  

    function ecAdd(uint256[2] memory point1, uint256[2] memory point2) public view returns (uint256[2] memory result) {
        // Input format: (x1, y1, x2, y2)
        uint256[4] memory input;
        input[0] = point1[0];
        input[1] = point1[1];
        input[2] = point2[0];
        input[3] = point2[1];

        assembly {
            // Call the ecAdd precompile at address 0x6
            if iszero(staticcall(not(0), 0x6, input, 0x80, result, 0x40)) {
                revert(0, 0)
            }
        }
    }    

    function ecMul(uint256[2] memory point, uint256 k, uint256 prime) public returns (uint256[2] memory result) {
        // Ensure the input point is on the curve
        require(isOnCurve(point, prime), "Point is not on the curve");

        // Use the precompiled contract for the ecMul operation
        // The precompiled contract for ecMul is at address 0x07
        assembly {
            // Free memory pointer
            let p := mload(0x40)
            
            // Store input data in memory
            mstore(p, mload(point))
            mstore(add(p, 0x20), mload(add(point, 0x20)))
            mstore(add(p, 0x40), k)
            
            // Call the precompiled contract
            // Input: 0x60 bytes (point x, point y, scalar k)
            // Output: 0x40 bytes (resulting point x', y')
            if iszero(call(not(0), 0x07, 0, p, 0x60, p, 0x40)) {
                revert(0, 0)
            }
            
            // Load the result from memory
            result := p
        }
    }    

    // Generated function using circom's "Getting started", "Verifying from a Smart Contract", example: https://docs.circom.io/getting-started/proving-circuits/#verifying-a-proof 
    function ecPairing(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[1] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, q)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
        }
    }    

    function blake2(uint32 rounds, bytes32[2] memory h, bytes32[4] memory m, bytes8[2] memory t, bool f) view public returns (bytes32[2] memory) {
        bytes32[2] memory output;

        bytes memory args = abi.encodePacked(rounds, h[0], h[1], m[0], m[1], m[2], m[3], t[0], t[1], f);
     
        assembly {
            if iszero(staticcall(not(0), 0x09, add(args, 32), 0xd5, output, 0x40)) {
                revert(0, 0)
            }
        }

        return output;
    }

    function isOnCurve(uint256[2] memory point, uint256 prime) public pure returns (bool) {
        uint256 x = point[0];
        uint256 y = point[1];
        uint256 lhs = mulmod(y, y, prime);
        uint256 rhs = addmod(mulmod(mulmod(x, x, prime), x, prime), 3, prime);
        return lhs == rhs;
    }    
}
