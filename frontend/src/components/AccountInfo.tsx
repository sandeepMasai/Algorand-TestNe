import { useState } from "react";
import { useAccountInfo } from "@/hooks/useAccountInfo";
import { useWallet } from "@/contexts/WalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, RefreshCw, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountInfo() {
  const { address } = useWallet();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { accountInfo, loading, error, refetch } = useAccountInfo(address, autoRefresh);

  if (!address) {
    return null;
  }

  const algoBalance = accountInfo?.amount ? accountInfo.amount / 1_000_000 : 0;
  // Ensure assets is always an array
  const assets = Array.isArray(accountInfo?.assets) ? accountInfo.assets : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Account Details
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? "Pause auto-refresh" : "Enable auto-refresh"}
            >
              {autoRefresh ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={refetch}
              disabled={loading}
              title="Refresh now"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        {loading && !accountInfo ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading account info...
          </div>
        ) : accountInfo ? (
          <>
            <div>
              <p className="text-sm text-muted-foreground mb-1">ALGO Balance</p>
              <p className="text-2xl font-bold text-primary">
                {algoBalance.toFixed(4)} ALGO
              </p>
            </div>

            {accountInfo.pendingRewards > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Rewards</p>
                <p className="text-lg font-semibold">
                  {(accountInfo.pendingRewards / 1_000_000).toFixed(4)} ALGO
                </p>
              </div>
            )}

            {assets.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Assets ({assets.length})</p>
                <div className="space-y-2">
                  {assets.slice(0, 5).map((asset) => (
                    <div
                      key={asset.assetId}
                      className="flex items-center justify-between p-2 rounded-md bg-muted"
                    >
                      <div>
                        <p className="text-sm font-medium">Asset #{asset.assetId}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.amount.toLocaleString()}
                        </p>
                      </div>
                      {asset.isFrozen && (
                        <Badge variant="outline">Frozen</Badge>
                      )}
                    </div>
                  ))}
                  {assets.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{assets.length - 5} more assets
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Status:</span>
                <Badge variant="success">{accountInfo.status}</Badge>
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

