import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Send, CheckCircle2, AlertCircle, 
  User, Phone, Mail, DollarSign, 
  MessageCircle, Briefcase, Sparkles,
  Globe, Zap, Users, ShieldCheck, Clock, MapPin, Tag, ShoppingBag, Megaphone
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';

const G = "#F5A623";
const MANAGER_WA = "255757053354";

const SERVICE_CONFIGS = {
  advertise: {
    title: "Tangaza Nasi",
    tag: "Advertise With Us",
    icon: <Megaphone size={20} />,
    color: "#ec4899",
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Mfano: John Doe', required: true, icon: <User size={18} /> },
      { name: 'businessName', label: 'Business Name', type: 'text', placeholder: 'Jina la Biashara yako', required: true, icon: <Briefcase size={18} /> },
      { name: 'phone', label: 'WhatsApp Number', type: 'tel', placeholder: 'Mfano: 0757XXXXXX', required: true, icon: <Phone size={18} /> },
      { name: 'email', label: 'Email (Optional)', type: 'email', placeholder: 'example@email.com', required: false, icon: <Mail size={18} /> },
      { name: 'adType', label: 'Ad Type', type: 'select', options: ['Banner', 'Sponsored Post', 'Homepage Placement', 'Other'], required: true, icon: <Tag size={18} /> },
      { name: 'budget', label: 'Budget / Amount Paid', type: 'text', placeholder: 'Mfano: 50,000 TZS', required: true, icon: <DollarSign size={18} /> },
      { name: 'paymentId', label: 'Payment ID / Namba ya Muamala', type: 'text', placeholder: 'Mfano: QX123456...', required: true, icon: <CheckCircle2 size={18} /> },
      { name: 'goal', label: 'Campaign Goal', type: 'text', placeholder: 'Mfano: Kuongeza mauzo, Brand awareness', required: true, icon: <Zap size={18} /> },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Elezea zaidi kuhusu unachotaka kutangaza...', required: true, icon: <MessageCircle size={18} /> },
    ],
    waFormat: (data) => `Hello STEA Manager,\nI want to advertise on STEA.\n\nFull Name: ${data.name}\nBusiness Name: ${data.businessName}\nWhatsApp: ${data.phone}\nEmail: ${data.email || 'N/A'}\nAd Type: ${data.adType}\nBudget: ${data.budget}\nPayment ID: ${data.paymentId}\nCampaign Goal: ${data.goal}\nDescription: ${data.description}`
  },
  promotion: {
    title: "Product Promotion",
    tag: "Kuza Bidhaa Yako",
    icon: <Zap size={20} />,
    color: G,
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Mfano: John Doe', required: true, icon: <User size={18} /> },
      { name: 'productName', label: 'Product Name', type: 'text', placeholder: 'Jina la Bidhaa', required: true, icon: <ShoppingBag size={18} /> },
      { name: 'category', label: 'Product Category', type: 'text', placeholder: 'Mfano: Electronics, Fashion', required: true, icon: <Tag size={18} /> },
      { name: 'phone', label: 'WhatsApp Number', type: 'tel', placeholder: 'Mfano: 0757XXXXXX', required: true, icon: <Phone size={18} /> },
      { name: 'price', label: 'Price', type: 'text', placeholder: 'Bei ya bidhaa', required: true, icon: <DollarSign size={18} /> },
      { name: 'goal', label: 'Promotion Goal', type: 'text', placeholder: 'Unataka kufikia nini?', required: true, icon: <Zap size={18} /> },
      { name: 'link', label: 'Product Link (Optional)', type: 'url', placeholder: 'https://...', required: false, icon: <Globe size={18} /> },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Maelezo ya bidhaa...', required: true, icon: <MessageCircle size={18} /> },
    ],
    waFormat: (data) => `Hello STEA Manager,\nI want product promotion on STEA.\n\nFull Name: ${data.name}\nProduct Name: ${data.productName}\nCategory: ${data.category}\nWhatsApp: ${data.phone}\nPrice: ${data.price}\nPromotion Goal: ${data.goal}\nProduct Link: ${data.link || 'N/A'}\nDescription: ${data.description}`
  },
  partnership: {
    title: "Brand Partnership",
    tag: "Fanya Kazi Nasi",
    icon: <Users size={20} />,
    color: "#a855f7",
    fields: [
      { name: 'name', label: 'Contact Person', type: 'text', placeholder: 'Mfano: John Doe', required: true, icon: <User size={18} /> },
      { name: 'companyName', label: 'Company / Brand Name', type: 'text', placeholder: 'Jina la Kampuni', required: true, icon: <Briefcase size={18} /> },
      { name: 'phone', label: 'WhatsApp Number', type: 'tel', placeholder: 'Mfano: 0757XXXXXX', required: true, icon: <Phone size={18} /> },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'example@email.com', required: true, icon: <Mail size={18} /> },
      { name: 'partnershipType', label: 'Partnership Type', type: 'text', placeholder: 'Mfano: Content Creation, Event Sponsorship', required: true, icon: <Tag size={18} /> },
      { name: 'budget', label: 'Budget (Optional)', type: 'text', placeholder: 'Bajeti iliyotengwa', required: false, icon: <DollarSign size={18} /> },
      { name: 'proposal', label: 'Proposal / Message', type: 'textarea', placeholder: 'Elezea wazo lako la ushirikiano...', required: true, icon: <MessageCircle size={18} /> },
    ],
    waFormat: (data) => `Hello STEA Manager,\nI want a brand partnership with STEA.\n\nContact Person: ${data.name}\nCompany / Brand Name: ${data.companyName}\nWhatsApp: ${data.phone}\nEmail: ${data.email}\nPartnership Type: ${data.partnershipType}\nBudget: ${data.budget || 'N/A'}\nProposal: ${data.proposal}`
  },
  website: {
    title: "Website Design",
    tag: "Ujenzi wa Website",
    icon: <Globe size={20} />,
    color: "#3b82f6",
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Mfano: John Doe', required: true, icon: <User size={18} /> },
      { name: 'businessName', label: 'Business / Brand Name', type: 'text', placeholder: 'Jina la Biashara', required: true, icon: <Briefcase size={18} /> },
      { name: 'phone', label: 'WhatsApp Number', type: 'tel', placeholder: 'Mfano: 0757XXXXXX', required: true, icon: <Phone size={18} /> },
      { name: 'email', label: 'Email (Optional)', type: 'email', placeholder: 'example@email.com', required: false, icon: <Mail size={18} /> },
      { name: 'websiteType', label: 'Website Type', type: 'select', options: ['Business', 'Portfolio', 'Blog', 'E-commerce', 'School', 'Other'], required: true, icon: <Globe size={18} /> },
      { name: 'pages', label: 'Number of Pages', type: 'number', placeholder: 'Mfano: 5', required: true, icon: <Tag size={18} /> },
      { name: 'contentReady', label: 'Do you already have content?', type: 'select', options: ['Yes', 'No'], required: true, icon: <CheckCircle2 size={18} /> },
      { name: 'budget', label: 'Budget', type: 'text', placeholder: 'Mfano: 300,000 - 500,000 TZS', required: true, icon: <DollarSign size={18} /> },
      { name: 'timeline', label: 'Timeline', type: 'text', placeholder: 'Mfano: Wiki 2', required: true, icon: <Clock size={18} /> },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Elezea mahitaji yako ya website...', required: true, icon: <MessageCircle size={18} /> },
    ],
    waFormat: (data) => `Hello STEA Manager,\nI need a website design service.\n\nFull Name: ${data.name}\nBusiness / Brand Name: ${data.businessName}\nWhatsApp: ${data.phone}\nEmail: ${data.email || 'N/A'}\nWebsite Type: ${data.websiteType}\nNumber of Pages: ${data.pages}\nContent Ready: ${data.contentReady}\nBudget: ${data.budget}\nTimeline: ${data.timeline}\nDescription: ${data.description}`
  },
  support: {
    title: "Digital Support",
    tag: "Msaada wa Tech",
    icon: <ShieldCheck size={20} />,
    color: "#10b981",
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Mfano: John Doe', required: true, icon: <User size={18} /> },
      { name: 'phone', label: 'WhatsApp Number', type: 'tel', placeholder: 'Mfano: 0757XXXXXX', required: true, icon: <Phone size={18} /> },
      { name: 'supportType', label: 'Support Type', type: 'text', placeholder: 'Mfano: Software installation, Troubleshooting', required: true, icon: <Tag size={18} /> },
      { name: 'device', label: 'Device / Platform', type: 'text', placeholder: 'Mfano: Windows PC, Android, Website', required: true, icon: <Globe size={18} /> },
      { name: 'urgency', label: 'Urgency', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'], required: true, icon: <Clock size={18} /> },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Elezea tatizo lako kwa undani...', required: true, icon: <MessageCircle size={18} /> },
    ],
    waFormat: (data) => `Hello STEA Manager,\nI need digital support.\n\nFull Name: ${data.name}\nWhatsApp: ${data.phone}\nSupport Type: ${data.supportType}\nDevice / Platform: ${data.device}\nUrgency: ${data.urgency}\nDescription: ${data.description}`
  },
  youth: {
    title: "Youth Services",
    tag: "Huduma za Vijana",
    icon: <Sparkles size={20} />,
    color: G,
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Mfano: John Doe', required: true, icon: <User size={18} /> },
      { name: 'phone', label: 'WhatsApp Number', type: 'tel', placeholder: 'Mfano: 0757XXXXXX', required: true, icon: <Phone size={18} /> },
      { name: 'serviceNeeded', label: 'Service Needed', type: 'text', placeholder: 'Mfano: Mentorship, Career Guidance', required: true, icon: <Tag size={18} /> },
      { name: 'ageRange', label: 'Age Range (Optional)', type: 'text', placeholder: 'Mfano: 18-24', required: false, icon: <Clock size={18} /> },
      { name: 'location', label: 'Location (Optional)', type: 'text', placeholder: 'Mfano: Dar es Salaam', required: false, icon: <MapPin size={18} /> },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Elezea jinsi tunavyoweza kukusaidia...', required: true, icon: <MessageCircle size={18} /> },
    ],
    waFormat: (data) => `Hello STEA Manager,\nI need youth services support.\n\nFull Name: ${data.name}\nWhatsApp: ${data.phone}\nService Needed: ${data.serviceNeeded}\nAge Range: ${data.ageRange || 'N/A'}\nLocation: ${data.location || 'N/A'}\nDescription: ${data.description}`
  }
};

export const ServiceRequestFormContent = ({ serviceType = 'advertise', onCancel, isModal = false }) => {
  const config = SERVICE_CONFIGS[serviceType] || SERVICE_CONFIGS.advertise;
  
  const [formData, setFormData] = useState(() => {
    const initial = {};
    config.fields.forEach(f => {
      initial[f.name] = f.type === 'select' ? f.options[0] : '';
    });
    return initial;
  });
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      // 1. Save to Firebase
      const path = 'service_requests';
      try {
        await addDoc(collection(db, path), {
          ...formData,
          serviceType: config.title,
          status: 'new',
          createdAt: serverTimestamp(),
          source: isModal ? 'modal' : 'section'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }

      // 2. Prepare WhatsApp Message
      const message = config.waFormat(formData);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${MANAGER_WA}?text=${encodedMessage}`;

      // 3. Update Status
      setStatus('success');
      
      // 4. Open WhatsApp after a short delay
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1500);

    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', padding: '48px 24px' }}
      >
        <div style={{ width: 80, height: 80, background: 'rgba(16,185,129,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle2 size={40} style={{ color: '#10b981' }} />
        </div>
        <h3 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Imetuma Kikamilifu!</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, maxWidth: 320, margin: '0 auto 32px' }}>
          Asante kwa maombi yako. Tunakupeleka WhatsApp sasa hivi ili kukamilisha mazungumzo.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button 
            onClick={() => setStatus('idle')}
            style={{ padding: '12px 32px', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Tuma Maombi Mengine
          </button>
          {isModal && (
            <button 
              onClick={onCancel}
              style={{ padding: '12px 32px', background: 'transparent', color: 'rgba(255,255,255,0.4)', borderRadius: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Funga
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {config.fields.map((field) => (
          <div key={field.name} style={{ display: 'grid', gap: 6, gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: 4 }}>
              {field.label} {field.required && <span style={{ color: '#f87171' }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 16, top: field.type === 'textarea' ? 16 : '50%', transform: field.type === 'textarea' ? 'none' : 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }}>
                {field.icon}
              </div>
              
              {field.type === 'select' ? (
                <select 
                  required={field.required}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '14px 16px 14px 48px', color: '#fff', outline: 'none', appearance: 'none' }}
                >
                  {field.options.map(opt => (
                    <option key={opt} value={opt} style={{ background: '#0e101a', color: '#fff' }}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea 
                  required={field.required}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  rows={4}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '14px 16px 14px 48px', color: '#fff', outline: 'none', resize: 'none' }}
                />
              ) : (
                <input 
                  required={field.required}
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '14px 16px 14px 48px', color: '#fff', outline: 'none' }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontSize: 14, background: 'rgba(248,113,113,0.1)', padding: 16, borderRadius: 12, border: '1px solid rgba(248,113,113,0.2)' }}>
          <AlertCircle size={16} />
          <span>Kuna tatizo limetokea. Tafadhali jaribu tena.</span>
        </div>
      )}

      <button 
        type="submit"
        disabled={status === 'loading'}
        style={{ width: '100%', padding: 16, background: `linear-gradient(135deg,${config.color},${config.color}dd)`, color: '#fff', borderRadius: 16, fontWeight: 900, fontSize: 18, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16, boxShadow: `0 10px 30px ${config.color}33` }}
      >
        {status === 'loading' ? (
          <div style={{ width: 24, height: 24, border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        ) : (
          <>
            Tuma Maombi <Send size={20} />
          </>
        )}
      </button>
      
      <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 16 }}>
        Hakuna malipo ya awali — tutakushauri kwanza
      </p>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </form>
  );
};

const ServiceRequestForm = ({ isOpen, onClose, serviceType = 'advertise' }) => {
  if (!isOpen) return null;
  const config = SERVICE_CONFIGS[serviceType] || SERVICE_CONFIGS.advertise;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(4,5,9,0.9)', backdropFilter: 'blur(20px)' }}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{ position: 'relative', width: '100%', maxWidth: 720, background: '#0e101a', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{ width: 40, height: 40, background: `${config.color}15`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.color }}>
              {config.icon}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>{config.title}</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 800, margin: 0 }}>{config.tag}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
          <ServiceRequestFormContent serviceType={serviceType} onCancel={onClose} isModal={true} />
        </div>
      </motion.div>
    </div>
  );
};

export default ServiceRequestForm;
