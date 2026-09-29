import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Smartphone, Download, Check, AlertCircle } from 'lucide-react';
import { getFirebaseDb, collection, onSnapshot, query } from '../firebase.js';

export function AgizaChinaOrderForm({ product }) {
  const [qty, setQty] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    deliveryArea: '',
    specialInstructions: '',
    paymentMethod: '',
    transactionId: ''
  });
  const [errors, setErrors] = useState({});
  const [pdfLoading, setPdfLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const receiptRef = useRef(null);

  useEffect(() => {
    const db = getFirebaseDb();
    const unsub = onSnapshot(collection(db, "chaba_payment_methods"), (snap) => {
        setPaymentMethods(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
        console.error("Firestore error (chaba_payment_methods):", err);
    });
    return unsub;
  }, []);

  const price = product?.price || 0;
  const totalPrice = price * qty;

  const validatePhone = (phone) => {
    // TZ format: 0... or 255... (10 or 12 digits)
    const regex = /^(0|255)[67][0-9]{8}$/;
    return regex.test(phone.replace(/\+/g, ''));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const isFormValid = formData.name && validatePhone(formData.phone) && validatePhone(formData.whatsapp) && formData.deliveryArea && formData.transactionId && formData.paymentMethod;

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Jina linahitajika";
    if (!validatePhone(formData.phone)) newErrors.phone = "Namba ya simu isiyo sahihi (e.g. 0712345678)";
    if (!validatePhone(formData.whatsapp)) newErrors.whatsapp = "Namba ya WhatsApp isiyo sahihi";
    if (!formData.deliveryArea) newErrors.deliveryArea = "Eneo la kutolea linahitajika";
    if (!formData.paymentMethod) newErrors.paymentMethod = "Chagua njia ya malipo";
    if (!formData.transactionId) newErrors.transactionId = "Ingiza Transaction ID";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const orderId = `STEA-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNumber(orderId);
    setLoading(true);

    try {
      const db = getFirebaseDb();
      const { addDoc, serverTimestamp } = await import('firebase/firestore');
      
      await addDoc(collection(db, "chaba_orders"), {
        orderId,
        productId: product?.id || 'unknown',
        productName: product?.name || 'Unknown Product',
        quantity: qty,
        totalPrice,
        userName: formData.name,
        userPhone: formData.phone,
        userWhatsapp: formData.whatsapp,
        deliveryArea: formData.deliveryArea,
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId,
        status: 'pending',
        createdAt: serverTimestamp(),
        specialInstructions: formData.specialInstructions
      });

      setSubmitted(true);
      // Removed automatic WhatsApp redirect per requirements
    } catch (error) {
      console.error("Order save error:", error);
      alert("Imeshindwa kuhifadhi oda. Tafadhali jaribu tena.");
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsAppLink = (id) => {
    const message = `
*Oda Mpya - Agiza China / STEA*
Order #: ${id}
Bidhaa: ${product?.name} (x${qty})
Jumla: ${totalPrice.toLocaleString()} TZS
Njia ya Malipo: ${formData.paymentMethod}
Transaction ID: ${formData.transactionId}

*Mteja:*
Jina: ${formData.name}
Simu: ${formData.phone}
WhatsApp: ${formData.whatsapp}
Eneo: ${formData.deliveryArea}
`.trim();
    return `https://wa.me/255757053354?text=${encodeURIComponent(message)}`;
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    const canvas = await html2canvas(receiptRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
    pdf.save(`Receipt_${orderNumber}.pdf`);
    setPdfLoading(false);
  };

  if (submitted) {
    return (
        <div className="bg-[#0e101a] p-8 rounded-3xl border border-white/10 text-white font-sans max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/10">
                <Check size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Malipo Yamefanikiwa!</h2>
            <p className="text-white/60 mb-8">Nambari yako ya oda ni <span className="text-amber-500 font-bold">#{orderNumber}</span>. Hakikisha unapakuwa risiti yako hapa chini.</p>
            
            <div className="space-y-4">
                <button onClick={downloadPDF} disabled={pdfLoading} className="flex items-center justify-center gap-2 w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-amber-600/20">
                    <Download size={20} /> {pdfLoading ? 'Inapakua...' : 'Pakua Risiti (PDF)'}
                </button>
                
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => window.open(generateWhatsAppLink(orderNumber), '_blank')} className="flex items-center justify-center gap-2 bg-green-600/10 hover:bg-green-600/20 text-green-500 font-bold py-4 rounded-xl transition border border-green-500/20">
                        WhatsApp Admin
                    </button>
                    <button onClick={() => window.location.reload()} className="bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition border border-white/10">
                        Rudi Dukani
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-[#0e101a] p-6 rounded-3xl border border-white/10 text-white font-sans max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Kamilisha Oda</h2>
        <div className="bg-amber-600/10 text-amber-500 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider border border-amber-600/20">Agiza China</div>
      </div>

      {/* User Guidance */}
      <div className="bg-amber-600/5 border border-amber-600/10 rounded-2xl p-4 mb-6">
        <h4 className="text-amber-500 text-xs font-bold uppercase mb-2 flex items-center gap-2">
            <AlertCircle size={14} /> Jinsi ya Kulipa na Kuendelea:
        </h4>
        <ul className="text-xs text-white/70 space-y-1.5 list-decimal pl-4">
            <li>Chagua njia ya malipo unayopendelea.</li>
            <li>Lipa kiasi husika kwa namba iliyotajwa.</li>
            <li>Weka <b>Transaction ID</b> ya malipo yako.</li>
            <li>Bonyeza <b>Tuma Malipo & Oda</b>.</li>
            <li>Pakua risiti yako baada ya kukamilisha.</li>
        </ul>
      </div>

      {/* Calculator */}
      <div className="bg-white/5 p-4 rounded-2xl mb-6">
        <p className="text-sm text-white/60 mb-2">Quantity</p>
        <input type="number" min="1" value={qty} onChange={(e) => setQty(parseInt(e.target.value))} className="w-full bg-black rounded-lg p-2 text-white border border-white/10" />
        <p className="text-xl font-bold mt-4">Total: {totalPrice.toLocaleString()} TZS</p>
      </div>

      {/* User Details */}
      <div className="space-y-4 mb-6">
        <div>
            <input name="name" placeholder="Full Name *" value={formData.name} onChange={handleInputChange} className={`w-full bg-white/5 rounded-xl p-3 border ${errors.name ? 'border-red-500' : 'border-white/10'}`} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
            <input name="phone" placeholder="Phone Number (e.g. 0712345678) *" value={formData.phone} onChange={handleInputChange} className={`w-full bg-white/5 rounded-xl p-3 border ${errors.phone ? 'border-red-500' : 'border-white/10'}`} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
        <div>
            <input name="whatsapp" placeholder="WhatsApp Number (e.g. 0712345678) *" value={formData.whatsapp} onChange={handleInputChange} className={`w-full bg-white/5 rounded-xl p-3 border ${errors.whatsapp ? 'border-red-500' : 'border-white/10'}`} />
            {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
        </div>
        <div>
            <input name="deliveryArea" placeholder="Delivery Area / Region *" value={formData.deliveryArea} onChange={handleInputChange} className={`w-full bg-white/5 rounded-xl p-3 border ${errors.deliveryArea ? 'border-red-500' : 'border-white/10'}`} />
            {errors.deliveryArea && <p className="text-red-500 text-xs mt-1">{errors.deliveryArea}</p>}
        </div>
        <textarea name="specialInstructions" placeholder="Special Instructions (optional)" value={formData.specialInstructions} onChange={handleInputChange} className="w-full bg-white/5 rounded-xl p-3 border border-white/10" />
      </div>

      {/* Payment Selection */}
      <div className="mb-6">
        <p className="text-sm text-white/60 mb-2">Select Payment Method</p>
        <div className="grid gap-3">
          {paymentMethods.filter(m => m.active).map(m => {
            const active = formData.paymentMethod === m.name;
            return (
              <div 
                key={m.id} 
                onClick={() => setFormData({ ...formData, paymentMethod: m.name })}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${active ? 'bg-amber-600/10 border-amber-600 shadow-lg shadow-amber-600/5' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
              >
                <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold ${active ? 'text-amber-500' : 'text-white'}`}>{m.name}</span>
                    {active && <div className="w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center"><Check size={12} className="text-black font-black" /></div>}
                </div>
                <div className="text-sm font-mono text-white/90 bg-black/30 p-2 rounded-lg mb-2 flex items-center justify-between">
                    <span>Acc: <b>{m.accountNumber}</b></span>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(m.accountNumber);
                            alert("Copied!");
                        }}
                        className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20"
                    >
                        Copy
                    </button>
                </div>
                {m.instructions && <p className="text-[11px] text-white/40 italic">{m.instructions}</p>}
              </div>
            );
          })}
        </div>
        {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod}</p>}
        
        <div className="mt-4">
            <label className="text-[11px] font-bold text-white/40 uppercase mb-2 block">Transaction ID / Receipt Number</label>
            <input name="transactionId" placeholder="Mfn: SKE872635..." value={formData.transactionId} onChange={handleInputChange} className={`w-full bg-white/5 rounded-xl p-3 border ${errors.transactionId ? 'border-red-500' : 'border-white/10'} font-mono uppercase`} />
            {errors.transactionId && <p className="text-red-500 text-xs mt-1">{errors.transactionId}</p>}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <button 
            onClick={handleSubmit} 
            disabled={loading}
            className={`flex items-center justify-center gap-2 w-full ${loading ? 'bg-green-600/50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white font-bold py-4 rounded-xl transition shadow-lg shadow-green-600/20`}
        >
          {loading ? (
             <>
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               Inatuma...
             </>
          ) : (
            <>
              <Smartphone size={20} /> Tuma Malipo & Oda
            </>
          )}
        </button>
      </div>

      {/* Hidden Receipt Template for PDF */}
      <div className="hidden">
        <div ref={receiptRef} className="p-10 bg-white text-black font-sans" style={{ width: '800px' }}>
            <div className="text-center mb-8 border-b pb-6">
                <h1 className="text-4xl font-extrabold text-amber-600">STEA MARKETPLACE</h1>
                <p className="text-gray-500 mt-1">Official Receipt - Agiza China</p>
            </div>
            
            <div className="flex justify-between mb-8">
                <div>
                    <h3 className="text-gray-400 uppercase text-xs font-bold mb-1">Order Details</h3>
                    <p className="text-lg font-bold">#{orderNumber}</p>
                    <p className="text-sm">{new Date().toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <h3 className="text-gray-400 uppercase text-xs font-bold mb-1">Customer</h3>
                    <p className="text-lg font-bold">{formData.name}</p>
                    <p className="text-sm">{formData.phone}</p>
                </div>
            </div>

            <div className="mb-8 overflow-hidden rounded-lg border">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product?.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{price.toLocaleString()} TZS</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{qty}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">{totalPrice.toLocaleString()} TZS</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end gap-x-20 pr-6">
                <div className="text-right">
                    <p className="text-gray-500 text-sm">Payment Method:</p>
                    <p className="font-bold">{formData.paymentMethod}</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500 text-sm">Transaction ID:</p>
                    <p className="font-bold font-mono">{formData.transactionId}</p>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t text-center">
                <p className="text-amber-600 font-bold mb-1 italic">Thank you for shopping with STEA!</p>
                <p className="text-gray-400 text-xs">This is a system generated receipt and serves as proof of payment submission.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
