import React from 'react';

export default function EarthTest() {
  return (
    <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/The_earth_at_night.jpg/1280px-The_earth_at_night.jpg') repeat-x`,
        backgroundSize: 'auto 100%',
        backgroundPosition: '40% 0',
        boxShadow: `
          inset -40px -40px 80px rgba(0,0,0,0.9),
          inset 20px 20px 50px rgba(255,255,255,0.1),
          0 0 60px rgba(59,130,246,0.4),
          0 0 120px rgba(59,130,246,0.2)
        `,
      }} />
    </div>
  );
}
