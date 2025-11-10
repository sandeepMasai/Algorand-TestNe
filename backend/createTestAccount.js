// createTestAccount.js
import algosdk from 'algosdk';

function createTestAccount() {
  // Generate a new Algorand account
  const account = algosdk.generateAccount();

  // Extract the readable string address
  const address = algosdk.encodeAddress(account.addr.publicKey || account.addr || account.sk.slice(0, 32));

  // Get the 25-word mnemonic
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

  console.log(' New Algorand TestNet Account Created!');
  console.log('-----------------------------------------');
  console.log('Address:', address);
  console.log('Mnemonic (SAVE THIS SAFELY!):');
  console.log(mnemonic);
  console.log('-----------------------------------------');
  console.log('💡 Fund this address with free TestNet ALGOs here:');
  console.log('👉 https://bank.testnet.algorand.network/');
  console.log('-----------------------------------------');
}

createTestAccount();
