import { useEffect, useState } from "react";
import { algorandAPI } from "@/services/api";
import type { Transaction } from "@/types/algorand.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { RefreshCw, Pause, Play } from "lucide-react";

export default function TransactionList() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const data = await algorandAPI.getTransactions();
            // Ensure data is an array
            setTransactions(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err: any) {
            setError(
                err.response?.data?.error || err.message || "Failed to fetch transactions"
            );
            setTransactions([]); // Reset to empty array on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();

        if (!autoRefresh) return;

        // Refresh every 5 seconds
        const interval = setInterval(fetchTransactions, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusVariant = (status: string): "success" | "warning" | "destructive" => {
        switch (status) {
            case "confirmed":
                return "success";
            case "failed":
                return "destructive";
            default:
                return "warning";
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>
                            View all your Algorand transactions
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            variant="outline"
                            size="icon"
                            title={autoRefresh ? "Pause auto-refresh" : "Enable auto-refresh"}
                        >
                            {autoRefresh ? (
                                <Pause className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            onClick={fetchTransactions}
                            variant="outline"
                            size="icon"
                            disabled={loading}
                            title="Refresh now"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 mb-4">
                        {error}
                    </div>
                )}

                {loading && transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Loading transactions...
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No transactions found
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>TX ID</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx._id || tx.txId}>
                                        <TableCell className="font-mono text-xs">
                                            {tx.txId.slice(0, 10)}...
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {tx.from.slice(0, 10)}...
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {tx.to.slice(0, 10)}...
                                        </TableCell>
                                        <TableCell className="font-semibold text-primary">
                                            {tx.amount} ALGO
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(tx.status)}>
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(tx.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
