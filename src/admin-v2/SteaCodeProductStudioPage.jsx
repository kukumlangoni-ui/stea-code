import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import SteaCodeLogo from "../components/stea-code/SteaCodeLogo.jsx";
import { getAdminSteaCodeProducts } from "../services/steaCodeAdmin.js";
import { getSteaCodeProduct } from "../services/steaCodeCommerce.js";
import { ProductStudio } from "./SteaCodeCommercePanel.jsx";
import { ProductStudioV2 } from "./ProductStudioV2.jsx";
import { ProductStudioV3 } from "./ProductStudioV3.jsx";
import "./ProductStudioV3.css";
import { DEV_PREVIEW_PRODUCTS } from "./steaCodeDevPreviewData.js";

/**
 * Full-page Product Studio route.
 *
 *   /code-admin/products/new              → create
 *   /code-admin/products/:productId/edit  → edit
 *
 * Default editor: ProductStudioV3 (minimal 4-tab)
 * Fallbacks:
 *   ?v2=1     → ProductStudioV2
 *   ?legacy=1 → ProductStudio (classic / V1)
 *
 * DEV PREVIEW mode: resolves products from the local DEV_PREVIEW_PRODUCTS
 * fixture — no admin API call, no authentication required.
 */
export default function SteaCodeProductStudioPage({
  isSuperAdmin,
  devPreview = false,
  baseRoute = "/code-admin",
}) {
  const { productId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const editing = Boolean(productId && productId !== "new");
  const navigate = useNavigate();

  // Editor version: V3 default, V2 via ?v2=1, legacy V1 via ?legacy=1
  const useLegacy = searchParams.get("legacy") === "1";
  const useV2 = searchParams.get("v2") === "1";

  const editorVersion = useLegacy ? "v1" : useV2 ? "v2" : "v3";

  const toggleLegacy = useCallback(() => {
    const next = { ...Object.fromEntries(searchParams.entries()) };
    if (useLegacy) {
      delete next.legacy;
    } else {
      delete next.v2;
      next.legacy = "1";
    }
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, useLegacy]);

  // Deep-link tab support per editor version
  const V1_TABS = ["general", "preview", "source", "publish"];
  const V2_TABS = ["basic", "preview", "deliverables", "publish"];
  const V3_TABS = ["basic", "preview", "deliverables", "publish"];

  const allowedTabs = editorVersion === "v1" ? V1_TABS : V3_TABS;
  const requestedTab = searchParams.get("tab") || "";
  const defaultTab = editorVersion === "v1" ? "general" : "basic";
  const initialTab = allowedTabs.includes(requestedTab) ? requestedTab : defaultTab;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState("");

  const loadProduct = useCallback(async () => {
    if (!editing) {
      setProduct(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (devPreview) {
        const found = DEV_PREVIEW_PRODUCTS.find((p) => p.id === productId);
        if (!found) {
          setError(`DEV PREVIEW: Product "${productId}" was not found in the local fixture.`);
        } else {
          setProduct(found);
        }
        return;
      }
      const result = await getAdminSteaCodeProducts();
      const list = Array.isArray(result?.products) ? result.products : [];
      const found = list.find((p) => p.id === productId || p.slug === productId);
      if (!found) {
        try {
          const publicProduct = await getSteaCodeProduct(productId);
          if (publicProduct && publicProduct.id) {
            setProduct(publicProduct);
          } else {
            setError(`Product "${productId}" was not found in the catalog.`);
          }
        } catch {
          setError(`Product "${productId}" was not found in the catalog.`);
        }
      } else {
        setProduct(found);
      }
    } catch (err) {
      setError(err?.message || "Could not load this product.");
    } finally {
      setLoading(false);
    }
  }, [editing, productId, devPreview]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleBack = useCallback(() => {
    const base = baseRoute.replace(/\/$/, "");
    navigate(`${base}/products`);
  }, [navigate, baseRoute]);

  const handleCreateNew = useCallback(() => {
    const base = baseRoute.replace(/\/$/, "");
    navigate(`${base}/products/new`);
  }, [navigate, baseRoute]);

  const handleSaved = useCallback((savedProduct) => {
    // Refresh parent state with server data so product.id is available everywhere
    if (savedProduct?.id) {
      setProduct(savedProduct);
    }
  }, []);

  const handleCreated = useCallback(
    (productId) => {
      const base = baseRoute.replace(/\/$/, "");
      navigate(`${base}/products/${productId}/edit`, { replace: true });
    },
    [navigate, baseRoute]
  );

  const handlePublished = useCallback(
    () => {
      const base = baseRoute.replace(/\/$/, "");
      navigate(`${base}/products/new`);
    },
    [navigate, baseRoute]
  );

  if (loading) {
    return (
      <div className="sc-studio-route-loading">
        <Loader2 className="sc-spin" size={22} />
        <span>Loading product…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sc-studio-route-error">
        <AlertTriangle size={26} />
        <strong>Unable to load this product.</strong>
        <span className="sc-studio-route-error-msg">{error}</span>
        <div className="sc-studio-route-error-actions">
          {!devPreview && (
            <button className="admin-v2-btn-secondary" onClick={loadProduct}>
              <RefreshCw size={14} /> Retry
            </button>
          )}
          <button className="admin-v2-btn-secondary" onClick={handleBack}>
            Back to Products
          </button>
          {!devPreview && (
            <button className="admin-v2-btn-primary" onClick={handleCreateNew}>
              + Create New Product
            </button>
          )}
        </div>
      </div>
    );
  }

  // Select studio component based on version
  let StudioComponent = ProductStudioV3;
  if (editorVersion === "v1") StudioComponent = ProductStudio;
  else if (editorVersion === "v2") StudioComponent = ProductStudioV2;

  const fabLabel =
    editorVersion === "v1" ? "V1" : editorVersion === "v2" ? "V2" : "V3";
  const fabTitle =
    editorVersion === "v1"
      ? "Using legacy editor"
      : editorVersion === "v2"
      ? "Using V2 editor"
      : "ProductStudio V3 (latest)";

  return (
    <StudioComponent
      product={editing ? product : null}
      onClose={handleBack}
      onSaved={handleSaved}
      onCreated={handleCreated}
      onPublished={handlePublished}
      isSuperAdmin={isSuperAdmin}
      devPreview={devPreview}
      initialTab={initialTab}
      baseRoute={baseRoute}
      fullPage
    />
  );
}
