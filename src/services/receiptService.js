import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateReceipt = (orderData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Colors & Styles
  const accentColor = [245, 166, 35]; // #F5A623 (STEA Orange)
  const darkBg = [10, 11, 16];
  const textColor = [33, 37, 41];
  const mutedColor = [100, 116, 139];

  // 1. Header & Logo
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, pageWidth, 45, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("STEA", 15, 22);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("SWAHILI TECH & ENTERTAINMENT", 15, 30);
  doc.text("AFRICA'S FASTEST MARKETPLACE", 15, 35);
  
  doc.setFontSize(22);
  doc.text("RECEIPT", pageWidth - 15, 28, { align: "right" });

  // 2. Transaction Info
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.text(`Receipt ID: ${orderData.orderId || "N/A"}`, 15, 60);
  doc.text(`Date: ${orderData.date || new Date().toLocaleString()}`, 15, 65);
  doc.text(`Payment: ${orderData.paymentMethod || "Direct"}`, 15, 70);
  if (orderData.paymentId || orderData.transactionId) {
    doc.text(`Transaction Ref: ${orderData.paymentId || orderData.transactionId}`, 15, 75);
  }

  // 3. Columns for Customer & Seller
  const col2Start = orderData.paymentId ? 88 : 83;
  doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER DETAILS", 15, col2Start);
  doc.setFont("helvetica", "normal");
  doc.text(`${orderData.customerName || orderData.fullName || "N/A"}`, 15, col2Start + 7);
  doc.text(`Phone: ${orderData.customerPhone || orderData.phone || "N/A"}`, 15, col2Start + 12);
  doc.text(`Delivery: ${orderData.deliveryOption || orderData.deliveryMethod || "N/A"}`, 15, col2Start + 17);
  if (orderData.address || orderData.region) {
    doc.text(`Address: ${orderData.address || orderData.region}`, 15, col2Start + 22);
  }

  doc.setFont("helvetica", "bold");
  doc.text("SELLER / PLATFORM", pageWidth / 2 + 10, col2Start);
  doc.setFont("helvetica", "normal");
  doc.text(orderData.sellerBusinessName || orderData.sellerName || "STEA Merchant", pageWidth / 2 + 10, col2Start + 7);
  doc.text("Channel: STEA Marketplace", pageWidth / 2 + 10, col2Start + 12);
  if (orderData.deliveryPrice !== undefined && orderData.deliveryPrice !== null) {
    doc.text(`Delivery Fee: ${Number(orderData.deliveryPrice).toLocaleString()} TZS`, pageWidth / 2 + 10, col2Start + 17);
  }

  // 4. Product Table
  let tableData = [];
  if (orderData.items && orderData.items.length > 0) {
    tableData = orderData.items.map(item => [
      item.name || "Product",
      `${item.quantity || 1}`,
      `${(item.unitPrice || 0).toLocaleString()} TZS`,
      `${(item.total || (item.unitPrice * item.quantity) || 0).toLocaleString()} TZS`
    ]);
  } else {
    tableData = [
      [
        orderData.productName || "Product",
        `${orderData.quantity || 1}`,
        `${(orderData.unitPrice || 0).toLocaleString()} TZS`,
        `${(orderData.totalPrice || 0).toLocaleString()} TZS`
      ]
    ];
  }

  autoTable(doc, {
    startY: 125,
    head: [["Item Description", "Qty", "Unit Price", "Total"]],
    body: tableData,
    headStyles: { fillColor: accentColor, textColor: [0, 0, 0], fontStyle: "bold" },
    bodyStyles: { textColor: textColor, fontSize: 10, cellPadding: 6 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 15, right: 15 }
  });

  // 5. Summary & Totals
  const finalY = doc.lastAutoTable.finalY + 14;
  
  const deliveryFee = orderData.deliveryPrice || orderData.deliveryFee || 0;
  const deliveryOpt = orderData.deliveryOption || orderData.deliveryMethod || "Standard";
  const totalDisplay = orderData.totalAmount || orderData.totalPrice || orderData.price || 0;

  doc.setFont("helvetica", "bold");
  doc.text("ORDER SUMMARY", 15, finalY);
  doc.setFont("helvetica", "normal");
  doc.text(`Delivery Option: ${deliveryOpt}`, 15, finalY + 8);
  doc.text(`Delivery Fee: ${Number(deliveryFee).toLocaleString()} TZS`, 15, finalY + 14);
  doc.text(`Status: Pending Confirmation`, 15, finalY + 20);
  
  // Total Box
  doc.setFillColor(...accentColor);
  doc.rect(pageWidth - 85, finalY - 5, 70, 30, "F");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text("TOTAL AMOUNT", pageWidth - 50, finalY + 5, { align: "center" });
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`${Number(totalDisplay).toLocaleString()} TZS`, pageWidth - 50, finalY + 16, { align: "center" });

  // 6. QR Code Placeholder (Optional Feature)
  // We can include a text representation or a generated QR if useful
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.text("SCAN TO VERIFY", 15, 250);
  doc.rect(15, 255, 25, 25); // Placeholder for QR
  doc.text("Authentic STEA Order", 15, 285);

  // 7. Footer
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  const footerY = 280;
  doc.text("Thank you for choosing STEA! We power the Swahili digital economy.", pageWidth / 2 + 20, footerY, { align: "center" });
  doc.text("www.stea.africa | @stea_africa", pageWidth / 2 + 20, footerY + 5, { align: "center" });

  // Save the PDF
  doc.save(`STEA_Receipt_${orderData.orderId || "Order"}.pdf`);
};
