import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";

export default function PosterCropModal({ imageSrc, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  // Natural width/height ratio of the uploaded image — the crop frame starts
  // at the design's true shape (tall for long pages, wide for hero sections).
  const [naturalAspect, setNaturalAspect] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadImage(imageSrc)
      .then((img) => {
        if (cancelled) return;
        const w = img.naturalWidth || img.width || 1;
        const h = img.naturalHeight || img.height || 1;
        setNaturalAspect(w / h);
      })
      .catch(() => {
        if (!cancelled) setNaturalAspect(1);
      });
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    // Pass both the blob and its exact pixel size so the caller can set
    // designWidth/designHeight to the image's true dimensions.
    onConfirm(croppedBlob, croppedAreaPixels);
  };

  const ratioLabel =
    naturalAspect != null
      ? `W:${Math.round(naturalAspect * 100)} H:100`
      : "…";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#111113",
          borderRadius: 16,
          width: "100%",
          maxWidth: 720,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 700 }}>
            Crop your poster
          </h3>
          <p style={{ margin: "4px 0 0", color: "#8a8a94", fontSize: 13 }}>
            Frame starts at your image's natural shape ({ratioLabel}) — drag to
            choose what fills the card.
          </p>
        </div>
        <div style={{ position: "relative", width: "100%", height: 400, background: "#000" }}>
          {naturalAspect != null && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={naturalAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
              style={{
                containerStyle: { background: "#0a0a0a" },
                cropAreaStyle: { border: "2px solid #f5a623" },
              }}
            />
          )}
        </div>
        <div
          style={{
            padding: "12px 24px",
            background: "rgba(255,255,255,0.02)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#f5a623" }}
            aria-label="Zoom"
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: "10px 20px",
              background: "#f5a623",
              border: 0,
              color: "#0a0a0a",
              fontWeight: 700,
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Crop &amp; Upload
          </button>
        </div>
      </div>
    </div>
  );
}

// Crops the source image to the exact pixel region chosen in the cropper
// and returns it as a Blob at exactly those dimensions.
export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
      "image/png",
      0.92
    );
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
