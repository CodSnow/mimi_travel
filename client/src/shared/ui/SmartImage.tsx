import React, { useEffect, useState } from 'react';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string;
}

export function SmartImage({ src, alt, fallbackLabel, className, ...props }: SmartImageProps) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (!src || broken) {
    return (
      <div className={['smart-image', 'smart-image--fallback', className].filter(Boolean).join(' ')}>
        <span>{fallbackLabel || alt || '咪咪出行'}</span>
      </div>
    );
  }

  return (
    <img
      {...props}
      alt={alt}
      className={['smart-image', className].filter(Boolean).join(' ')}
      src={src}
      onError={() => setBroken(true)}
    />
  );
}
