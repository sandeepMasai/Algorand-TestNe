import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { peraWallet } from "@/contexts/WalletContext";
import { algorandAPI } from "@/services/api";
import type { TransactionRequest } from "@/types/algorand.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import algosdk from "algosdk";

interface TransactionFormProps {
    onSuccess?: () => void;
}

// Algorand TestNet configuration
const ALGOD_SERVER = import.meta.env.VITE_ALGOD_SERVER || "https://testnet-api.algonode.cloud";
const ALGOD_PORT = import.meta.env.VITE_ALGOD_PORT || "";
const ALGOD_TOKEN = import.meta.env.VITE_ALGOD_TOKEN || "";

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
    const { address, isConnected, balance, walletType } = useWallet();
    const [formData, setFormData] = useState<TransactionRequest>({
        fromMnemonic: "",
        toAddress: "",
        amount: "",
        note: "",
    });
    const [useWalletAddress, setUseWalletAddress] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // If using wallet, sign transaction with wallet
            if (useWalletAddress && isConnected && address) {
                // Validate inputs
                if (!formData.toAddress) {
                    setError("Recipient address is required");
                    setLoading(false);
                    return;
                }

                if (!formData.amount) {
                    setError("Amount is required");
                    setLoading(false);
                    return;
                }

                const numericAmount = Number(formData.amount);
                if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                    setError("Amount must be a positive number");
                    setLoading(false);
                    return;
                }

                if (balance !== null && numericAmount > balance) {
                    setError(`Insufficient balance. Available: ${balance.toFixed(4)} ALGO`);
                    setLoading(false);
                    return;
                }

                // Only PeraWallet supports signing
                if (walletType !== "pera") {
                    setError("Transaction signing is only supported with PeraWallet. Please connect PeraWallet or use mnemonic.");
                    setLoading(false);
                    return;
                }

                try {
                    // Create Algod client
                    const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

                    // Get suggested parameters
                    const suggestedParams = await algodClient.getTransactionParams().do();

                    // Create transaction
                    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                        sender: address,
                        receiver: formData.toAddress,
                        amount: Math.round(numericAmount * 1_000_000), // Convert ALGO to microAlgos
                        note: formData.note ? new TextEncoder().encode(formData.note) : undefined,
                        suggestedParams,
                    });

                    // Sign transaction with PeraWallet
                    // PeraWallet expects an array of transaction objects with 'txn' property
                    const signedTxns = await peraWallet.signTransaction([
                        {
                            txn: txn,
                        } as any, // Type assertion for PeraWallet compatibility
                    ]);

                    // Validate signedTxns is an array
                    if (!Array.isArray(signedTxns) || signedTxns.length === 0) {
                        throw new Error("Transaction signing was cancelled or failed - invalid response");
                    }

                    // Get the first signed transaction
                    const signedTxnBytes = signedTxns[0];

                    // Validate it's a Uint8Array or array-like object
                    if (!signedTxnBytes) {
                        throw new Error("Transaction signing failed - no signed transaction data");
                    }

                    // Convert signed transaction (Uint8Array) to base64
                    // Use browser-compatible base64 encoding
                    // Handle both Uint8Array and regular arrays
                    let signedTxnBase64: string;
                    if (signedTxnBytes instanceof Uint8Array) {
                        // For Uint8Array, convert to base64 safely
                        const binaryString = Array.from(signedTxnBytes)
                            .map((byte: number) => String.fromCharCode(byte))
                            .join('');
                        signedTxnBase64 = btoa(binaryString);
                    } else if (Array.isArray(signedTxnBytes)) {
                        // If it's already an array
                        const binaryString = (signedTxnBytes as number[])
                            .map((byte: number) => String.fromCharCode(byte))
                            .join('');
                        signedTxnBase64 = btoa(binaryString);
                    } else {
                        throw new Error("Invalid signed transaction format");
                    }

                    // Send signed transaction to backend
                    const result = await algorandAPI.sendSignedTransaction({
                        signedTxn: signedTxnBase64,
                        fromAddress: address,
                        toAddress: formData.toAddress,
                        amount: numericAmount,
                        note: formData.note,
                    });

                    setSuccess(`Transaction sent successfully! TX ID: ${result.txId}`);
                    setFormData({
                        fromMnemonic: "",
                        toAddress: "",
                        amount: "",
                        note: "",
                    });
                    if (onSuccess) {
                        onSuccess();
                    }
                } catch (signError: any) {
                    // Handle signing errors
                    if (signError?.data?.type === "SIGN_MODAL_CLOSED" || signError?.message?.includes("cancelled")) {
                        setError("Transaction signing was cancelled");
                    } else {
                        setError(
                            signError?.response?.data?.error ||
                            signError?.message ||
                            "Failed to sign transaction. Please try again."
                        );
                    }
                }
                setLoading(false);
                return;
            }

            // Use mnemonic-based transaction
            const result = await algorandAPI.sendTransaction(formData);
            setSuccess(`Transaction sent successfully! TX ID: ${result.txId}`);
            setFormData({
                fromMnemonic: "",
                toAddress: "",
                amount: "",
                note: "",
            });
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            setError(
                err.response?.data?.error || err.message || "Failed to send transaction"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Send ALGO Transaction</CardTitle>
                <CardDescription>
                    Send ALGO tokens on Algorand TestNet
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isConnected && (
                    <div className="mb-4 p-3 bg-primary/10 rounded-md border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Wallet Connected</span>
                            </div>
                            <Badge variant="success">{address?.slice(0, 6)}...{address?.slice(-4)}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="useWallet"
                                checked={useWalletAddress}
                                onChange={(e) => setUseWalletAddress(e.target.checked)}
                                className="rounded"
                            />
                            <Label htmlFor="useWallet" className="text-sm cursor-pointer">
                                Use connected wallet address
                            </Label>
                        </div>
                        {useWalletAddress && balance !== null && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Available: {balance.toFixed(4)} ALGO
                            </p>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!useWalletAddress && (
                        <div className="space-y-2">
                            <Label htmlFor="fromMnemonic">
                                From Mnemonic (25 words) <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="fromMnemonic"
                                name="fromMnemonic"
                                value={formData.fromMnemonic}
                                onChange={handleChange}
                                placeholder="Enter your 25-word mnemonic phrase"
                                rows={3}
                                required={!useWalletAddress}
                                disabled={useWalletAddress}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="toAddress">
                            To Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            type="text"
                            id="toAddress"
                            name="toAddress"
                            value={formData.toAddress}
                            onChange={handleChange}
                            placeholder="Enter recipient address"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">
                            Amount (ALGO) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.0"
                            step="0.000001"
                            min="0"
                            max={useWalletAddress && balance ? balance : undefined}
                            required
                        />
                        {useWalletAddress && balance !== null && (
                            <p className="text-xs text-muted-foreground">
                                Max: {balance.toFixed(4)} ALGO
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note">Note (Optional)</Label>
                        <Textarea
                            id="note"
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            placeholder="Transaction note"
                            rows={2}
                        />
                    </div>

                    {error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-700 dark:text-green-400 border border-green-500/20 break-words">
                            {success}
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Sending..." : "Send Transaction"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
