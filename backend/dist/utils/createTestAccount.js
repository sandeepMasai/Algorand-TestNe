"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestAccount = createTestAccount;
const algosdk_1 = __importDefault(require("algosdk"));
function createTestAccount() {
    // Generate a new Algorand account (returns addr + sk)
    const account = algosdk_1.default.generateAccount();
    // Extract address directly (already encoded correctly)
    const address = account.addr;
    // Convert secret key to 25-word mnemonic
    const mnemonic = algosdk_1.default.secretKeyToMnemonic(account.sk);
    console.log(" New Algorand TestNet Account Created!");
    console.log("-----------------------------------------");
    console.log(" Address:", address);
    console.log(" Mnemonic (SAVE THIS SAFELY!):");
    console.log(mnemonic);
    console.log("-----------------------------------------");
    console.log(" Fund this address with free TestNet ALGOs here:");
    console.log(" https://bank.testnet.algorand.network/");
    console.log("-----------------------------------------");
}
// Run directly if executed as a script
if (require.main === module) {
    createTestAccount();
}
