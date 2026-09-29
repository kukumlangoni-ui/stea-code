import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

const G = '#F5A623';

export default function ImageEditor({ image, onSave, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(16 / 9);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(image);

  // Sync previewImageUrl when image prop changes (handles URL or File)
  React.useEffect(() => {
    if (!image) return;
    if (image instanceof File) {
      const url = URL.createObjectURL(image);
      setPreviewImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewImageUrl(image);
    }
    setImageError(false);
  }, [image]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    console.log("Starting crop process for:", imageSrc.substring(0, 50) + "...");
    const img = new Image();
    img.crossOrigin = 'anonymous'; 
    
    const cacheBuster = imageSrc.includes('data:') ? '' : (imageSrc.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
    img.src = imageSrc + cacheBuster;
    
    await new Promise((resolve, reject) => { 
      img.onload = () => {
        console.log("Image loaded for cropping");
        resolve();
      };
      img.onerror = () => {
        console.error("Image failed to load for cropping");
        reject(new Error('Picha imeshindwa kupakia. Huenda imezuiwa na security (CORS). Jaribu kupakua picha na kui-upload badala ya kutumia link.'));
      };
    });

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    try {
      ctx.drawImage(
        img,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      console.log("Canvas draw successful");
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      console.error("Canvas draw error:", e);
      throw new Error("Imeshindwa ku-crop picha hii kwa sababu ya usalama (CORS). Tafadhali pakua picha kwanza kisha i-upload.", { cause: e });
    }
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      console.warn("No cropped area pixels defined");
      return;
    }
    
    setSaving(true);
    console.log("handleSave triggered");
    
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      console.log("Cropped image generated, calling onSave");
      await onSave(croppedImage);
      console.log("onSave completed successfully");
    } catch (err) {
      console.error("Error in handleSave:", err);
      const useOriginal = window.confirm(err.message + "\n\nJe, unataka kutumia picha halisi bila ku-crop?");
      if (useOriginal) {
        console.log("User chose to use original image due to error");
        await onSave(image);
      }
    } finally {
      console.log("handleSave finished, setting saving to false");
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', padding: 20, height: '100vh', width: '100vw' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 800 }}>Kahariri Picha</h3>
        <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div style={{ position: 'relative', flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '55vh' }}>
        {imageError ? (
            <div style={{ color: '#ff4444', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
                <p style={{ fontWeight: 800 }}>Picha Imeshindwa Kupakiwa</p>
                <p style={{ fontSize: 12, opacity: 0.7, maxWidth: 300, wordBreak: 'break-all' }}>Chanzo: {String(image)}</p>
                <button onClick={() => setImageError(false)} style={{ marginTop: 20, padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8 }}>Jaribu Tena</button>
            </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0 }}>
            <Cropper
              image={previewImageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onImgError={() => setImageError(true)}
              style={{
                containerStyle: { background: '#0a0a0a' }
              }}
            />
          </div>
        )}
        
        {/* Secondary Overlay Preview for debugging visibility */}
        {!imageError && previewImageUrl && (
          <div style={{ 
            position: 'absolute', 
            top: 15, 
            right: 15, 
            zIndex: 100, 
            width: 80, 
            height: 80, 
            borderRadius: 8, 
            border: `1px solid ${G}`, 
            overflow: 'hidden', 
            background: '#000',
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            opacity: 0.8
          }}>
             <img 
               src={previewImageUrl} 
               alt="" 
               style={{ 
                 width: '100%', 
                 height: '100%', 
                 objectFit: 'cover'
               }} 
             />
          </div>
        )}
      </div>

      <div style={{ maxWidth: 520, margin: '20px auto', width: '100%', background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: 15 }}>
           <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 5 }}>Preview ya haraka:</p>
           <div style={{ margin: '0 auto', width: 120, height: 120 / aspect, background: '#000', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <img 
                src={previewImageUrl} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transform: `scale(${zoom})`,
                  transition: 'transform 0.1s ease-out'
                }} 
                alt="Mini Preview"
              />
           </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 15 }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, minWidth: 60 }}>Zoom:</div>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.01}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ flex: 1, cursor: 'pointer', accentColor: G }}
          />
          <div style={{ color: G, fontSize: 13, fontWeight: 800, minWidth: 40 }}>{Math.round(zoom * 100)}%</div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
          {[
            { label: '16:9', val: 16 / 9 },
            { label: '4:3', val: 4 / 3 },
            { label: '1:1', val: 1 / 1 }
          ].map(r => (
            <button 
              key={r.label}
              onClick={() => setAspect(r.val)} 
              style={{ 
                flex: 1,
                padding: '10px', 
                fontSize: 13, 
                background: aspect === r.val ? G : 'rgba(255,255,255,0.1)', 
                color: aspect === r.val ? '#000' : '#fff', 
                border: 'none', 
                borderRadius: 10, 
                cursor: 'pointer', 
                fontWeight: 800,
                transition: 'all 0.2s'
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={onCancel} 
            disabled={saving}
            style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}
          >
            Ghairi
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || imageError}
            style={{ flex: 2, padding: '14px', background: G, color: '#000', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 900, boxShadow: `0 8px 24px ${G}33` }}
          >
            {saving ? 'Inahifadhi...' : 'Hifadhi Picha'}
          </button>
        </div>
      </div>
    </div>
  );
}
