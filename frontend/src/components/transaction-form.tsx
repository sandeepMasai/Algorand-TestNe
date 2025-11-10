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
    .max(10_000, "Amount seems too large"),
  note: z
    .string()
    .max(255, "Note must be shorter than 255 characters")
    .optional()
});

type FormValues = z.infer<typeof schema>;

type TransactionFormProps = {
  onSuccess?: () => void;
};

const defaultValues: FormValues = {
  fromMnemonic: "",
  toAddress: "",
  amount: 0.1,
  note: ""
};

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (data: FormValues) => {
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting;

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)} autoComplete="off">
      <fieldset className="space-y-2">
        <Label htmlFor="fromMnemonic">Mnemonic (optional)</Label>
        <Textarea
          id="fromMnemonic"
          rows={4}
          placeholder="Provide 25-word mnemonic or leave empty to use backend default"
          {...register("fromMnemonic")}
        />
        {errors.fromMnemonic && (
          <p className="text-xs font-medium text-destructive">{errors.fromMnemonic.message}</p>
        )}
      </fieldset>
      <fieldset className="space-y-2">
        <Label htmlFor="toAddress">Recipient address</Label>
        <Input
          id="toAddress"
          placeholder="ALGOSDKZXW..."
          {...register("toAddress", { required: "Recipient is required" })}
        />
        {errors.toAddress && (
          <p className="text-xs font-medium text-destructive">{errors.toAddress.message}</p>
        )}
      </fieldset>
      <fieldset className="space-y-2">
        <Label htmlFor="amount">Amount (ALGO)</Label>
        <Input
          id="amount"
          type="number"
          step="0.000001"
          min="0"
          {...register("amount", {
            required: "Amount is required",
            valueAsNumber: true,
            min: { value: 0.000001, message: "Amount must be greater than zero" }
          })}
        />
        {errors.amount && (
          <p className="text-xs font-medium text-destructive">{errors.amount.message}</p>
        )}
      </fieldset>
      <fieldset className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" rows={2} {...register("note")} />
        {errors.note && (
          <p className="text-xs font-medium text-destructive">{errors.note.message}</p>
        )}
      </fieldset>
      <Button type="submit" className="w-full" disabled={disabled}>
        {disabled ? "Submitting..." : "Send Transaction"}
      </Button>
    </form>
  );
}

