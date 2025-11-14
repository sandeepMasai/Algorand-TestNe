"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodePublicKeyToAddress = encodePublicKeyToAddress;
const algosdk_1 = __importDefault(require("algosdk"));
// Convert a raw 32-byte public key into a readable Algorand address.
function encodePublicKeyToAddress(rawPublicKey) {
    if (rawPublicKey.length !== 32) {
        throw new Error("Invalid public key length. Expected 32 bytes.");
    }
    const address = algosdk_1.default.encodeAddress(rawPublicKey);
    return address;
}
// Example usage:
const rawPublicKey = Uint8Array.from([
    153, 117, 246, 217, 195, 113, 75, 119,
    30, 176, 206, 174, 66, 125, 199, 95,
    101, 244, 207, 104, 114, 44, 138, 218,
    152, 97, 159, 147, 41, 93, 220, 81,
]);
const address = encodePublicKeyToAddress(rawPublicKey);
console.log("✅ Algorand Address:", address);
const isValid = algosdk_1.default.isValidAddress(address);
console.log("Valid address:", isValid);
