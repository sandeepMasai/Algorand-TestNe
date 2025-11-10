import algosdk from "algosdk";

const rawPublicKey = Uint8Array.from([
  153, 117, 246, 217, 195, 113,  75,
    119,  30, 176, 206, 174,  66, 125,
    199,  95, 101, 244, 207, 104, 114,
     44, 138, 218, 152,  97, 159, 147,
     41,  93, 220,  81
]);

const address = algosdk.encodeAddress(rawPublicKey);
console.log("✅ Algorand Address:", address);
