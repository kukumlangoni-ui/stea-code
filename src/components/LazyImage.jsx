import React, { useState, useEffect, useRef } from "react";
import { Image as ImageIcon } from "lucide-react";

export default function LazyImage({ src, alt = "", width, height, className, style, imgStyle, imgClassName, ...props }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const imgRef = useRef(null);

  useEffect(() => {
    // If the image is already complete (cached)
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setShouldAnimate(false);
        setIsLoaded(true);
      }
    }
  }, [src]);

  return (
    <div 
      className={className}
      style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        width: width || '100%', 
        height: height || '100%',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style 
      }}
    >
      {/* Skeleton / Loading State */}
      {!isLoaded && !hasError && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 75%)',
          backgroundSize: '200% 100%',
          animation: 'stea-lazy-skeleton 1.5s infinite linear'
        }} />
      )}

      {/* Error State */}
      {hasError ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(255,255,255,0.2)' }}>
          <ImageIcon size={24} />
        </div>
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={imgClassName}
          style={{
            opacity: isLoaded ? 1 : 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: shouldAnimate ? 'opacity 0.3s ease' : 'none',
            position: 'absolute',
            inset: 0,
            ...imgStyle
          }}
          {...props}
        />
      )}

      <style>{`
        @keyframes stea-lazy-skeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
