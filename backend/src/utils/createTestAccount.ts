import algosdk from "algosdk";

export function createTestAccount(): void {
  // Generate a new Algorand account (returns addr + sk)
  const account = algosdk.generateAccount();

  // Extract address directly (already encoded correctly)
  const address = account.addr;

  // Convert secret key to 25-word mnemonic
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

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
