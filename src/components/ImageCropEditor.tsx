import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ZoomIn, ZoomOut, Check, X, Move, RotateCcw } from 'lucide-react';

interface ImageCropEditorProps {
  imageFile: File;
  aspectRatio?: number; // width / height — default 1 (square)
  onConfirm: (editedFile: File) => void;
  onCancel: () => void;
}

const CANVAS_SIZE = 380; // px — output resolution

export default function ImageCropEditor({
  imageFile,
  aspectRatio = 1,
  onConfirm,
  onCancel,
}: ImageCropEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Keep refs in sync for the draw loop (avoids stale closure)
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });

  const canvasH = Math.round(CANVAS_SIZE / aspectRatio);

  // ---------- Draw ----------
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, canvasH);
    ctx.drawImage(
      img,
      offsetRef.current.x,
      offsetRef.current.y,
      img.naturalWidth * zoomRef.current,
      img.naturalHeight * zoomRef.current,
    );
  }, [canvasH]);

  // ---------- Load image ----------
  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      imageRef.current = img;
      // "cover" fit — fill the canvas
      const scale = Math.max(CANVAS_SIZE / img.naturalWidth, canvasH / img.naturalHeight);
      const initOffset = {
        x: (CANVAS_SIZE - img.naturalWidth * scale) / 2,
        y: (canvasH - img.naturalHeight * scale) / 2,
      };
      zoomRef.current = scale;
      offsetRef.current = initOffset;
      setMinZoom(scale);
      setZoom(scale);
      setOffset(initOffset);
      setImageLoaded(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [imageFile, canvasH]);

  // ---------- Re-draw on every state change ----------
  useEffect(() => {
    zoomRef.current = zoom;
    offsetRef.current = offset;
    draw();
  }, [zoom, offset, draw, imageLoaded]);

  // ---------- Zoom (keeps canvas centre fixed) ----------
  const applyZoom = useCallback(
    (newZoom: number) => {
      const img = imageRef.current;
      if (!img) return;
      const clamped = Math.max(minZoom * 0.5, Math.min(newZoom, minZoom * 6));
      const cx = CANVAS_SIZE / 2;
      const cy = canvasH / 2;
      const oldW = img.naturalWidth * zoom;
      const newW = img.naturalWidth * clamped;
      const oldH = img.naturalHeight * zoom;
      const newH = img.naturalHeight * clamped;
      setZoom(clamped);
      setOffset({
        x: cx - (cx - offset.x) * (newW / oldW),
        y: cy - (cy - offset.y) * (newH / oldH),
      });
    },
    [zoom, offset, minZoom, canvasH],
  );

  // ---------- Reset ----------
  const resetTransform = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    const scale = Math.max(CANVAS_SIZE / img.naturalWidth, canvasH / img.naturalHeight);
    const initOffset = {
      x: (CANVAS_SIZE - img.naturalWidth * scale) / 2,
      y: (canvasH - img.naturalHeight * scale) / 2,
    };
    setZoom(scale);
    setOffset(initOffset);
  }, [canvasH]);

  // ---------- Mouse drag ----------
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };
  const handleMouseUp = () => setIsDragging(false);

  // ---------- Touch drag ----------
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastPointer.current.x;
    const dy = e.touches[0].clientY - lastPointer.current.y;
    lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  // ---------- Scroll-to-zoom ----------
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    applyZoom(zoom * (e.deltaY < 0 ? 1.08 : 0.93));
  };

  // ---------- Export ----------
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      blob => {
        if (!blob) return;
        const edited = new File([blob], `edited_${imageFile.name}`, { type: 'image/jpeg' });
        onConfirm(edited);
      },
      'image/jpeg',
      0.93,
    );
  };

  const zoomPct = minZoom > 0 ? Math.round((zoom / minZoom) * 100) : 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
            <div>
              <h3 className="text-lg font-bold text-primary">Adjust Image</h3>
              <p className="text-xs text-secondary mt-0.5">Drag to move · Scroll or slider to zoom</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Canvas area */}
          <div className="p-5">
            <div
              className="mx-auto rounded-2xl overflow-hidden relative border-2 border-dashed border-primary/20 bg-gray-100 select-none"
              style={{
                width: CANVAS_SIZE,
                maxWidth: '100%',
                aspectRatio: `${aspectRatio} / 1`,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => setIsDragging(false)}
              onWheel={handleWheel}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={canvasH}
                className="block w-full h-full"
              />

              {/* Rule-of-thirds grid overlay */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/15" />
                ))}
              </div>

              {/* Corner marks */}
              {[
                'top-1.5 left-1.5 border-t-2 border-l-2',
                'top-1.5 right-1.5 border-t-2 border-r-2',
                'bottom-1.5 left-1.5 border-b-2 border-l-2',
                'bottom-1.5 right-1.5 border-b-2 border-r-2',
              ].map((cls, i) => (
                <div
                  key={i}
                  className={`absolute w-5 h-5 border-primary/60 rounded-sm pointer-events-none ${cls}`}
                />
              ))}

              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Zoom slider row */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => applyZoom(zoom / 1.12)}
                className="flex-shrink-0 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="range"
                  min={minZoom * 0.5}
                  max={minZoom * 6}
                  step="0.01"
                  value={zoom}
                  onChange={e => applyZoom(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-full accent-primary cursor-pointer"
                  style={{ accentColor: 'var(--color-primary, #4a3728)' }}
                />
              </div>

              <button
                onClick={() => applyZoom(zoom * 1.12)}
                className="flex-shrink-0 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <span className="flex-shrink-0 text-sm font-mono font-bold text-primary bg-gray-100 px-2.5 py-1 rounded-lg min-w-[52px] text-center">
                {zoomPct}%
              </span>
            </div>

            {/* Hint row */}
            <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1.5">
              <Move className="w-3.5 h-3.5" />
              Drag to reposition · Scroll to zoom
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <button
              onClick={resetTransform}
              className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary font-medium transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-5 py-2.5 text-gray-500 font-medium hover:bg-gray-200 rounded-xl transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 text-sm"
              >
                <Check className="w-4 h-4" />
                Apply
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
