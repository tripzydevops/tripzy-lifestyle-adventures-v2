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
  mimeType?: string;
}

const MediaEditorModal: React.FC<MediaEditorModalProps> = ({
  imageUrl,
  onSave,
  onClose,
  isOpen,
  fileName = "image",
  mimeType = "image/jpeg",
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

    // Apply Blemish/Spot Removal Filter
    if (blemishes.length > 0) {
      blemishes.forEach((b) => {
        // b.x and b.y are relative to the ORIGINAL image dimensions (0-1)
        // We need to map them to the safeArea canvas coordinates

        // 1. Calculate position on the Rotated/Centered image
        // The image is drawn at:
        // x = safeArea / 2 - image.width * 0.5
        // y = safeArea / 2 - image.height * 0.5

        const imgStartX = safeArea / 2 - image.width * 0.5;
        const imgStartY = safeArea / 2 - image.height * 0.5;

        const spotX = imgStartX + b.x * image.width;
        const spotY = imgStartY + b.y * image.height;

        // Radius relative to image width for consistency
        const spotRadius = b.radius * image.width;

        // Apply Blur Effect to this spot
        ctx.save();
        ctx.beginPath();
        ctx.arc(spotX, spotY, spotRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Simple Blur approximation: Draw the image again over the spot but shifted/blurred
        // Since standard canvas blur filter can be expensive or inconsistent,
        // we'll use a backdrop filter or simply fill with an average color if blur isn't available.
        // Best approach for "Retouch" without heavy libraries:
        // 1. Get ImageData
        // 2. Simple box blur on pixels
        // 3. Put back

        // Optimization: just use the context filter if supported, fallback to clearRect (bad) or fill
        ctx.filter = "blur(30px)";
        ctx.drawImage(
          image,
          safeArea / 2 - image.width * 0.5,
          safeArea / 2 - image.height * 0.5
        );

        ctx.restore();
      });
    }

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    // reset filter for final crop extraction if needed
    ctx.filter = "none";

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
        mimeType, // Use original mimeType
        0.9
      );
    });
  };

  // Filename state
  const [currentFileName, setCurrentFileName] = useState(fileName);

  useEffect(() => {
    // Strip extension for editing
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    setCurrentFileName(nameWithoutExt);
  }, [fileName]);

  const sanitizeFileName = (name: string) => {
    const trMap: Record<string, string> = {
      ş: "s",
      Ş: "s",
      ı: "i",
      İ: "i",
      ğ: "g",
      Ğ: "g",
      ü: "u",
      Ü: "u",
      ö: "o",
      Ö: "o",
      ç: "c",
      Ç: "c",
    };
    return name
      .split("")
      .map((char) => trMap[char] || char)
      .join("")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-"); // Remove duplicate hyphens
  };

  const handleFileNameBlur = () => {
    const sanitized = sanitizeFileName(currentFileName);
    setCurrentFileName(sanitized || "image");
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
        const cleanName = currentFileName; // Use user-edited name

        // For replaced items, we might want to keep original name to be cleaner,
        // but adding a suffix ensures cache busting and uniqueness.
        // For 'new', we definitely want a prefix.

        let newName = fileName; // Default to existing name

        if (mode === "new") {
          // Construct new filename with correct extension
          let ext = ".jpg";
          if (mimeType === "image/png") ext = ".png";
          else if (mimeType === "image/webp") ext = ".webp";

          newName = `${cleanName}${ext}`;
        } else {
          // DELETE: Logic about keeping original name only applies if we want to overwrite EXACTLY the same file reference.
          // IF the user changed the name, we might ideally want to rename the file, but for "Replace" mode,
          // the backend logic often implies "keep the same URL/path".
          // However, if we pass a new file object with a new name, the upload service MIGHT use it if we changed logic there.
          // BUT, `ManageMediaPage` logic for "replace" explicitly extracts the ORIGINAL filename from the URL to overwrite it.
          // So changing name here for 'replace' effectively does nothing for the storage path,
          // BUT it creates a file with the right metadata name which is good.
          // For now, we trust `ManageMediaPage` to handle the 'replace' path logic,
          // but we still send the file with the potentially updated name in case future logic uses it.

          let ext = ".jpg";
          if (mimeType === "image/png") ext = ".png";
          else if (mimeType === "image/webp") ext = ".webp";
          newName = `${cleanName}${ext}`;
        }

        const file = new File([croppedBlob], newName, {
          type: mimeType,
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

  // Mode Tab
  const [activeTab, setActiveTab] = useState<"crop" | "adjust" | "retouch">(
    "crop"
  );
  const [blemishes, setBlemishes] = useState<
    Array<{ x: number; y: number; radius: number }>
  >([]);
  const imageRef = useRef<HTMLImageElement>(null);

  const addBlemish = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (activeTab !== "retouch" || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    // Default blemish size relative to image
    setBlemishes([...blemishes, { x, y, radius: 0.03 }]);
  };

  const undoLastBlemish = () => {
    setBlemishes((prev) => prev.slice(0, -1));
  };

  const clearBlemishes = () => {
    setBlemishes([]);
  };

  const reset = () => {
    setBrightness(100);
    setContrast(100);
    setRotation(0);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setBlemishes([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-navy-950 w-full max-w-6xl h-[90vh] rounded-3xl border border-white/5 flex overflow-hidden shadow-2xl relative">
        {/* Main Canvas Area */}
        <div className="flex-1 bg-[#0f0f15] relative overflow-hidden flex items-center justify-center">
          {/* Grid Pattern Background */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none z-0"
            style={{
              backgroundImage:
                "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative w-full h-full z-10 flex items-center justify-center p-8">
            {activeTab === "retouch" ? (
              <div className="relative inline-block shadow-2xl">
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Retouch"
                  className="max-h-[80vh] max-w-full object-contain cursor-crosshair select-none"
                  style={{
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                    transform: `rotate(${rotation}deg) scale(${zoom})`,
                  }}
                  onMouseDown={addBlemish}
                />
                {/* Blemish Overlays (Need to account for transforms if we want them to stick effectively visually in this simple view, 
                    but for now calculating RELATIVE to the image element is easiest if we don't apply CSS transform to wrapper)
                    Actually, sticking them ON the image with absolute positioning is best.
                */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${zoom})`,
                    // This transform might desync markers from click if not careful,
                    // but since click is on the IMG which is transformed, the coordinates are local to rect.
                    // Let's rely on percentage positioning.
                  }}
                >
                  {blemishes.map((b, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full bg-red-500/30 border border-red-500 shadow-sm"
                      style={{
                        left: `${b.x * 100}%`,
                        top: `${b.y * 100}%`,
                        width: "40px", // Visual size approx
                        height: "40px",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              Cropper && (
                <>
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
                    showGrid={false}
                    classes={{
                      containerClassName: "cropper-container",
                      mediaClassName: "cropper-media",
                    }}
                    style={{
                      mediaStyle: {
                        filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                      },
                    }}
                  />

                  {/* Custom 3x4 Grid Overlay */}
                  <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                    <div className="w-full h-full opacity-30">
                      {/* 3 Columns (2 vertical lines) */}
                      <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                      <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>

                      {/* 4 Rows (3 horizontal lines) */}
                      <div className="absolute top-1/4 left-0 right-0 h-px bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                      <div className="absolute top-2/4 left-0 right-0 h-px bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                      <div className="absolute top-3/4 left-0 right-0 h-px bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                    </div>
                  </div>
                </>
              )
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

          {/* FILENAME INPUT (SEO) */}
          <div className="px-6 pt-6 -mb-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
              File Name (SEO)
            </label>
            <div className="relative">
              <input
                type="text"
                value={currentFileName}
                onChange={(e) => setCurrentFileName(e.target.value)}
                onBlur={handleFileNameBlur}
                placeholder="e.g. florence-city-view"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/50 transition-all font-mono"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">
                {mimeType.split("/")[1]}
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5">
              Use "-" for spaces. Lowercase only.
            </p>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex border-b border-white/5 mx-6 mt-4">
            {(["crop", "adjust", "retouch"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === tab
                    ? "border-gold text-gold"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {activeTab === "adjust" && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sun size={14} /> Look & Feel
                </h4>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300 flex justify-between">
                      Brightness{" "}
                      <span className="text-gold">{brightness}%</span>
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
            )}

            {activeTab === "crop" && (
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
            )}

            {activeTab === "retouch" && (
              <div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-blue-200 text-xs mb-6">
                  💡 Tap anywhere on the image to mask blemishes or spots.
                </div>

                <div className="space-y-3">
                  <button
                    onClick={undoLastBlemish}
                    disabled={blemishes.length === 0}
                    className="w-full bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-white/5"
                  >
                    <Undo2 size={16} /> Undo Last Spot
                  </button>

                  <button
                    onClick={clearBlemishes}
                    disabled={blemishes.length === 0}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 border border-red-500/20"
                  >
                    Clear All Spots
                  </button>
                </div>
              </div>
            )}

            {activeTab === "crop" && (
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-blue-200 text-xs mt-4">
                💡 Drag image to move, scroll to zoom.
              </div>
            )}
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
