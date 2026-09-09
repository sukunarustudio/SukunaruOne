import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  ArrowPathIcon,
  ArrowsPointingInIcon,
  PhotoIcon,
  CheckIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/react/24/outline';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  title?: string;
  onClose: () => void;
  onSave: (croppedDataUrl: string, croppedFile: File) => Promise<void> | void;
  isSaving?: boolean;
  onChangeImageFile?: (file: File) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  title = 'Sesuaikan Foto Profil Bisnis (1:1)',
  onClose,
  onSave,
  isSaving = false,
  onChangeImageFile,
}) => {
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const isDraggingRef = useRef<boolean>(false);
  const startPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Size of the square crop viewport inside the modal UI (in pixels)
  const CROP_BOX_SIZE = 280;
  // Final output exported size
  const OUTPUT_SIZE = 512;

  // Reset adjustments whenever a new image source is loaded
  useEffect(() => {
    if (isOpen && imageSrc) {
      setScale(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      setImgLoaded(false);

      const img = new Image();
      img.onload = () => {
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setImgLoaded(true);
      };
      img.src = imageSrc;
    }
  }, [isOpen, imageSrc]);

  // Pointer Drag Handlers (Supports both Mouse and Touch natively)
  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    startPanRef.current = { ...pan };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startPointerRef.current.x;
    const dy = e.clientY - startPointerRef.current.y;
    setPan({
      x: startPanRef.current.x + dx,
      y: startPanRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      isDraggingRef.current = false;
    }
  };

  // Mouse wheel zoom support
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    setScale(prev => Math.min(3.5, Math.max(1, +(prev + zoomDelta).toFixed(2))));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onChangeImageFile) {
      onChangeImageFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Calculate base display dimensions to fit image within CROP_BOX_SIZE covering the box
  const getBaseDimensions = useCallback(() => {
    if (!naturalSize.width || !naturalSize.height) {
      return { width: CROP_BOX_SIZE, height: CROP_BOX_SIZE };
    }

    const isRotated90or270 = rotation % 180 !== 0;
    const effectiveWidth = isRotated90or270 ? naturalSize.height : naturalSize.width;
    const effectiveHeight = isRotated90or270 ? naturalSize.width : naturalSize.height;

    // We want the image to cover the square box at scale 1
    const scaleToCover = Math.max(CROP_BOX_SIZE / effectiveWidth, CROP_BOX_SIZE / effectiveHeight);

    return {
      width: naturalSize.width * scaleToCover,
      height: naturalSize.height * scaleToCover,
    };
  }, [naturalSize, rotation, CROP_BOX_SIZE]);

  // Export cropped 1:1 square canvas
  const handleApplyCrop = async () => {
    if (!imageSrc || !imgLoaded || isSaving) return;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        if (img.complete) {
          resolve(null);
        } else {
          img.onload = () => resolve(null);
          img.onerror = reject;
        }
      });

      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Gagal membuat canvas grafis.');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Background fill in case of transparency
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const ratio = OUTPUT_SIZE / CROP_BOX_SIZE;
      const baseDim = getBaseDimensions();

      ctx.save();
      // Move origin to center of output canvas
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
      // Apply pan translated by output ratio
      ctx.translate(pan.x * ratio, pan.y * ratio);
      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);
      // Apply zoom scale
      ctx.scale(scale, scale);

      // Draw centered
      const drawWidth = baseDim.width * ratio;
      const drawHeight = baseDim.height * ratio;
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Convert canvas to File
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `business_logo_1x1_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onSave(croppedDataUrl, file);
        } else {
          onSave(croppedDataUrl, new File([], 'logo.jpg'));
        }
      }, 'image/jpeg', 0.9);

    } catch (err: any) {
      console.error('Failed to crop image:', err);
    }
  };

  if (!isOpen) return null;

  const baseDim = getBaseDimensions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#25343F]/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white w-full max-w-md rounded-2xl border border-[#BFC9D1]/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#BFC9D1]/30 flex items-center justify-between bg-[#EAEFEF]/60">
          <div>
            <h3 className="text-sm font-extrabold text-[#25343F] leading-tight">
              {title}
            </h3>
            <p className="text-[11px] text-[#898989] font-medium mt-0.5">
              Rasio persegi 1:1 otomatis untuk logo nota, faktur, & menu
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-8 w-8 rounded-xl bg-white hover:bg-slate-100 text-[#898989] hover:text-[#25343F] border border-[#BFC9D1]/25 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Interactive Crop Area */}
        <div className="p-4 sm:p-5 flex flex-col items-center space-y-4 overflow-y-auto">
          
          {/* Crop Container Viewport */}
          <div
            ref={viewportRef}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ width: `${CROP_BOX_SIZE}px`, height: `${CROP_BOX_SIZE}px` }}
            className="relative rounded-2xl bg-[#1C262E] overflow-hidden shadow-inner cursor-grab active:cursor-grabbing touch-none flex items-center justify-center border-2 border-[#25343F]/20"
          >
            {/* Image Preview with Transforms */}
            {imageSrc && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  width: `${baseDim.width}px`,
                  height: `${baseDim.height}px`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: isDraggingRef.current ? 'none' : 'transform 0.08s ease-out',
                }}
                className="pointer-events-none select-none object-cover"
              />
            )}

            {/* 1:1 Square Crop Mask Overlay & Visual Guides */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-white/30 border border-white/60">
              {/* Subtle Rule of Thirds Grid */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>

              {/* Center Target Indicator */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <div className="w-5 h-5 border-t-2 border-l-2 border-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-tl" />
              </div>

              {/* Badge 1:1 */}
              <div className="absolute top-2 left-2 bg-[#25343F]/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                1:1 Persegi
              </div>
            </div>

            {!imgLoaded && (
              <div className="absolute inset-0 bg-[#25343F]/80 flex flex-col items-center justify-center text-white gap-2">
                <ArrowPathIcon className="w-6 h-6 animate-spin text-[#FF9B51]" />
                <span className="text-xs font-bold">Memuat gambar...</span>
              </div>
            )}
          </div>

          {/* Hint text */}
          <p className="text-[11px] text-[#898989] font-medium text-center">
            Geser foto untuk memposisikan • Putar atau atur skala pembesaran
          </p>

          {/* Zoom Slider Control */}
          <div className="w-full bg-[#EAEFEF]/60 p-3 rounded-xl border border-[#BFC9D1]/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#25343F]">
              <span className="flex items-center gap-1.5 text-[11.5px]">
                <MagnifyingGlassMinusIcon className="w-3.5 h-3.5 text-[#898989]" />
                <span>Skala / Zoom</span>
              </span>
              <span className="text-[11px] font-mono text-[#898989] bg-white px-2 py-0.5 rounded-md border border-[#BFC9D1]/20">
                {Math.round(scale * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setScale(prev => Math.max(1, +(prev - 0.1).toFixed(2)))}
                className="h-7 w-7 rounded-lg bg-white hover:bg-slate-100 text-[#25343F] border border-[#BFC9D1]/30 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold shrink-0 shadow-xs"
                title="Perkecil"
              >
                -
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.02"
                value={scale}
                onChange={e => setScale(parseFloat(e.target.value))}
                className="flex-1 accent-[#FF9B51] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => setScale(prev => Math.min(3, +(prev + 0.1).toFixed(2)))}
                className="h-7 w-7 rounded-lg bg-white hover:bg-slate-100 text-[#25343F] border border-[#BFC9D1]/30 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold shrink-0 shadow-xs"
                title="Perbesar"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Action Buttons Toolbar */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {/* Rotate Button */}
            <button
              type="button"
              onClick={handleRotate}
              className="px-2.5 py-2 bg-white hover:bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/30 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
              title="Putar 90 Derajat"
            >
              <ArrowPathRoundedSquareIcon className="w-4 h-4 text-[#898989]" />
              <span>Putar 90°</span>
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-2 bg-white hover:bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/30 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
              title="Kembalikan Posisi Semula"
            >
              <ArrowsPointingInIcon className="w-4 h-4 text-[#898989]" />
              <span>Pusatkan</span>
            </button>

            {/* Change Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-2 bg-white hover:bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/30 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
              title="Ganti Foto Lain"
            >
              <PhotoIcon className="w-4 h-4 text-[#898989]" />
              <span>Ganti Foto</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#BFC9D1]/30 bg-[#EAEFEF]/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-[#25343F] border border-[#BFC9D1]/30 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isSaving || !imgLoaded}
            className="px-5 py-2 bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isSaving ? (
              <>
                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                <span>Terapkan & Simpan</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
