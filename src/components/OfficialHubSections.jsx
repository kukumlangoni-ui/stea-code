import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Megaphone, Handshake, Headphones, Cpu, ChevronRight } from 'lucide-react';

const G = '#F5A623';

export default function OfficialHubSections() {
  const navigate = useNavigate();

  const officialServices = [
    { 
      icon: <Globe size={24} color={G} />, 
      title: "Website Design", 
      desc: "Get professional, responsive websites and custom web applications.", 
      path: '/services/website-design' 
    },
    { 
      icon: <Megaphone size={24} color={G} />, 
      title: "Advertise", 
      desc: "Promote your brand or products directly to the STEA network.", 
      path: '/advertise' 
    },
    { 
      icon: <Handshake size={24} color={G} />, 
      title: "Partnerships", 
      desc: "Collaborate with STEA on campaigns and projects.", 
      path: '/contact' 
    },
    { 
      icon: <Headphones size={24} color={G} />, 
      title: "Support Center", 
      desc: "Get round-the-clock technical support and submit feedback.", 
      path: '/faq' 
    },
    { 
      icon: <Cpu size={24} color={G} />, 
      title: "Digital Services", 
      desc: "Explore tech tips, digital tools, and online resources.",
      path: '/techhub' 
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: 40 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {officialServices.map((service) => (
          <div 
            key={service.title}
            onClick={() => navigate(service.path)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transition: '0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,166,35,0.2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,166,35,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {service.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>{service.title}</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', lineHeight: 1.4 }}>{service.desc}</p>
            </div>
            <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
          </div>
        ))}
      </div>
    </div>
  );
}
