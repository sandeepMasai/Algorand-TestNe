import algosdk from "algosdk";

const account = algosdk.generateAccount();
const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

console.log("✅ New Algorand TestNet account created!");
console.log("Address:", account.addr);
console.log("Mnemonic:", mnemonic);
console.log("\n💡 Fund this address with free TestNet ALGOs at:");
console.log("👉 https://bank.testnet.algorand.network/");
