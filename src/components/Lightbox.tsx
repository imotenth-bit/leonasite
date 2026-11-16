import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Calendar, X } from 'lucide-react';
import { SafeImage } from './SafeImage.tsx';

export interface LightboxItem {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  dateTaken?: string;
  location?: string;
}

interface LightboxProps {
  items: LightboxItem[];
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}

export function Lightbox({ items, activeIndex, onClose, onNavigate }: LightboxProps) {
  const isOpen = activeIndex !== null && activeIndex >= 0 && activeIndex < items.length;
  const current = isOpen ? items[activeIndex] : null;

  useEffect(() => {
    if (!isOpen || activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        onNavigate((activeIndex + 1) % items.length);
      } else if (e.key === 'ArrowLeft') {
        onNavigate((activeIndex - 1 + items.length) % items.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, activeIndex, items.length, onClose, onNavigate]);

  if (!isOpen || !current || activeIndex === null) return null;

  const hasMultiple = items.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between text-slate-200 max-w-6xl w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 font-mono tabular-nums">
          <span>
            {activeIndex + 1} / {items.length}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-sans font-medium text-blue-300">{current.category}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close full-screen photo view"
          className="w-11 h-11 inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-2 focus-visible:outline-blue-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Frame */}
      <div
        className="relative flex-1 flex items-center justify-center max-w-6xl w-full mx-auto my-4 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {hasMultiple && (
          <button
            type="button"
            onClick={() => onNavigate((activeIndex - 1 + items.length) % items.length)}
            aria-label="Previous photograph"
            className="absolute left-1 sm:left-3 z-10 w-11 h-11 inline-flex items-center justify-center rounded-full bg-slate-900/75 hover:bg-blue-600 text-white border border-white/15 transition-colors focus-visible:outline-2 focus-visible:outline-blue-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div className="max-h-full max-w-full flex items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-900">
          <SafeImage
            src={current.imageUrl}
            alt={current.title}
            eager
            className="max-h-[68vh] w-auto max-w-full object-contain"
          />
        </div>

        {hasMultiple && (
          <button
            type="button"
            onClick={() => onNavigate((activeIndex + 1) % items.length)}
            aria-label="Next photograph"
            className="absolute right-1 sm:right-3 z-10 w-11 h-11 inline-flex items-center justify-center rounded-full bg-slate-900/75 hover:bg-blue-600 text-white border border-white/15 transition-colors focus-visible:outline-2 focus-visible:outline-blue-400"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Caption Bar */}
      <div
        className="max-w-3xl w-full mx-auto text-center space-y-2 pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg sm:text-xl font-semibold text-white">{current.title}</h2>
        {current.description && (
          <p className="text-sm text-slate-300 leading-relaxed">{current.description}</p>
        )}
        {(current.dateTaken || current.location) && (
          <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-xs text-slate-400">
            {current.dateTaken && (
              <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                {current.dateTaken}
              </span>
            )}
            {current.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                {current.location}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
