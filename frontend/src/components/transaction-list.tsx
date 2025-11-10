import { formatDistanceToNow, format } from "date-fns";
import { BadgeCheck, Clock, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

export type Transaction = {
  _id: string;
  txId: string;
  from: string;
  to: string;
  amount: number;
  status: "pending" | "confirmed" | "failed";
  note?: string | null;
  createdAt: string;
  confirmedRound?: number;
};

type TransactionListProps = {
  transactions: Transaction[];
};

const statusStyles: Record<Transaction["status"], string> = {
  pending: "bg-amber-200 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  confirmed: "bg-emerald-200 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100",
  failed: "bg-rose-200 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100"
};

export function TransactionList({ transactions }: TransactionListProps) {
  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <Clock className="h-6 w-6" />
        <div>
          <p className="font-medium text-foreground">No transactions yet</p>
          <p className="text-sm">Send your first transaction to see it listed here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((txn) => (
        <article
          key={txn._id ?? txn.txId}
          className="rounded-lg border bg-gradient-to-br from-background/70 via-background to-background p-4 shadow-sm"
        >
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="font-semibold">TX:</span>
              <span className="truncate max-w-[16rem]">{txn.txId}</span>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
                statusStyles[txn.status]
              )}
            >
              {txn.status === "pending" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {txn.status === "confirmed" && <BadgeCheck className="h-3.5 w-3.5" />}
              {txn.status}
            </span>
          </header>

          <dl className="mt-3 grid gap-2 text-sm">
            <div className="grid gap-1">
              <dt className="text-muted-foreground">From</dt>
              <dd className="truncate font-mono text-xs md:text-sm">{txn.from}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-muted-foreground">To</dt>
              <dd className="truncate font-mono text-xs md:text-sm">{txn.to}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-semibold">{txn.amount} ALGO</dd>
            </div>
            {txn.note && (
              <div className="grid gap-1">
                <dt className="text-muted-foreground">Note</dt>
                <dd className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {txn.note}
                </dd>
              </div>
            )}
            <div className="grid gap-1">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-xs">
                {format(new Date(txn.createdAt), "PPpp")} ·{" "}
                {formatDistanceToNow(new Date(txn.createdAt), { addSuffix: true })}
              </dd>
            </div>
            {txn.confirmedRound && (
              <div className="grid gap-1">
                <dt className="text-muted-foreground">Confirmed round</dt>
                <dd className="font-mono text-xs">{txn.confirmedRound}</dd>
              </div>
            )}
          </dl>
        </article>
      ))}
    </div>
  );
}

