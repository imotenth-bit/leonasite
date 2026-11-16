import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  eager?: boolean;
}

export function SafeImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
  eager = false,
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-800 dark:to-slate-900 text-slate-500 dark:text-slate-400 p-6 text-center ${className}`}
      >
        <ImageOff className="w-7 h-7 text-blue-600/70 dark:text-blue-400/70" aria-hidden="true" />
        <span className="text-xs font-medium max-w-[18ch] truncate">
          {fallbackLabel || alt || 'Image unavailable'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
