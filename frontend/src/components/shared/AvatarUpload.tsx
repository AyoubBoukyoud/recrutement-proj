'use client';

import { useRef } from 'react';
import { Camera } from 'lucide-react';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface AvatarUploadProps {
  imageUrl: string | null;
  fallbackText: string;
  onChange: (dataUrl: string) => void;
  /**
   * Retour à l'utilisateur — succès comme échec. La page décide de son rendu :
   * il n'y a pas de file d'alertes globale, chaque écran affiche la sienne.
   * Sans ce rappel, un refus (mauvais format, fichier trop lourd) resterait
   * silencieux.
   */
  onNotify?: (message: string, tone: 'success' | 'error') => void;
  size?: string;
  ariaLabel: string;
}

export function AvatarUpload({
  imageUrl,
  fallbackText,
  onChange,
  onNotify,
  size = 'h-32 w-32',
  ariaLabel,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotify?.('Veuillez sélectionner une image.', 'error');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      onNotify?.('Image trop volumineuse (max 5 Mo).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      onNotify?.('Photo de profil mise à jour.', 'success');
    };
    reader.onerror = () => {
      onNotify?.("Impossible de lire l'image sélectionnée.", 'error');
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
