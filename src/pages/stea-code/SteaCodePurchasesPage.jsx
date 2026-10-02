import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Code2,
  Download,
  Package,
  ShoppingBag,
} from "lucide-react";

import {
  getSteaCodePurchases,
  getSteaCodeProductAccess,
  downloadSteaCodeSource,
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

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function statusLabel(status, zh) {
  if (status === "paid") return zh ? "已付款" : "Paid";
  if (status === "pending") return zh ? "待付款" : "Pending";
  if (status === "processing") return zh ? "处理中" : "Processing";
  if (status === "failed") return zh ? "失败" : "Failed";
  return status;
}

export default function SteaCodePurchasesPage({
  locale = "en",
  onGoHome,
  onGoProduct,
  onRequireAuth,
}) {
  const zh = locale === "zhCN";

  const [state, setState] = useState({
    loading: true,
    purchases: [],
    access: {},
    error: "",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getSteaCodePurchases();
        const purchases = result?.purchases || [];

        if (!active) return;
        setState((prev) => ({ ...prev, purchases, loading: false }));

        const accessMap = {};
        await Promise.all(
          purchases.map(async (purchase) => {
            const productId = purchase?.productId;
            if (!productId) return;
            try {
              await getSteaCodeProductAccess(productId);
              accessMap[productId] = true;
            } catch {
              accessMap[productId] = false;
            }
          })
        );

        if (active) {
          setState((prev) => ({ ...prev, access: accessMap }));
        }
      } catch (error) {
        if (!active) return;
        if (error?.code === "AUTH_REQUIRED") {
          setState((prev) => ({ ...prev, loading: false, error: "" }));
          if (typeof onRequireAuth === "function") {
            onRequireAuth();
          } else {
            setState((prev) => ({
              ...prev,
              error: zh ? "请先登录以查看购买。" : "Please sign in to view your purchases.",
            }));
          }
          return;
        }
        setState((prev) => ({
          ...prev,
          loading: false,
          error: zh ? "无法加载购买记录。" : "Could not load your purchases.",
        }));
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [zh, onRequireAuth]);

  const { loading, purchases, access, error } = state;

  const [downloadingId, setDownloadingId] = useState("");

  const handleDownload = async (productId) => {
    if (!productId || downloadingId) return;
    setDownloadingId(productId);
    try {
      await downloadSteaCodeSource(productId);
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setDownloadingId("");
    }
  };

  return (
    <main className="sc-purchases-page">
      <section className="sc-purchases-hero">
        <span>{zh ? "我的开发库" : "MY LIBRARY"}</span>
        <h1>{zh ? "我的开发库" : "My Library"}</h1>
        <p>
          {zh
            ? "你拥有的 steacode 产品、代码与开发资源集中在这里。"
            : "Your unlocked steacode products, source files, and developer resources."}
        </p>
      </section>

      <section className="sc-purchases-content">
        {loading ? (
          <div className="sc-purchases-loading">
            <div className="sc-checkout-spinner" />
            <span>{zh ? "正在加载开发库…" : "Loading your library…"}</span>
          </div>
        ) : error ? (
          <div className="sc-purchases-empty">
            <Package size={36} />
            <p>{error}</p>
            <button type="button" onClick={onGoHome}>
              {zh ? "探索代码" : "Explore Code"}
            </button>
          </div>
        ) : purchases.length === 0 ? (
          <div className="sc-purchases-empty">
            <ShoppingBag size={42} />
            <h2>
              {zh
                ? "你的开发库中暂无已解锁产品。"
                : "No products in your library yet."}
            </h2>
            <p>
              {zh
                ? "解锁或购买高级产品后，你可以在这里随时下载源码和查看代码。"
                : "After unlocking or purchasing code products, you can access and download source files here anytime."}
            </p>
            <button type="button" onClick={onGoHome}>
              {zh ? "探索代码" : "Explore Code"}
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="sc-purchases-grid">
            {purchases.map((purchase) => {
              const productId = purchase?.productId;
              const hasAccess = access[productId] === true;

              return (
                <article key={purchase.id} className="sc-purchase-card">
                  <div className="sc-purchase-preview">
                    {purchase.productSnapshot?.thumbnail ? (
                      <img
                        src={purchase.productSnapshot.thumbnail}
                        alt=""
                      />
                    ) : (
                      <Code2 size={28} />
                    )}
                  </div>

                  <div className="sc-purchase-body">
                    <div className="sc-purchase-meta">
                      <span className="sc-purchase-type">
                        {purchase.productSnapshot?.productType ||
                          (zh ? "数字开发产品" : "Digital developer product")}
                      </span>
                      <span
                        className={`sc-purchase-status is-${purchase.status}`}
                      >
                        {statusLabel(purchase.status, zh)}
                      </span>
                    </div>

                    <h3>
                      {purchase.productSnapshot?.title ||
                        (zh ? "steacode 产品" : "steacode Product")}
                    </h3>

                    <div className="sc-purchase-details">
                      <span>
                        {zh ? "购买日期" : "Purchased"}{" "}
                        {formatDate(purchase.paidAt || purchase.createdAt)}
                      </span>
                      <span>
                        {zh ? "许可证" : "License"}{" "}
                        {purchase.licenseType === "personal"
                          ? zh
                            ? "个人"
                            : "Personal"
                          : purchase.licenseType}
                      </span>
                      <span className="sc-purchase-price">
                        {money(purchase.currency, purchase.finalAmount)}{" "}
                        {purchase.currency}
                      </span>
                    </div>
                  </div>

                  <div className="sc-purchase-actions">
                    <button
                      type="button"
                      className="sc-product-main-action"
                      onClick={() =>
                        productId && onGoProduct
                          ? onGoProduct(productId)
                          : onGoHome()
                      }
                    >
                      {zh ? "查看产品" : "View Product"}
                    </button>

                    {hasAccess ? (
                      <button
                        type="button"
                        className="sc-checkout-ghost-button"
                        disabled={downloadingId === productId}
                        onClick={() => handleDownload(productId)}
                      >
                        <Download size={14} style={{ marginRight: "4px" }} />
                        {downloadingId === productId
                          ? zh ? "正在下载…" : "Downloading…"
                          : zh ? "下载源码" : "Download Source"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
