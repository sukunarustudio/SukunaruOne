import React from 'react';
import { CubeIcon } from '@heroicons/react/24/outline';

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
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-14 h-14',
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
  const src = srcPath ? `/uploads/${srcPath}` : null;

  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const iconClass = ICON_CLASSES[size] ?? ICON_CLASSES.md;

  return (
    <div
      className={`${sizeClass} ${rounded} overflow-hidden bg-[#EAEFEF] flex items-center justify-center shrink-0 ${className}`}
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
              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-[#EAEFEF]"><svg xmlns='http://www.w3.org/2000/svg' class='${iconClass} text-[#898989]' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect width='20' height='20' x='2' y='2' rx='2.18' ry='2.18'/><line x1='7' x2='17' y1='2' y2='22'/><line x1='2' x2='22' y1='7' y2='17'/><line x1='2' x2='22' y1='17' y2='7'/></svg></div>`;
            }
          }}
        />
      ) : (
        <CubeIcon className={`${iconClass} text-zinc-300`} strokeWidth={1.5} />
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
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`/api/products/${productId}/image`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Gagal mengunggah gambar');
        }
        const data = await res.json();
        setPreviewUrl(data.imageUrl);
        onUploadSuccess({
          imagePath: data.imagePath,
          thumbnailPath: data.thumbnailPath,
          imageUrl: data.imageUrl,
          thumbnailUrl: data.thumbnailUrl,
        });
      } catch (err: any) {
        setError(err.message || 'Gagal mengunggah gambar produk.');
        setPreviewUrl(currentImagePath ? `/uploads/${currentImagePath}` : null);
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
            className="w-full max-w-[200px] aspect-square rounded-xl border-2 border-dashed border-[#BFC9D1] bg-[#EAEFEF] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-zinc-400 hover:bg-[#EAEFEF] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <CubeIcon className="w-10 h-10 text-zinc-300" strokeWidth={1.2} />
            <span className="text-[11px] text-[#898989] font-medium">Klik untuk pilih gambar</span>
            <span className="text-[10px] text-zinc-300">JPG, PNG, WebP — maks 10MB</span>
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
