'use client';

import { useRef } from 'react';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface AvatarUploadProps {
  imageUrl: string | null;
  fallbackText: string;
  onChange: (dataUrl: string) => void;
  size?: string;
  ariaLabel: string;
}

export function AvatarUpload({ imageUrl, fallbackText, onChange, size = 'h-32 w-32', ariaLabel }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Image trop volumineuse (max 5 Mo).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      toast.success('Photo de profil mise à jour.');
    };
    reader.onerror = () => {
      toast.error("Impossible de lire l'image sélectionnée.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative shrink-0">
      <div
        className={`flex ${size} items-center justify-center overflow-hidden rounded-full border-4 border-surface-lowest bg-primary-light text-4xl font-bold text-primary shadow-lg`}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          fallbackText
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={ariaLabel}
        className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-surface-lowest bg-primary text-onPrimary transition-transform hover:scale-105"
      >
        <Camera size={12} strokeWidth={2.5} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
