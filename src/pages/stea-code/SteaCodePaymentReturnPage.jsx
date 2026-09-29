import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Code2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  getSteaCodeOrder,
  getSteaCodeProductAccess,
  getSteaCodeProductContent,
} from "../../services/steaCodeCommerce.js";

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

function formatDate(value) {
  if (!value) return "—";

  try {
    const date =
      typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : value?.seconds
          ? new Date(value.seconds * 1000)
          : new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function shortOrderId(value) {
  const id = String(value || "");
  if (id.length <= 18) return id || "—";
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

export default function SteaCodePaymentReturnPage({
  orderId,
  locale = "en",
  onBack,
  onGoPurchases,
  onGoProduct,
  onRequireAuth,
}) {
  const zh = locale === "zhCN";

  const [state, setState] = useState({
    phase: "checking",
    order: null,
    error: "",
  });

  const [retryNonce, setRetryNonce] = useState(0);

  const mountedRef = useRef(false);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);
  const requestFailuresRef = useRef(0);

  const onRequireAuthRef = useRef(onRequireAuth);
  const onGoPurchasesRef = useRef(onGoPurchases);
  const onGoProductRef = useRef(onGoProduct);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onRequireAuthRef.current = onRequireAuth;
  }, [onRequireAuth]);

  useEffect(() => {
    onGoPurchasesRef.current = onGoPurchases;
  }, [onGoPurchases]);

  useEffect(() => {
    onGoProductRef.current = onGoProduct;
  }, [onGoProduct]);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    startedAtRef.current = Date.now();
    requestFailuresRef.current = 0;

    let attempt = 0;

    const delays = [0, 1000, 2000, 3000, 5000];

    const scheduleNext = () => {
      if (!mountedRef.current) return;

      const elapsed = Date.now() - startedAtRef.current;

      /*
       * 45 seconds changes the UI only.
       * It must NEVER stop payment verification.
       *
       * Stripe/webhooks/network can legitimately be delayed.
       * Continue server reconciliation in the background.
       */
      const delayed = elapsed >= 45000;

      if (delayed) {
        setState((prev) => ({
          ...prev,
          phase:
            prev.phase === "success"
              ? "success"
              : "delayed",
          error: "",
        }));
      }

      attempt += 1;

      const delay = delayed
        ? 10000
        : attempt < delays.length
          ? delays[attempt]
          : 5000;

      timerRef.current =
        window.setTimeout(runCheck, delay);
    };

    const runCheck = async () => {
      if (!mountedRef.current) return;

      if (!orderId) {
        setState({
          phase: "error",
          order: null,
          error: zh
            ? "缺少订单编号。"
            : "Order reference is missing.",
        });
        return;
      }

      try {
        const result = await getSteaCodeOrder(orderId);

        if (!mountedRef.current) return;

        requestFailuresRef.current = 0;

        const order = result?.order || null;
        const status = String(order?.status || "pending").toLowerCase();

        if (status === "paid") {
          clearTimer();

          /*
           * Payment is confirmed, but do not jump directly
           * to the receipt yet.
           *
           * First verify that the purchased source package
           * is actually accessible to this account.
           */
          setState({
            phase: "unlocking",
            order,
            error: "",
          });

          try {
            const productId = String(
              order?.productId || ""
            ).trim();

            if (!productId) {
              throw new Error(
                "Purchased product ID is missing."
              );
            }

            await getSteaCodeProductAccess(productId);

            const content =
              await getSteaCodeProductContent(productId);

            if (
              !content?.access ||
              !Array.isArray(content?.product?.files) ||
              content.product.files.length === 0
            ) {
              throw new Error(
                "Purchased source package is not ready."
              );
            }

            if (!mountedRef.current) return;

            /*
             * Keep the unlock step visible briefly so the
             * customer can actually see the final progress
             * stage complete instead of visually skipping it.
             */
            await new Promise((resolve) =>
              window.setTimeout(resolve, 900)
            );

            if (!mountedRef.current) return;

            setState({
              phase: "success",
              order,
              error: "",
            });
          } catch (unlockError) {
            console.error(
              "[STEA CODE UNLOCK TRACE]",
              {
                message:
                  unlockError?.message ||
                  "Unlock verification failed",
                code:
                  unlockError?.code || null,
                status:
                  unlockError?.status || null,
              }
            );

            if (!mountedRef.current) return;

            setState({
              phase: "unlock-delayed",
              order,
              error: "",
            });
          }

          return;
        }

        if (status === "failed") {
          clearTimer();

          setState({
            phase: "failed",
            order,
            error: "",
          });

          return;
        }

        if (status === "canceled" || status === "cancelled") {
          clearTimer();

          setState({
            phase: "canceled",
            order,
            error: "",
          });

          return;
        }

        setState({
          phase: status === "processing" ? "processing" : "checking",
          order,
          error: "",
        });

        scheduleNext();
      } catch (error) {
        if (!mountedRef.current) return;

        const code = String(error?.code || "");
        const status = Number(error?.status || 0);

        if (code === "AUTH_REQUIRED" || status === 401) {
          clearTimer();

          setState((prev) => ({
            ...prev,
            phase: "auth",
            error: "",
          }));

          if (typeof onRequireAuthRef.current === "function") {
            onRequireAuthRef.current(orderId);
          }

          return;
        }

        if (code === "ORDER_ACCESS_DENIED" || status === 403) {
          clearTimer();

          setState((prev) => ({
            ...prev,
            phase: "error",
            error: zh
              ? "你无法查看此订单。"
              : "You do not have permission to view this order.",
          }));

          return;
        }

        requestFailuresRef.current += 1;

        /*
         * Temporary network/API errors must never permanently
         * stop payment verification.
         *
         * Show the delayed state after repeated failures but keep
         * trying automatically.
         */
        const repeatedFailure =
          requestFailuresRef.current >= 4;

        setState((prev) => ({
          ...prev,
          phase: repeatedFailure
            ? "delayed"
            : prev.order
              ? "processing"
              : "checking",
          error: "",
        }));

        scheduleNext();
      }
    };

    runCheck();

    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, [orderId, zh, retryNonce, clearTimer]);

  const { phase, order, error } = state;

  const retry = () => {
    clearTimer();

    setState((prev) => ({
      phase: "checking",
      order: prev.order,
      error: "",
    }));

    setRetryNonce((value) => value + 1);
  };

  const openProduct = () => {
    if (order?.productId && typeof onGoProductRef.current === "function") {
      onGoProductRef.current(order.productId);
      return;
    }

    onBackRef.current?.();
  };

  const goPurchases = () => {
    onGoPurchasesRef.current?.();
  };

  const goBack = () => {
    onBackRef.current?.();
  };

  const productTitle =
    order?.productSnapshot?.title ||
    (zh ? "STEA Code 产品" : "STEA Code Product");

  return (
    <main className="sc-checkout-page sc-return-page sc-return-premium">
      <header className="sc-checkout-header">
        <button type="button" onClick={goBack}>
          <ArrowLeft size={15} />
          {zh ? "返回" : "Back"}
        </button>

        <a
          className="sc-checkout-brand"
          href="/code"
          aria-label="STEA Code"
        >
          <span className="sc-checkout-brand-mark sc-checkout-brand-logo">
            <img
              src="/stea-apps/stea-code.png"
              alt=""
              aria-hidden="true"
            />
          </span>
          <strong>STEA Code</strong>
        </a>

        <span className="sc-checkout-secure">
          <ShieldCheck size={14} />
          {zh ? "安全付款" : "Secure payment"}
        </span>
      </header>

      <div className="sc-return-premium-stage">
        {(phase === "checking" ||
          phase === "processing" ||
          phase === "auth" ||
          phase === "unlocking") && (
          <section className="sc-return-premium-card is-verifying">
            <div className="sc-return-orbit" aria-hidden="true">
              <span />
              <Code2 size={24} />
            </div>

            <div className="sc-return-eyebrow">
              <ShieldCheck size={13} />
              {zh ? "安全验证" : "SECURE VERIFICATION"}
            </div>

            <h1>
              {phase === "unlocking"
                ? zh
                  ? "正在解锁你的代码"
                  : "Unlocking your code"
                : phase === "processing"
                  ? zh
                    ? "付款已收到"
                    : "Payment received"
                  : zh
                    ? "正在验证付款"
                    : "Verifying your payment"}
            </h1>

            <p className="sc-return-lead">
              {phase === "unlocking"
                ? zh
                  ? "付款已确认。我们正在验证你的购买权限并准备完整源代码。"
                  : "Payment confirmed. We're verifying your access and preparing your full source package."
                : phase === "processing"
                  ? zh
                    ? "Stripe 正在完成最后确认。完成后你的代码会自动解锁。"
                    : "Stripe is completing the final confirmation. Your code will unlock automatically."
                  : zh
                    ? "我们正在与 Stripe 安全确认你的付款。"
                    : "We're securely confirming your payment with Stripe."}
            </p>

            <div className="sc-return-progress">
              <div className="is-done">
                <span><Check size={13} /></span>
                <div>
                  <strong>{zh ? "付款已提交" : "Payment submitted"}</strong>
                  <small>{zh ? "付款信息已安全发送" : "Securely sent to Stripe"}</small>
                </div>
              </div>

              <div
                className={
                  phase === "unlocking"
                    ? "is-done"
                    : "is-active"
                }
              >
                <span>
                  {phase === "unlocking"
                    ? <Check size={13} />
                    : <Loader2 size={13} />}
                </span>

                <div>
                  <strong>
                    {zh
                      ? "Stripe 确认"
                      : "Stripe confirmation"}
                  </strong>

                  <small>
                    {phase === "unlocking"
                      ? zh
                        ? "付款已确认"
                        : "Payment confirmed"
                      : zh
                        ? "正在验证交易"
                        : "Verifying transaction"}
                  </small>
                </div>
              </div>

              <div
                className={
                  phase === "unlocking"
                    ? "is-active"
                    : ""
                }
              >
                <span>
                  {phase === "unlocking"
                    ? <Loader2 size={13} />
                    : <Code2 size={13} />}
                </span>

                <div>
                  <strong>
                    {zh
                      ? "解锁代码"
                      : "Unlocking your code"}
                  </strong>

                  <small>
                    {phase === "unlocking"
                      ? zh
                        ? "正在准备完整源代码"
                        : "Preparing full source package"
                      : zh
                        ? "付款确认后立即可用"
                        : "Available immediately after confirmation"}
                  </small>
                </div>
              </div>
            </div>

            <p className="sc-return-wait-note">
              {zh
                ? "请保持此页面打开，通常只需几秒钟。"
                : "Please keep this page open. This normally takes only a few seconds."}
            </p>
          </section>
        )}

        {phase === "unlock-delayed" && (
          <section className="sc-return-premium-card is-delayed">
            <div className="sc-return-orbit is-paused">
              <RefreshCw size={23} />
            </div>

            <div className="sc-return-eyebrow">
              <ShieldCheck size={13} />
              {zh
                ? "付款已确认"
                : "PAYMENT CONFIRMED"}
            </div>

            <h1>
              {zh
                ? "正在准备你的代码"
                : "Your code is being prepared"}
            </h1>

            <p className="sc-return-lead">
              {zh
                ? "你的付款已经成功。我们只是在完成购买权限验证。请不要再次付款。"
                : "Your payment is already successful. We're only finishing your code-access verification. Do not pay again."}
            </p>

            <div className="sc-return-actions">
              <button
                type="button"
                className="sc-return-primary"
                onClick={retry}
              >
                <RefreshCw size={16} />
                {zh
                  ? "重新检查代码访问"
                  : "Check code access"}
              </button>

              <button
                type="button"
                className="sc-return-secondary"
                onClick={goPurchases}
              >
                {zh ? "我的购买" : "My Purchases"}
              </button>
            </div>
          </section>
        )}

        {phase === "success" && (
          <section className="sc-return-premium-card is-success">
            <div className="sc-return-success-mark" aria-hidden="true">
              <span className="sc-return-success-ring" />
              <Check size={34} />
            </div>

            <div className="sc-return-eyebrow is-success">
              <Check size={13} />
              {zh ? "付款已确认" : "PAYMENT CONFIRMED"}
            </div>

            <h1>{zh ? "付款成功" : "Payment successful"}</h1>

            <p className="sc-return-lead">
              {zh
                ? "购买已完成，你的完整源代码现已解锁。"
                : "Your purchase is complete and your full source code is now unlocked."}
            </p>

            <div className="sc-return-product-summary">
              <div className="sc-return-product-icon">
                <Code2 size={24} />
              </div>

              <div>
                <small>{zh ? "已购买产品" : "YOUR PURCHASE"}</small>
                <strong>{productTitle}</strong>
                <span>
                  {order?.licenseType === "commercial"
                    ? zh ? "商业许可" : "Commercial License"
                    : zh ? "个人许可" : "Personal License"}
                </span>
              </div>

              <strong className="sc-return-total">
                {money(order?.currency, order?.finalAmount)}
              </strong>
            </div>

            <div className="sc-return-unlocked">
              <div><Check size={15} /> {zh ? "完整源代码已解锁" : "Full source code unlocked"}</div>
              <div><Check size={15} /> {zh ? "已保存到我的购买" : "Saved in My Purchases"}</div>
              <div><Check size={15} /> {zh ? "可随时再次下载" : "Download again anytime"}</div>
              <div><Check size={15} /> {zh ? "同一 STEA 帐号可访问" : "Available with the same STEA account"}</div>
            </div>

            <div className="sc-return-receipt">
              <div className="sc-return-receipt-row">
                <span>{zh ? "订单编号" : "Order reference"}</span>
                <strong>{shortOrderId(order?.id)}</strong>
              </div>

              <div className="sc-return-receipt-row">
                <span>{zh ? "付款日期" : "Payment date"}</span>
                <strong>{formatDate(order?.paidAt || order?.createdAt)}</strong>
              </div>

              <div className="sc-return-receipt-row">
                <span>{zh ? "付款服务" : "Payment provider"}</span>
                <strong>Stripe</strong>
              </div>
            </div>

            <div className="sc-return-actions">
              <button
                type="button"
                className="sc-return-primary"
                onClick={openProduct}
              >
                <Code2 size={17} />
                {zh ? "访问完整代码" : "Access Full Code"}
              </button>

              <button
                type="button"
                className="sc-return-secondary"
                onClick={goPurchases}
              >
                {zh ? "我的购买" : "My Purchases"}
              </button>
            </div>

            <button
              type="button"
              className="sc-return-text-action"
              onClick={goBack}
            >
              {zh ? "返回 STEA Code" : "Back to STEA Code"}
            </button>
          </section>
        )}

        {phase === "delayed" && (
          <section className="sc-return-premium-card is-delayed">
            <div className="sc-return-orbit is-paused">
              <RefreshCw size={23} />
            </div>

            <div className="sc-return-eyebrow">
              <ShieldCheck size={13} />
              {zh ? "仍在确认" : "STILL CONFIRMING"}
            </div>

            <h1>
              {zh
                ? "付款确认时间比平常更长"
                : "Payment confirmation is taking longer than usual"}
            </h1>

            <p className="sc-return-lead">
              {zh
                ? "如果付款已经完成，请不要再次付款。你可以重新检查状态或查看我的购买。"
                : "If your payment already completed, don't pay again. You can check the status again or look in My Purchases."}
            </p>

            <div className="sc-return-actions">
              <button
                type="button"
                className="sc-return-primary"
                onClick={retry}
              >
                <RefreshCw size={16} />
                {zh ? "重新检查" : "Check again"}
              </button>

              <button
                type="button"
                className="sc-return-secondary"
                onClick={goPurchases}
              >
                {zh ? "我的购买" : "My Purchases"}
              </button>
            </div>
          </section>
        )}

        {(phase === "failed" ||
          phase === "canceled" ||
          phase === "error") && (
          <section className="sc-return-premium-card is-failed">
            <div className="sc-return-failed-mark">
              <XCircle size={32} />
            </div>

            <div className="sc-return-eyebrow is-error">
              {zh ? "付款状态" : "PAYMENT STATUS"}
            </div>

            <h1>
              {phase === "canceled"
                ? zh ? "付款已取消" : "Payment canceled"
                : zh ? "无法确认付款" : "Payment couldn't be confirmed"}
            </h1>

            <p className="sc-return-lead">
              {error ||
                (zh
                  ? "如果付款已经完成，请检查“我的购买”或重新检查状态。"
                  : "If your payment completed, check My Purchases or refresh the payment status.")}
            </p>

            <div className="sc-return-actions">
              <button
                type="button"
                className="sc-return-primary"
                onClick={retry}
              >
                <RefreshCw size={16} />
                {zh ? "重新检查" : "Check again"}
              </button>

              <button
                type="button"
                className="sc-return-secondary"
                onClick={goPurchases}
              >
                {zh ? "我的购买" : "My Purchases"}
              </button>
            </div>

            <button
              type="button"
              className="sc-return-text-action"
              onClick={goBack}
            >
              {zh ? "返回产品" : "Back to product"}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
