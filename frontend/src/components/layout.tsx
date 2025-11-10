import { ReactNode } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { RefreshCw, Clock } from "lucide-react";
import { cn } from "../lib/utils";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

type LayoutProps = {
  title: string;
  description?: string;
  lastUpdated?: string | Date;
  refreshing?: boolean;
  onRefresh?: () => void;
  formSlot: ReactNode;
  listSlot: ReactNode;
  pendingCount?: number;
};

export function Layout({
  title,
  description,
  lastUpdated,
  refreshing,
  onRefresh,
  formSlot,
  listSlot,
  pendingCount = 0
}: LayoutProps) {
  const lastUpdatedText =
    lastUpdated && formatDistanceToNowStrict(new Date(lastUpdated), { addSuffix: true });

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b from-background via-background/95 to-background",
        "text-foreground"
      )}
    >
      <div className="container flex min-h-screen flex-col gap-8 py-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground">
                {description}
                {lastUpdatedText && (
                  <span className="ml-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Updated {lastUpdatedText}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {typeof pendingCount === "number" && pendingCount > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-100/80 px-4 py-2 text-xs font-medium text-amber-900 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                <Clock className="h-3.5 w-3.5" />
                <span>{pendingCount} pending</span>
              </span>
            )}
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                Refresh
              </Button>
            )}
            <ModeToggle />
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
          <Card className="border-dashed border-primary/30 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Send Transaction</CardTitle>
              <CardDescription>
                Provide mnemonic, recipient address, amount, and optional note to submit an Algorand
                payment.
              </CardDescription>
            </CardHeader>
            <CardContent>{formSlot}</CardContent>
          </Card>
          <Card className="border-dashed border-primary/30 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest entries retrieved from the backend.</CardDescription>
            </CardHeader>
            <CardContent>{listSlot}</CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

