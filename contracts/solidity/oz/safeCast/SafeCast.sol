// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

contract SafeCastTest {
    uint256 maxUint256 = type(uint256).max;
    uint248 maxUint248 = type(uint248).max;
    uint240 maxUint240 = type(uint240).max;
    uint232 maxUint232 = type(uint232).max;
    uint224 maxUint224 = type(uint224).max;
    uint216 maxUint216 = type(uint216).max;
    uint208 maxUint208 = type(uint208).max;
    uint200 maxUint200 = type(uint200).max;
    uint192 maxUint192 = type(uint192).max;
    uint184 maxUint184 = type(uint184).max;
    uint176 maxUint176 = type(uint176).max;
    uint168 maxUint168 = type(uint168).max;
    uint160 maxUint160 = type(uint160).max;
    uint152 maxUint152 = type(uint152).max;
    uint144 maxUint144 = type(uint144).max;
    uint136 maxUint136 = type(uint136).max;
    uint128 maxUint128 = type(uint128).max;
    uint120 maxUint120 = type(uint120).max;
    uint112 maxUint112 = type(uint112).max;
    uint104 maxUint104 = type(uint104).max;
    uint96 maxUint96 = type(uint96).max;
    uint88 maxUint88 = type(uint88).max;
    uint80 maxUint80 = type(uint80).max;
    uint72 maxUint72 = type(uint72).max;
    uint64 maxUint64 = type(uint64).max;
    uint56 maxUint56 = type(uint56).max;
    uint48 maxUint48 = type(uint48).max;
    uint40 maxUint40 = type(uint40).max;
    uint32 maxUint32 = type(uint32).max;
    uint24 maxUint24 = type(uint24).max;
    uint16 maxUint16 = type(uint16).max;
    uint8 maxUint8 = type(uint8).max;

    int256 maxInt256 = type(int256).max;
    int248 maxInt248 = type(int248).max;
    int240 maxInt240 = type(int240).max;
    int232 maxInt232 = type(int232).max;
    int224 maxInt224 = type(int224).max;
    int216 maxInt216 = type(int216).max;
    int208 maxInt208 = type(int208).max;
    int200 maxInt200 = type(int200).max;
    int192 maxInt192 = type(int192).max;
    int184 maxInt184 = type(int184).max;
    int176 maxInt176 = type(int176).max;
    int168 maxInt168 = type(int168).max;
    int160 maxInt160 = type(int160).max;
    int152 maxInt152 = type(int152).max;
    int144 maxInt144 = type(int144).max;
    int136 maxInt136 = type(int136).max;
    int128 maxInt128 = type(int128).max;
    int120 maxInt120 = type(int120).max;
    int112 maxInt112 = type(int112).max;
    int104 maxInt104 = type(int104).max;
    int96 maxInt96 = type(int96).max;
    int88 maxInt88 = type(int88).max;
    int80 maxInt80 = type(int80).max;
    int72 maxInt72 = type(int72).max;
    int64 maxInt64 = type(int64).max;
    int56 maxInt56 = type(int56).max;
    int48 maxInt48 = type(int48).max;
    int40 maxInt40 = type(int40).max;
    int32 maxInt32 = type(int32).max;
    int24 maxInt24 = type(int24).max;
    int16 maxInt16 = type(int16).max;
    int8 maxInt8 = type(int8).max;

    function testToUint256(int256 number) public pure returns (uint256) {
        return SafeCast.toUint256(number);
    }

    function testToUint248(uint256 number) public view returns (uint248) {
        return SafeCast.toUint248(maxUint248 + number);
    }

    function testToUint240(uint256 number) public view returns (uint240) {
        return SafeCast.toUint240(maxUint240 + number);
    }

    function testToUint232(uint256 number) public view returns (uint232) {
        return SafeCast.toUint232(maxUint232 + number);
    }

    function testToUint224(uint256 number) public view returns (uint224) {
        return SafeCast.toUint224(maxUint224 + number);
    }

    function testToUint216(uint256 number) public view returns (uint216) {
        return SafeCast.toUint216(maxUint216 + number);
    }

    function testToUint208(uint256 number) public view returns (uint208) {
        return SafeCast.toUint208(maxUint208 + number);
    }

    function testToUint200(uint256 number) public view returns (uint200) {
        return SafeCast.toUint200(maxUint200 + number);
    }

    function testToUint192(uint256 number) public view returns (uint192) {
        return SafeCast.toUint192(maxUint192 + number);
    }

    function testToUint184(uint256 number) public view returns (uint184) {
        return SafeCast.toUint184(maxUint184 + number);
    }

    function testToUint176(uint256 number) public view returns (uint176) {
        return SafeCast.toUint176(maxUint176 + number);
    }

    function testToUint168(uint256 number) public view returns (uint168) {
        return SafeCast.toUint168(maxUint168 + number);
    }

    function testToUint160(uint256 number) public view returns (uint160) {
        return SafeCast.toUint160(maxUint160 + number);
    }

    function testToUint152(uint256 number) public view returns (uint152) {
        return SafeCast.toUint152(maxUint152 + number);
    }

    function testToUint144(uint256 number) public view returns (uint144) {
        return SafeCast.toUint144(maxUint144 + number);
    }

    function testToUint136(uint256 number) public view returns (uint136) {
        return SafeCast.toUint136(maxUint136 + number);
    }

    function testToUint128(uint256 number) public view returns (uint128) {
        return SafeCast.toUint128(maxUint128 + number);
    }

    function testToUint120(uint256 number) public view returns (uint120) {
        return SafeCast.toUint120(maxUint120 + number);
    }

    function testToUint112(uint256 number) public view returns (uint112) {
        return SafeCast.toUint112(maxUint112 + number);
    }

    function testToUint104(uint256 number) public view returns (uint104) {
        return SafeCast.toUint104(maxUint104 + number);
    }

    function testToUint96(uint256 number) public view returns (uint96) {
        return SafeCast.toUint96(maxUint96 + number);
    }

    function testToUint88(uint256 number) public view returns (uint88) {
        return SafeCast.toUint88(maxUint88 + number);
    }

    function testToUint80(uint256 number) public view returns (uint80) {
        return SafeCast.toUint80(maxUint80 + number);
    }

    function testToUint72(uint256 number) public view returns (uint72) {
        return SafeCast.toUint72(maxUint72 + number);
    }

    function testToUint64(uint256 number) public view returns (uint64) {
        return SafeCast.toUint64(maxUint64 + number);
    }

    function testToUint56(uint256 number) public view returns (uint56) {
        return SafeCast.toUint56(maxUint56 + number);
    }

    function testToUint48(uint256 number) public view returns (uint48) {
        return SafeCast.toUint48(maxUint48 + number);
    }

    function testToUint40(uint256 number) public view returns (uint40) {
        return SafeCast.toUint40(maxUint40 + number);
    }

    function testToUint32(uint256 number) public view returns (uint32) {
        return SafeCast.toUint32(maxUint32 + number);
    }

    function testToUint24(uint256 number) public view returns (uint24) {
        return SafeCast.toUint24(maxUint24 + number);
    }

    function testToUint16(uint256 number) public view returns (uint16) {
        return SafeCast.toUint16(maxUint16 + number);
    }

    function testToUint8(uint256 number) public view returns (uint8) {
        return SafeCast.toUint8(maxUint8 + number);
    }

    function testToInt248(int256 number) public view returns (int248) {
        return SafeCast.toInt248(maxInt248 + number);
    }

    function testToInt240(int256 number) public view returns (int240) {
        return SafeCast.toInt240(maxInt240 + number);
    }

    function testToInt232(int256 number) public view returns (int232) {
        return SafeCast.toInt232(maxInt232 + number);
    }

    function testToInt224(int256 number) public view returns (int224) {
        return SafeCast.toInt224(maxInt224 + number);
    }

    function testToInt216(int256 number) public view returns (int216) {
        return SafeCast.toInt216(maxInt216 + number);
    }

    function testToInt208(int256 number) public view returns (int208) {
        return SafeCast.toInt208(maxInt208 + number);
    }

    function testToInt200(int256 number) public view returns (int200) {
        return SafeCast.toInt200(maxInt200 + number);
    }

    function testToInt192(int256 number) public view returns (int192) {
        return SafeCast.toInt192(maxInt192 + number);
    }

    function testToInt184(int256 number) public view returns (int184) {
        return SafeCast.toInt184(maxInt184 + number);
    }

    function testToInt176(int256 number) public view returns (int176) {
        return SafeCast.toInt176(maxInt176 + number);
    }

    function testToInt168(int256 number) public view returns (int168) {
        return SafeCast.toInt168(maxInt168 + number);
    }

    function testToInt160(int256 number) public view returns (int160) {
        return SafeCast.toInt160(maxInt160 + number);
    }

    function testToInt152(int256 number) public view returns (int152) {
        return SafeCast.toInt152(maxInt152 + number);
    }

    function testToInt144(int256 number) public view returns (int144) {
        return SafeCast.toInt144(maxInt144 + number);
    }

    function testToInt136(int256 number) public view returns (int136) {
        return SafeCast.toInt136(maxInt136 + number);
    }

    function testToInt128(int256 number) public view returns (int128) {
        return SafeCast.toInt128(maxInt128 + number);
    }

    function testToInt120(int256 number) public view returns (int120) {
        return SafeCast.toInt120(maxInt120 + number);
    }

    function testToInt112(int256 number) public view returns (int112) {
        return SafeCast.toInt112(maxInt112 + number);
    }

    function testToInt104(int256 number) public view returns (int104) {
        return SafeCast.toInt104(maxInt104 + number);
    }

    function testToInt96(int256 number) public view returns (int96) {
        return SafeCast.toInt96(maxInt96 + number);
    }

    function testToInt88(int256 number) public view returns (int88) {
        return SafeCast.toInt88(maxInt88 + number);
    }

    function testToInt80(int256 number) public view returns (int80) {
        return SafeCast.toInt80(maxInt80 + number);
    }

    function testToInt72(int256 number) public view returns (int72) {
        return SafeCast.toInt72(maxInt72 + number);
    }

    function testToInt64(int256 number) public view returns (int64) {
        return SafeCast.toInt64(maxInt64 + number);
    }

    function testToInt56(int256 number) public view returns (int56) {
        return SafeCast.toInt56(maxInt56 + number);
    }

    function testToInt48(int256 number) public view returns (int48) {
        return SafeCast.toInt48(maxInt48 + number);
    }

    function testToInt40(int256 number) public view returns (int40) {
        return SafeCast.toInt40(maxInt40 + number);
    }

    function testToInt32(int256 number) public view returns (int32) {
        return SafeCast.toInt32(maxInt32 + number);
    }

    function testToInt24(int256 number) public view returns (int24) {
        return SafeCast.toInt24(maxInt24 + number);
    }

    function testToInt16(int256 number) public view returns (int16) {
        return SafeCast.toInt16(maxInt16 + number);
    }

    function testToInt8(int256 number) public view returns (int8) {
        return SafeCast.toInt8(maxInt8 + number);
    }

    function testToInt256(uint256 number) public view returns (int256) {
        return SafeCast.toInt256(uint256(maxInt256) + number);
    }
}
