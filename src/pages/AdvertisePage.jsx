import React from 'react';
import TangazaNasiSection from '../components/TangazaNasiSection';
import { useMobile } from '../hooks/useMobile';

const AdvertisePage = () => {
  const isMobile = useMobile();
  
  return (
    <div style={{ background: "#05070D", minHeight: "100vh" }}>
      <div style={{ paddingTop: isMobile ? 60 : 100 }}>
        <TangazaNasiSection />
      </div>
    </div>
  );
};

export default AdvertisePage;
