import algosdk from "algosdk";

const mnemonic =
  "vivid slice paper monster smooth subject refuse learn climb twist layer razor shed canyon lemon power yellow echo improve hobby gift hollow pink acoustic";

try {
  const account = algosdk.mnemonicToSecretKey(mnemonic);
  console.log("✅ Sender address:", account.addr);
} catch (error) {
  console.error("❌ Invalid mnemonic:", error.message);
}
