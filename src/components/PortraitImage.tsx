import { useState } from 'react';
import { User } from 'lucide-react';

interface PortraitImageProps {
  src: string;
  alt: string;
  name: string;
  className?: string;
}

export function PortraitImage({ src, alt, name, className = '' }: PortraitImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#D6F1FE] text-[#285270] p-6 text-center select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <User className="w-8 h-8 mb-3 opacity-60 text-[#0284C7]" strokeWidth={1.5} />
        <span className="font-display text-xl font-bold text-[#0A2A43] tracking-tight">
          {name}
        </span>
        <span className="text-xs text-[#4B7796] mt-1">Chưa có ảnh chân dung</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
