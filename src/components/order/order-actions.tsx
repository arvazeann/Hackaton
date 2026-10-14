"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { cancelReasonSchema } from "@/schemas";
import type { z } from "zod";
import type { OrderStatus } from "@/types";
import type { PaymentAccountDTO } from "@/types";
import { FieldError } from "@/components/forms/field-error";
import { requestApi } from "@/components/forms/request-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type CancelValues = z.infer<typeof cancelReasonSchema>;
export function OrderActions({
  orderId,
  status,
  role,
}: {
  orderId: string;
  status: OrderStatus;
  role: "buyer" | "seller";
}) {
  const router = useRouter(),
    [showCancel, setShowCancel] = useState(false);
  const [accounts, setAccounts] = useState<PaymentAccountDTO[]>([]);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    if (role !== "seller" || status !== "pending") return;
    void fetch("/api/profile/hub")
      .then(async (response) => {
        if (!response.ok) return;
        const body = await response.json();
        const active = (body.data?.paymentAccounts ?? []).filter(
          (account: PaymentAccountDTO) => account.isActive,
        );
        setAccounts(active);
        setPaymentAccountId(active[0]?.id ?? "");
      })
      .catch(() => setActionError("Akun pembayaran gagal dimuat."));
  }, [role, status]);
  const canCancel =
    status === "confirmed" || (status === "pending" && role === "buyer");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CancelValues>({
    resolver: zodResolver(cancelReasonSchema),
    mode: "onChange",
    defaultValues: { reason: "" },
  });
  async function act(action: "confirm" | "reject" | "complete") {
    setActionError("");
    if (action === "confirm" && !paymentAccountId) {
      setActionError(
        "Tambahkan akun pembayaran sebelum mengonfirmasi pesanan.",
      );
      return;
    }
    const result = await requestApi(
      `/api/orders/${encodeURIComponent(orderId)}`,
      "PATCH",
      { action, ...(action === "confirm" ? { paymentAccountId } : {}) },
    );
    if (result.success) router.refresh();
    else setActionError(result.error.message);
  }
  async function cancel(values: CancelValues) {
    const result = await requestApi(
      `/api/orders/${encodeURIComponent(orderId)}`,
      "PATCH",
      { action: "cancel", reason: values.reason },
    );
    if (result.success) {
      setShowCancel(false);
      reset();
      router.refresh();
    }
  }
  if (["rejected", "cancelled", "completed"].includes(status)) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {role === "seller" && status === "pending" && (
        <>
          {accounts.length ? (
            <label className="grid w-full gap-1 text-xs font-medium">
              Instruksi pembayaran untuk pesanan ini
              <Select
                value={paymentAccountId}
                onValueChange={setPaymentAccountId}
              >
                <SelectTrigger
                  aria-label="Instruksi pembayaran untuk pesanan ini"
                  className="w-full min-w-0 justify-start rounded-lg bg-card px-3 py-2"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.providerName} ···· {account.accountNumberLast4} (
                      {account.accountHolderName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          ) : (
            <a
              className="w-full text-sm font-medium text-primary underline"
              href="/profile#payments"
            >
              Tambahkan akun pembayaran untuk mengonfirmasi pesanan
            </a>
          )}
          <button
            type="button"
            disabled={accounts.length === 0}
            onClick={() => act("confirm")}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Konfirmasi
          </button>
          <button
            type="button"
            onClick={() => act("reject")}
            className="rounded-full border px-4 py-2 text-xs font-semibold"
          >
            Tolak
          </button>
        </>
      )}
      {actionError && (
        <p role="alert" className="w-full text-sm text-status-error-ink">
          {actionError}
        </p>
      )}
      {role === "seller" && status === "confirmed" && (
        <button
          type="button"
          onClick={() => act("complete")}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          Tandai selesai
        </button>
      )}
      {canCancel && (
        <button
          type="button"
          onClick={() => setShowCancel((value) => !value)}
          className="rounded-full border border-status-error-ink px-4 py-2 text-xs font-semibold text-status-error-ink"
        >
          Batalkan
        </button>
      )}
      {showCancel && (
        <form
          className="w-full rounded-xl border border-status-error-ink bg-status-error-bg p-4"
          onSubmit={handleSubmit(cancel)}
        >
          <label className="grid gap-1 text-sm font-medium">
            Alasan pembatalan
            <textarea
              {...register("reason")}
              minLength={5}
              maxLength={500}
              required
              rows={2}
              className="rounded-lg border bg-card p-2 font-normal"
            />
          </label>
          <FieldError message={errors.reason?.message} />
          <div className="mt-2 flex gap-2">
            <button
              disabled={isSubmitting || !isValid}
              className="rounded-full bg-status-error-ink px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Konfirmasi pembatalan
            </button>
            <button
              type="button"
              onClick={() => setShowCancel(false)}
              className="rounded-full border px-4 py-2 text-xs"
            >
              Kembali
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
