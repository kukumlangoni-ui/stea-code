import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Code2,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { prepareSteaCodeCheckout } from "../../services/steaCodeCommerce.js";
import SteaCodePaymentElement from "../../components/stea-code/checkout/SteaCodePaymentElement.jsx";

function money(currency, amount) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: String(currency || "USD").toUpperCase(),
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  } catch {
    return `${currency || "USD"} ${Number(amount || 0).toFixed(2)}`;
  }
}

export default function SteaCodeCheckoutPage({
  productId,
  locale = "en",
  onBack,
  onRequireAuth,
}) {
  const zh = locale === "zhCN";

  const onRequireAuthRef = useRef(onRequireAuth);

  useEffect(() => {
    onRequireAuthRef.current = onRequireAuth;
  }, [onRequireAuth]);

  const [state, setState] = useState({
    loading: true,
    order: null,
    clientSecret: "",
    error: "",
  });

  useEffect(() => {
    let active = true;

    async function prepare() {
      try {
        const result = await prepareSteaCodeCheckout({
          productId,
          licenseType: "personal",
          preferredCurrency: "USD",
        });

        if (!active) return;

        setState({
          loading: false,
          order: result.order,
          clientSecret: result.clientSecret,
          error: "",
        });
      } catch (error) {
        if (!active) return;

        console.error("[STEA CODE CHECKOUT TRACE]", {
          status: error?.status || null,
          code: error?.code || null,
          message: error?.message || "Unknown checkout error",
        });
        if (error?.message === "AUTH_REQUIRED") {
          setState({ loading: false, order: null, clientSecret: "", error: "" });
          if (typeof onRequireAuthRef.current === "function") {
            onRequireAuthRef.current(productId);
          } else {
            setState({
              loading: false,
              order: null,
              clientSecret: "",
              error: zh
                ? "购买高级产品前请先登录。"
                : "Please sign in before purchasing a premium product.",
            });
          }
          return;
        }
        setState({
          loading: false,
          order: null,
          clientSecret: "",
          error: zh ? "安全结账暂时无法准备。" : "Secure checkout could not be prepared.",
        });
      }
    }

    prepare();

    return () => {
      active = false;
    };
  }, [productId, zh]);

  if (state.loading) {
    return (
      <main className="sc-checkout-page">
        <div className="sc-checkout-preparing">
          <div className="sc-checkout-spinner" />
          <strong>
            {zh
              ? "正在准备安全结账…"
              : "Preparing secure checkout…"}
          </strong>
          <span>
            {zh
              ? "请稍候。"
              : "This should only take a moment."}
          </span>
        </div>
      </main>
    );
  }

  if (state.error || !state.order) {
    return (
      <main className="sc-checkout-page">
        <div className="sc-checkout-failure">
          <Code2 size={30} />
          <h1>
            {zh
              ? "无法打开结账"
              : "Checkout unavailable"}
          </h1>
          <p>{state.error}</p>
          <button type="button" onClick={onBack}>
            <ArrowLeft size={15} />
            {zh ? "返回产品" : "Back to product"}
          </button>
        </div>
      </main>
    );
  }

  const { order } = state;

  return (
    <main className="sc-checkout-page">
      <header className="sc-checkout-header">
        <button type="button" onClick={onBack}>
          <ArrowLeft size={15} />
          {zh ? "返回" : "Back"}
        </button>

        <a
          className="sc-checkout-brand"
          href="/code"
          aria-label="steacode"
        >
          <span className="sc-checkout-brand-mark">
            S
          </span>
          <strong>steacode</strong>
        </a>

        <span className="sc-checkout-secure">
          <ShieldCheck size={14} />
          {zh ? "安全结账" : "Secure checkout"}
        </span>
      </header>

      <section className="sc-checkout-intro">
        <span>
          {zh ? "STEA CODE CHECKOUT" : "STEA CODE CHECKOUT"}
        </span>
        <h1>
          {zh
            ? "完成购买"
            : "Complete your purchase"}
        </h1>
        <p>
          {zh
            ? "安全购买你的 steacode 数字开发产品。"
            : "Secure payment for your steacode digital product."}
        </p>
      </section>

      <div className="sc-checkout-layout">
        <section className="sc-checkout-payment-card">
          {state.clientSecret ? (
            <SteaCodePaymentElement
              order={order}
              clientSecret={state.clientSecret}
              locale={locale}
            />
          ) : (
            <div className="sc-checkout-not-configured">
              <Lock size={22} />
              <strong>
                {zh
                  ? "Stripe 配置待完成"
                  : "Stripe configuration required"}
              </strong>
              <p>
                {zh
                  ? "添加 Stripe 密钥后，安全付款表单将在这里显示。"
                  : "The secure Stripe payment form will appear here after the Stripe keys are configured."}
              </p>
            </div>
          )}
        </section>

        <aside className="sc-checkout-summary">
          <div className="sc-checkout-summary-label">
            {zh ? "订单摘要" : "Order summary"}
          </div>

          <div className="sc-checkout-product">
            <div className="sc-checkout-product-preview">
              {order.productSnapshot?.thumbnail ? (
                <img
                  src={order.productSnapshot.thumbnail}
                  alt=""
                />
              ) : (
                <Code2 size={28} />
              )}
            </div>

            <div>
              <strong>
                {order.productSnapshot?.title ||
                  "steacode Product"}
              </strong>

              <span>
                {order.productSnapshot?.productType ||
                  (zh ? "数字开发产品" : "Digital developer product")}
              </span>
            </div>
          </div>

          <div className="sc-checkout-license">
            <span>
              {zh ? "许可证" : "License"}
            </span>
            <strong>
              {order.licenseType === "personal"
                ? zh
                  ? "个人"
                  : "Personal"
                : order.licenseType}
            </strong>
          </div>

          <div className="sc-checkout-totals">
            <div>
              <span>{zh ? "小计" : "Subtotal"}</span>
              <strong>
                {money(order.currency, order.subtotal)}
              </strong>
            </div>

            {Number(order.discountAmount || 0) > 0 ? (
              <div>
                <span>{zh ? "折扣" : "Discount"}</span>
                <strong>
                  −{money(
                    order.currency,
                    order.discountAmount
                  )}
                </strong>
              </div>
            ) : null}

            <div className="is-total">
              <span>{zh ? "总计" : "Total"}</span>
              <strong>
                {money(order.currency, order.finalAmount)}
              </strong>
            </div>
          </div>

          <div className="sc-checkout-delivery">
            <Check size={16} />
            <div>
              <strong>
                {zh
                  ? "付款成功后立即交付"
                  : "Instant digital delivery"}
              </strong>
              <span>
                {zh
                  ? "付款确认后，产品将出现在你的购买库中。"
                  : "Your product unlocks in My Purchases after verified payment."}
              </span>
            </div>
          </div>

          <div className="sc-checkout-trust">
            <ShieldCheck size={14} />
            <span>
              {zh
                ? "由 Stripe 安全处理付款"
                : "Secure payment powered by Stripe"}
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}
