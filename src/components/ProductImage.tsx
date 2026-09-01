import React from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { api, resolveApiUrl } from '../services/api';

interface ProductImageProps {
  thumbnailPath?: string | null;
  imagePath?: string | null;
  productName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  preferFull?: boolean; // true → use imagePath (full), false → use thumbnailPath
  className?: string;
  rounded?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  xs: 'w-8 h-8',
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-full h-full',
};

const ICON_CLASSES: Record<string, string> = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
  xl: 'w-16 h-16',
};

export const ProductImage: React.FC<ProductImageProps> = ({
  thumbnailPath,
  imagePath,
  productName = 'Produk',
  size = 'md',
  preferFull = false,
  className = '',
  rounded = 'rounded-lg',
}) => {
  const srcPath = preferFull ? (imagePath || thumbnailPath) : (thumbnailPath || imagePath);
  const src = srcPath
    ? (srcPath.startsWith('http://') || srcPath.startsWith('https://') || srcPath.startsWith('data:')
        ? srcPath
        : resolveApiUrl(srcPath.startsWith('/uploads') ? srcPath : `/uploads/${srcPath}`))
    : null;

  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const iconClass = ICON_CLASSES[size] ?? ICON_CLASSES.md;

  return (
    <div
      className={`${sizeClass} ${rounded} overflow-hidden bg-[#EAEFEF] dark:bg-slate-800/80 flex items-center justify-center shrink-0 ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={productName}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={e => {
            // On broken image: hide img and show placeholder
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-[#EAEFEF] dark:bg-slate-800"><svg xmlns='http://www.w3.org/2000/svg' class='${iconClass} text-[#898989]/60' fill='none' viewBox='0 0 24 24' stroke='currentColor' stroke-width='1.5'><path stroke-linecap='round' stroke-linejoin='round' d='m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z' /></svg></div>`;
            }
          }}
        />
      ) : (
        <PhotoIcon className={`${iconClass} text-[#898989]/50 dark:text-slate-500`} strokeWidth={1.5} />
      )}
    </div>
  );
};

// ---- Image Uploader inside product form ----
interface ProductImageUploaderProps {
  productId?: string; // if editing existing product
  currentImagePath?: string | null;
  currentThumbnailPath?: string | null;
  onUploadSuccess: (data: {
    imagePath: string;
    thumbnailPath: string;
    imageUrl: string;
    thumbnailUrl: string;
  }) => void;
  onRemoveImage: () => void;
  onPendingFile?: (file: File | null) => void; // called for new products (no productId yet)
  isLoading?: boolean;
  setLoading?: (v: boolean) => void;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  productId,
  currentImagePath,
  currentThumbnailPath,
  onUploadSuccess,
  onRemoveImage,
  onPendingFile,
  isLoading = false,
  setLoading,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    currentImagePath ? `/uploads/${currentImagePath}` : null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  // If the parent passes a new currentImagePath, sync preview
  React.useEffect(() => {
    setPreviewUrl(currentImagePath ? `/uploads/${currentImagePath}` : null);
  }, [currentImagePath]);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_MB = 10;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Format tidak didukung. Gunakan JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Ukuran file terlalu besar. Maksimum ${MAX_MB}MB.`);
      return;
    }

    // Show local preview immediately (no save yet)
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // If we already have a productId, upload now
    if (productId) {
      try {
        setUploading(true);
        setLoading?.(true);
        const data = await api.uploadProductImage(productId, file);
        setPreviewUrl(data.imageUrl);
        onUploadSuccess({
          imagePath: data.imagePath,
          thumbnailPath: data.thumbnailPath,
          imageUrl: data.imageUrl,
          thumbnailUrl: data.thumbnailUrl,
        });
      } catch (err: any) {
        setError(err.message || 'Gagal mengunggah gambar produk.');
        setPreviewUrl(currentImagePath ? resolveApiUrl(`/uploads/${currentImagePath}`) : null);
      } finally {
        setUploading(false);
        setLoading?.(false);
      }
    } else {
      // No productId yet (new product form) → store file in parent for post-creation upload
      onPendingFile?.(file);
      onUploadSuccess({
        imagePath: '__pending__',
        thumbnailPath: '__pending__',
        imageUrl: localUrl,
        thumbnailUrl: localUrl,
      });
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
    onPendingFile?.(null);
    onRemoveImage();
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
        Gambar Produk
      </label>

      {/* Preview / Placeholder */}
      <div className="relative">
        {previewUrl ? (
          <div className="relative group w-full aspect-square max-w-[200px] rounded-xl overflow-hidden border border-[#BFC9D1]/25 bg-[#EAEFEF]">
            <img
              src={previewUrl}
              alt="Preview gambar produk"
              className="w-full h-full object-cover"
              onError={e => {
                (e.target as HTMLImageElement).src = '';
              }}
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-full max-w-[200px] aspect-square rounded-xl border-2 border-dashed border-[#BFC9D1] bg-[#EAEFEF] dark:bg-slate-800/60 dark:border-slate-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-zinc-400 hover:bg-[#EAEFEF] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <PhotoIcon className="w-10 h-10 text-zinc-400 dark:text-slate-500" strokeWidth={1.2} />
            <span className="text-[11px] text-[#898989] font-medium">Klik untuk pilih gambar</span>
            <span className="text-[10px] text-zinc-400">JPG, PNG, WebP — maks 10MB</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || isLoading}
          className="px-3 py-1.5 text-xs font-semibold border border-[#BFC9D1]/25 rounded-lg text-zinc-700 hover:bg-[#EAEFEF] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {previewUrl ? 'Ganti Gambar' : 'Pilih Gambar'}
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading || isLoading}
            className="px-3 py-1.5 text-xs font-semibold border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hapus Gambar
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
