import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { Layout } from "./components/layout";
import { TransactionForm } from "./components/transaction-form";
import { TransactionList } from "./components/transaction-list";
import { useTransactions } from "./hooks/use-transactions";
import { SkeletonList } from "./components/skeleton-list";
function App() {
    const { transactions, isLoading, refresh, pendingCount } = useTransactions();
    const latestCreatedAt = useMemo(() => {
        if (!transactions.length)
            return undefined;
        return transactions[0]?.createdAt;
    }, [transactions]);
    return (_jsx(ThemeProvider, { defaultTheme: "system", storageKey: "algorand-ui-theme", children: _jsx(Layout, { title: "Algorand Operations", description: "Send transactions and monitor recent activity on the Algorand TestNet.", lastUpdated: latestCreatedAt, refreshing: isLoading, onRefresh: refresh, pendingCount: pendingCount, formSlot: _jsx(TransactionForm, { onSuccess: refresh }), listSlot: isLoading ? _jsx(SkeletonList, {}) : _jsx(TransactionList, { transactions: transactions }) }) }));
}
export default App;
