import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "sonner";
const schema = z.object({
    fromMnemonic: z
        .string()
        .trim()
        .optional()
        .transform((value) => value || undefined),
    toAddress: z.string().min(10, "Recipient address is required"),
    amount: z
        .number({ coerce: true })
        .positive("Amount must be greater than zero")
        .max(10000, "Amount seems too large"),
    note: z
        .string()
        .max(255, "Note must be shorter than 255 characters")
        .optional()
});
const defaultValues = {
    fromMnemonic: "",
    toAddress: "",
    amount: 0.1,
    note: ""
};
export function TransactionForm({ onSuccess }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues
    });
    const [submitting, setSubmitting] = useState(false);
    const submit = async (data) => {
        const parsed = schema.safeParse(data);
        if (!parsed.success) {
            parsed.error.issues.forEach((issue) => toast.error(issue.message));
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch("/api/algorand/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...parsed.data,
                    amount: Number(parsed.data.amount)
                })
            });
            const body = await response.json();
            if (!response.ok) {
                throw new Error(body.error || "Failed to send transaction");
            }
            toast.success(`Transaction submitted: ${body.txId}`);
            reset(defaultValues);
            onSuccess?.();
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to send transaction");
        }
        finally {
            setSubmitting(false);
        }
    };
    const disabled = submitting;
    return (_jsxs("form", { className: "space-y-4", onSubmit: handleSubmit(submit), autoComplete: "off", children: [_jsxs("fieldset", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "fromMnemonic", children: "Mnemonic (optional)" }), _jsx(Textarea, { id: "fromMnemonic", rows: 4, placeholder: "Provide 25-word mnemonic or leave empty to use backend default", ...register("fromMnemonic") }), errors.fromMnemonic && (_jsx("p", { className: "text-xs font-medium text-destructive", children: errors.fromMnemonic.message }))] }), _jsxs("fieldset", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "toAddress", children: "Recipient address" }), _jsx(Input, { id: "toAddress", placeholder: "ALGOSDKZXW...", ...register("toAddress", { required: "Recipient is required" }) }), errors.toAddress && (_jsx("p", { className: "text-xs font-medium text-destructive", children: errors.toAddress.message }))] }), _jsxs("fieldset", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "amount", children: "Amount (ALGO)" }), _jsx(Input, { id: "amount", type: "number", step: "0.000001", min: "0", ...register("amount", {
                            required: "Amount is required",
                            valueAsNumber: true,
                            min: { value: 0.000001, message: "Amount must be greater than zero" }
                        }) }), errors.amount && (_jsx("p", { className: "text-xs font-medium text-destructive", children: errors.amount.message }))] }), _jsxs("fieldset", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "note", children: "Note (optional)" }), _jsx(Textarea, { id: "note", rows: 2, ...register("note") }), errors.note && (_jsx("p", { className: "text-xs font-medium text-destructive", children: errors.note.message }))] }), _jsx(Button, { type: "submit", className: "w-full", disabled: disabled, children: disabled ? "Submitting..." : "Send Transaction" })] }));
}
