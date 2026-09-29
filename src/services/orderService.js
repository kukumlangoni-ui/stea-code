import { getFirebaseDb, collection, addDoc, serverTimestamp, auth } from "../firebase";
import { generateReceipt } from "./receiptService";

/**
 * Unified Order Service for STEA Platform
 * Phase 9: Save to marketplace_orders + orders, no undefined values
 */

function cleanData(obj) {
  if (Array.isArray(obj)) return obj.map(cleanData);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanData(v)])
    );
  }
  return obj;
}

const ADMIN_WA = "255757053354";

export const orderService = {
  async processOrder(orderData) {
    try {
      const db = getFirebaseDb();
      if (!db) throw new Error("Database not initialized");

      const orderId = orderData.orderId || `STEA-${Date.now().toString().slice(-6).toUpperCase()}`;
      const now = serverTimestamp();

      const standardizedOrder = {
        orderId,
        customerName: orderData.customerName || orderData.fullName || "",
        customerPhone: orderData.customerPhone || orderData.phone || "",
        customerEmail: orderData.customerEmail || orderData.email || "",
        userName: orderData.customerName || orderData.fullName || "",
        userPhone: orderData.customerPhone || orderData.phone || "",
        buyerName: orderData.customerName || orderData.fullName || "",
        buyerPhone: orderData.customerPhone || orderData.phone || "",
        fullName: orderData.customerName || orderData.fullName || "",
        phone: orderData.customerPhone || orderData.phone || "",
        productId: orderData.productId || "",
        productName: orderData.productName || orderData.items?.[0]?.name || "",
        productImage: orderData.productImage || "",
        category: orderData.category || "",
        quantity: Number(orderData.quantity) || 1,
        selectedColor: orderData.selectedColor || orderData.color || "",
        color: orderData.selectedColor || orderData.color || "",
        // Variant
        selectedVariant: orderData.selectedVariant ? {
          id: orderData.selectedVariant.id || "",
          label: orderData.selectedVariant.label || "",
          groupLabel: orderData.selectedVariant.groupLabel || "",
          price: orderData.selectedVariant.price ?? null,
          sku: orderData.selectedVariant.sku || "",
        } : null,
        variantLabel: orderData.selectedVariant?.label || orderData.variantLabel || "",
        variantPrice: orderData.selectedVariant?.price ?? orderData.variantPrice ?? null,
        warranty: orderData.warranty || "",
        sellerId: orderData.sellerId || "admin",
        sellerBusinessName: orderData.sellerBusinessName || orderData.sellerName || "STEA Merchant",
        sellerName: orderData.sellerName || orderData.sellerBusinessName || "STEA Merchant",
        deliveryOption: orderData.deliveryOption || "pickup",
        deliveryPrice: Number(orderData.deliveryPrice || orderData.deliveryFee || 0),
        deliveryArea: orderData.region || orderData.address || "",
        region: orderData.region || "",
        address: orderData.address || orderData.region || "",
        paymentMethod: orderData.paymentMethod || "",
        paymentId: orderData.paymentId || orderData.transactionId || "",
        paymentNumber: orderData.paymentNumber || orderData.paymentId || "",
        transactionId: orderData.transactionId || orderData.paymentId || "",
        proofUrl: orderData.proofUrl || "",
        unitPrice: Number(orderData.unitPrice || orderData.price || 0),
        totalAmount: Number(orderData.totalAmount || orderData.price || orderData.totalPrice || 0),
        totalPrice: Number(orderData.totalAmount || orderData.price || orderData.totalPrice || 0),
        price: Number(orderData.totalAmount || orderData.price || orderData.totalPrice || 0),
        notes: orderData.notes || orderData.message || "",
        message: orderData.message || orderData.notes || "",
        items: orderData.items || [{
          name: orderData.productName || "",
          quantity: Number(orderData.quantity) || 1,
          unitPrice: Number(orderData.unitPrice || 0),
          total: Number(orderData.unitPrice || 0) * (Number(orderData.quantity) || 1)
        }],
        status: "pending",
        type: orderData.type || "marketplace",
        userId: auth?.currentUser?.uid || "anonymous",
        source: typeof window !== "undefined" ? window.location.hostname : "stea",
        createdAt: now,
        updatedAt: now,
      };

      // Add optional spare parts fields
      if (orderData.deviceType) standardizedOrder.deviceType = orderData.deviceType;
      if (orderData.deviceModel) standardizedOrder.deviceModel = orderData.deviceModel;
      if (orderData.partType) standardizedOrder.partType = orderData.partType;
      if (orderData.serialNumber) standardizedOrder.serialNumber = orderData.serialNumber;
      if (orderData.issueDescription) standardizedOrder.issueDescription = orderData.issueDescription;
      if (orderData.devicePhotoUrl) standardizedOrder.devicePhotoUrl = orderData.devicePhotoUrl;
      if (orderData.transport) standardizedOrder.transport = orderData.transport;

      const cleaned = cleanData(standardizedOrder);

      // 1. Save to marketplace_orders (primary Tanzania collection)
      const mktRef = await addDoc(collection(db, "marketplace_orders"), cleaned);

      // 2. Also save to unified orders for admin panel
      try {
        await addDoc(collection(db, "orders"), {
          ...cleaned,
          marketplaceOrderId: mktRef.id,
        });
      } catch (e) {
        console.warn("Could not save to unified orders:", e.message);
      }

      // 3. Admin notification (non-blocking)
      this.notifyAdmin(standardizedOrder).catch(e => console.warn("Notify admin failed:", e));

      return {
        success: true,
        orderId: standardizedOrder.orderId,
        docId: mktRef.id,
        order: standardizedOrder
      };
    } catch (error) {
      console.error("Order processing failed:", error);
      throw error;
    }
  },

  downloadReceipt(orderData) {
    generateReceipt({
      orderId: orderData.orderId,
      customerName: orderData.customerName || orderData.buyerName || orderData.fullName,
      customerPhone: orderData.customerPhone || orderData.buyerPhone || orderData.phone,
      location: orderData.region || orderData.address || "Digital/Direct",
      productName: orderData.productName || orderData.items?.[0]?.name || "STEA Purchase",
      quantity: orderData.quantity || orderData.items?.[0]?.quantity || 1,
      unitPrice: orderData.unitPrice || orderData.items?.[0]?.unitPrice || 0,
      totalPrice: orderData.totalAmount || orderData.totalPrice || orderData.price || 0,
      totalAmount: orderData.totalAmount || orderData.totalPrice || orderData.price || 0,
      paymentMethod: orderData.paymentMethod || "",
      paymentId: orderData.paymentId || orderData.transactionId || "",
      sellerBusinessName: orderData.sellerBusinessName || orderData.sellerName || "STEA Platform",
      sellerName: orderData.sellerName || orderData.sellerBusinessName || "STEA Platform",
      deliveryOption: orderData.deliveryOption || "pickup",
      deliveryPrice: orderData.deliveryPrice || orderData.deliveryFee || 0,
      deliveryMethod: orderData.deliveryOption || orderData.deliveryMethod || "pickup",
      address: orderData.address || orderData.region || "",
      region: orderData.region || "",
      date: new Date().toLocaleString(),
    });
  },

  async notifyAdmin(order) {
    const msg = [
      "🚨 *ODA MPYA - STEA DUKA*",
      "--------------------------",
      `*Oda ID:* ${order.orderId}`,
      `*Bidhaa:* ${order.productName}`,
      `*Idadi:* ${order.quantity}`,
      `*Mteja:* ${order.customerName}`,
      `*Simu:* ${order.customerPhone}`,
      `*Utoaji:* ${order.deliveryOption || "pickup"}`,
      `*Jumla:* TZS ${Number(order.totalAmount || order.totalPrice || 0).toLocaleString()}`,
      `*Malipo:* ${order.paymentMethod}`,
      `*Ref:* ${order.paymentId || "-"}`,
      `*Muuzaji:* ${order.sellerBusinessName || order.sellerName || "STEA"}`,
      "--------------------------",
      `Admin: ${typeof window !== "undefined" ? window.location.origin : "https://stea.co.tz"}/admin`
    ].join("\n");

    // FIX 2: Do NOT auto-open WhatsApp — only save to Firestore
    // WhatsApp to admin is available as a link in the admin panel notification
    const db = getFirebaseDb();
    if (db) {
      try {
        await addDoc(collection(db, "admin_notifications"), cleanData({
          title: "New Tanzania Order",
          message: `Order #${order.orderId} from ${order.customerName} — ${order.productName}`,
          waMessage: msg,
          waLink: `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`,
          type: "marketplace_order",
          orderId: order.orderId,
          productName: order.productName,
          customerName: order.customerName,
          totalAmount: Number(order.totalAmount || order.totalPrice || 0),
          status: "unread",
          createdAt: serverTimestamp(),
        }));
      } catch (e) {
        console.warn("Failed to save admin notification:", e.message);
      }
    }
  },

  async handlePaymentCallback(paymentDetails) {
    console.log("Processing payment callback:", paymentDetails);
  }
};
