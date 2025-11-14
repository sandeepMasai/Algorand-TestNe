import { useWallet } from "@/contexts/WalletContext";
import AccountInfo from "./AccountInfo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, LogOut } from "lucide-react";

export default function WalletConnect() {
  const {
    address,
    isConnected,
    walletType,
    connectPeraWallet,
    connectTrustWallet,
    disconnect,
    loading,
  } = useWallet();

  if (isConnected && address) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Connected
            </CardTitle>
            <CardDescription>Your Algorand wallet is connected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Wallet Type</p>
                <Badge variant={walletType === "pera" ? "default" : "secondary"}>
                  {walletType === "pera" ? "PeraWallet" : "Trust Wallet"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Address</p>
              <p className="font-mono text-sm break-all">{address}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={disconnect} 
                variant="destructive" 
                className="flex-1"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
              <Button 
                onClick={async () => {
                  if (confirm("Are you sure you want to clear the wallet connection?")) {
                    await disconnect();
                  }
                }} 
                variant="outline" 
                className="flex-1"
                title="Clear wallet connection"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
        <AccountInfo />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </CardTitle>
        <CardDescription>
          Connect your wallet to send transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
          <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">
            Network: Algorand TestNet
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-500">
            Make sure your PeraWallet is set to TestNet in Settings before connecting.
          </p>
        </div>
        <Button
          onClick={async () => {
            try {
              await connectPeraWallet();
            } catch (error: any) {
              // Error is already handled in connectPeraWallet
              console.error("PeraWallet connection error:", error);
            }
          }}
          disabled={loading}
          className="w-full"
          variant="default"
        >
          <Wallet className="h-4 w-4 mr-2" />
          {loading ? "Connecting..." : "Connect PeraWallet"}
        </Button>
        <Button
          onClick={async () => {
            try {
              await connectTrustWallet();
            } catch (error: any) {
              // Error is already handled in connectTrustWallet
              console.error("Trust Wallet connection error:", error);
            }
          }}
          disabled={loading}
          className="w-full"
          variant="outline"
        >
          <Wallet className="h-4 w-4 mr-2" />
          {loading ? "Connecting..." : "Connect Trust Wallet"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Trust Wallet: Enter address manually | Or use mnemonic in the form below
        </p>
      </CardContent>
    </Card>
  );
}

