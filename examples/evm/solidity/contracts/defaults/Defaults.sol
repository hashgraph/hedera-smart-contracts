// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract Defaults {
    struct UintDefaults {
        uint uInt;
        uint8 uInt8;
        uint16 uInt16;
        uint32 uInt32;
        uint64 uInt64;
        uint128 uInt128;
        uint256 uInt256;
    }

    struct IntDefaults {
        int intDef;
        int8 intDef8;
        int16 intDef16;
        int32 intDef32;
        int64 intDef64;
        int128 intDef128;
        int256 intDef256;
    }

    // struct FixedDefaults {
    //     fixed fixedVar;
    //     fixed8x18 fixed8x18Var;
    //     fixed16x12 fixed16x12Var;
    //     fixed32x10 fixed32x10Var;
    //     fixed64x8 fixed64x8Var;
    //     fixed128x6 fixed128x6Var;
    //     fixed256x4 fixed256x4Var;
    // }

    // struct UFixedDefaults {
    //     ufixed ufixedVar;
    //     ufixed8x18 ufixed8x18Var;
    //     ufixed16x12 ufixed16x12Var;
    //     ufixed32x10 ufixed32x10Var;
    //     ufixed64x8 ufixed64x8Var;
    //     ufixed128x6 ufixed128x6Var;
    //     ufixed256x4 ufixed256x4Var;
    // }

    struct BytesDefaults {
        bytes3 bytesDef3;
        bytes10 bytesDef10;
        bytes15 bytesDef15;
        bytes20 bytesDef20;
        bytes25 bytesDef25;
        bytes30 bytesDef30;
        bytes32 bytesDef32;
    }

    struct ArrayDefaults {
        string[] strArr;
        uint[] uintArr;
        bool[] boolArr;
        bytes[] bytesArr;
    }

    mapping(string => uint) public strUintMap;
    mapping(address => bool) public addrBoolMap;
    mapping(int => bytes) public bytesBytesMap;

    function getUintDefaults() external pure returns (UintDefaults memory) {
        UintDefaults memory defaults;
        return defaults;
    }

    function getIntDefaults() external pure returns (UintDefaults memory) {
        UintDefaults memory defaults;
        return defaults;
    }

    // Not supported by solidity yet
    // function getFixedDefaults() external pure returns (FixedDefaults memory) {
    //     FixedDefaults memory defaults;
    //     return defaults;
    // }

    // Not supported by solidity yet
    // function getUFixedDefaults() external pure returns (UFixedDefaults memory) {
    //     UFixedDefaults memory defaults;
    //     return defaults;
    // }

    function getBytesDefaults() external pure returns (BytesDefaults memory) {
        BytesDefaults memory defaults;
        return defaults;
    }

    function getStringDefaults() external pure returns (string memory) {
        string memory defaults;
        return defaults;
    }

    function getArrayDefaults() external pure returns (ArrayDefaults memory) {
        ArrayDefaults memory defaults;
        return defaults;
    }

    function getAddressDefaults() external pure returns (address) {
        address defaults;
        return defaults;
    }

}
