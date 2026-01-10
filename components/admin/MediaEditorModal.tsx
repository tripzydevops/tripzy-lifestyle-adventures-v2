import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Check,
  RotateCw,
  Crop,
  Sun,
  Contrast,
  Undo2,
  Maximize2,
  RectangleHorizontal,
  RectangleVertical,
  Square,
} from "lucide-react";
import { useLanguage } from "../../localization/LanguageContext";

interface MediaEditorModalProps {
  imageUrl: string;
  onSave: (newSubFile: File, mode: "replace" | "new") => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
  fileName?: string;
}

const MediaEditorModal: React.FC<MediaEditorModalProps> = ({
  imageUrl,
  onSave,
  onClose,
  isOpen,
  fileName = "image",
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edits
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  // This state holds the 'pixel' crop area returned by react-easy-crop
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Dynamically import react-easy-crop only when needed to avoid SSR issues if any
  const [Cropper, setCropper] = useState<any>(null);

  useEffect(() => {
    import("react-easy-crop").then((mod) => {
      setCropper(() => mod.default);
    });
  }, []);

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  /**
   * IMPORTANT: This utility function creates a canvas and draws the cropped image
   * based on the `croppedAreaPixels` from react-easy-crop.
   */
  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0
  ) => {
    const createImage = (url: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
      });

    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return null;
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    // set each dimensions to double largest dimension to allow for a safe area for the
    // image to rotate in without being clipped by canvas context
    canvas.width = safeArea;
    canvas.height = safeArea;

    // translate canvas context to a central location on image to allow rotating around the center.
    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    // Apply filters BEFORE drawing
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // draw rotated image and store data.
    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // paste generated rotate image with correct offsets for x,y crop values.
    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    // As Blob
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (file) => {
          if (file) resolve(file);
          else reject(new Error("Canvas failure"));
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleSave = async (mode: "replace" | "new") => {
    if (!croppedAreaPixels) return;
    // setSaving(true); // Removed as isSaving prop is used
    try {
      const croppedBlob = await getCroppedImg(
        imageUrl,
        croppedAreaPixels,
        rotation
      );
      if (croppedBlob) {
        // Smart Naming: meaningful prefix + original name
        const cleanName = fileName.replace(/\.[^/.]+$/, ""); // remove extension
        // For replaced items, we might want to keep original name to be cleaner,
        // but adding a suffix ensures cache busting and uniqueness.
        // For 'new', we definitely want a prefix.
        const prefix = mode === "new" ? "edited_" : "cropped_";
        const newName = `${prefix}${cleanName}.jpg`;

        const file = new File([croppedBlob], newName, {
          type: "image/jpeg",
        });
        await onSave(file, mode);
        onClose();
      }
    } catch (e) {
      console.error("Crop save critical error", e);
      // Could enable toast here if needed
    } finally {
      // setSaving(false); // Removed as isSaving prop is used
    }
  };

  const reset = () => {
    setBrightness(100);
    setContrast(100);
    setRotation(0);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-navy-950 w-full max-w-6xl h-[90vh] rounded-3xl border border-white/5 flex overflow-hidden shadow-2xl relative">
        {/* Main Canvas Area */}
        <div className="flex-1 bg-[#0f0f15] relative overflow-hidden">
          {/* Grid Pattern Background */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none z-0"
            style={{
              backgroundImage:
                "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative w-full h-full z-10">
            {Cropper && (
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={undefined} // Free crop for now
                objectFit="contain" // Allow full image to be seen
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={true}
                classes={{
                  containerClassName: "cropper-container",
                  mediaClassName: "cropper-media",
                }}
                style={{
                  // We apply the CSS filters visually to the cropper preview
                  mediaStyle: {
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-80 bg-navy-900 border-l border-white/5 flex flex-col z-20 shadow-2xl">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-xl font-serif font-bold text-white">
              Studio Editor
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Visual Adjustments */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sun size={14} /> Look & Feel
              </h4>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 flex justify-between">
                    Brightness <span className="text-gold">{brightness}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-gold h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300 flex justify-between">
                    Contrast <span className="text-gold">{contrast}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-gold h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Transform */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Crop size={14} /> Transform
              </h4>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 flex justify-between">
                    Zoom{" "}
                    <span className="text-gold">
                      {(zoom * 100).toFixed(0)}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-gold h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => setRotation((r) => r + 90)}
                  className="bg-white/5 hover:bg-gold hover:text-navy-950 text-gray-300 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <RotateCw size={16} /> Rotate
                </button>
                <button
                  onClick={reset}
                  className="bg-white/5 hover:bg-red-500 hover:text-white text-gray-300 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Undo2 size={16} /> Reset
                </button>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-blue-200 text-xs">
              💡 Drag image to move, scroll to zoom.
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-navy-950">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSave("replace")}
                disabled={saving}
                className="bg-navy-800 hover:bg-navy-700 text-white py-4 rounded-xl font-bold text-sm shadow-lg transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 border border-white/5"
              >
                {saving ? (
                  <span className="text-xs">Processing...</span>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <RotateCw size={16} className="text-blue-400" />
                      <span>Replace Original</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-normal">
                      Overwrites current item
                    </span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleSave("new")}
                disabled={saving}
                className="bg-gold hover:bg-gold-light text-navy-950 py-4 rounded-xl font-bold text-sm shadow-lg hover:shadow-gold/20 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50"
              >
                {saving ? (
                  <span className="text-xs">Processing...</span>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Check size={16} />
                      <span>Save as New</span>
                    </div>
                    <span className="text-[10px] text-navy-900/60 font-normal">
                      Creates a copy
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaEditorModal;
