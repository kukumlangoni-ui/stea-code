import React, { useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Lock, ShieldCheck } from "lucide-react";
import { isSteaCodeHost } from "../../../utils/subdomains.js";

const publishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

const stripePromise = publishableKey
  ? loadStripe(publishableKey)
  : null;

function PaymentForm({ order, locale = "en" }) {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const zh = locale === "zhCN";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const submitResult = await elements.submit();

      if (submitResult?.error) {
        setError(
          submitResult.error.message ||
            (zh
              ? "请检查你的付款信息。"
              : "Please check your payment information.")
        );
        return;
      }

      const isCode = typeof window !== "undefined" && isSteaCodeHost(window.location.hostname);
      const returnUrl =
        `${window.location.origin}${isCode ? "" : "/code"}` +
        `?view=payment-return&order=${encodeURIComponent(order.id)}`;

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
      });

      if (result?.error) {
        setError(
          result.error.message ||
            (zh
              ? "付款无法完成，请重试。"
              : "Your payment could not be completed. Please try again.")
        );
      }
    } catch (err) {
      console.error("STEA Code payment confirmation failed", err);

      setError(
        zh
          ? "安全结账暂时不可用。"
          : "Secure checkout is temporarily unavailable."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="sc-checkout-payment-form" onSubmit={handleSubmit}>
      <div className="sc-checkout-section-heading">
        <div>
          <span>{zh ? "付款" : "Payment"}</span>
          <strong>
            {zh ? "选择安全付款方式" : "Choose a secure payment method"}
          </strong>
        </div>

        <ShieldCheck size={18} />
      </div>

      <PaymentElement
        options={{
          layout: {
            type: "tabs",
            defaultCollapsed: false,
          },
          paymentMethodOrder: [
            "card",
            "link",
            "alipay",
            "wechat_pay",
          ],
          wallets: {
            link: "auto",
          },
        }}
      />

      {error ? (
        <div className="sc-checkout-error" role="alert">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        className="sc-checkout-pay-button"
        disabled={!stripe || !elements || submitting}
      >
        <span>
          {submitting
            ? zh
              ? "正在处理…"
              : "Processing…"
            : zh
              ? "安全付款"
              : "Pay securely"}
        </span>

        <Lock size={15} />
      </button>

      <p className="sc-checkout-security-note">
        <Lock size={12} />
        {zh
          ? "付款信息由 Stripe 安全处理。STEA 不存储你的银行卡资料。"
          : "Payment details are securely handled by Stripe. STEA does not store your card details."}
      </p>
    </form>
  );
}

export default function SteaCodePaymentElement({
  order,
  clientSecret,
  locale = "en",
}) {
  const options = useMemo(
    () => ({
      clientSecret,
      loader: "auto",
      appearance: {
        theme: "night",
        variables: {
          colorPrimary: "#f5a623",
          colorBackground: "#0a0d13",
          colorText: "#f7f8fb",
          colorDanger: "#ff6b6b",
          colorTextSecondary: "#8992a3",
          borderRadius: "11px",
          spacingUnit: "4px",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        },
        rules: {
          ".Input": {
            backgroundColor: "#090d14",
            borderColor: "rgba(255,255,255,.11)",
          },
          ".Input:focus": {
            borderColor: "#f5a623",
            boxShadow: "0 0 0 1px #f5a623",
          },
          ".Tab": {
            backgroundColor: "#090d14",
            borderColor: "rgba(255,255,255,.10)",
          },
          ".Tab--selected": {
            borderColor: "#f5a623",
            boxShadow: "0 0 0 1px rgba(245,166,35,.25)",
          },
        },
      },
    }),
    [clientSecret]
  );

  if (!stripePromise || !clientSecret) return null;

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm order={order} locale={locale} />
    </Elements>
  );
}
