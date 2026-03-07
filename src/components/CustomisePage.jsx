import React, { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";

const productTypes = [
  { value: "tshirt", label: "T-Shirt" },
  { value: "totebag", label: "Tote Bag" },
];

const teeFits = [
  { value: "regular", label: "Regular Fit" },
  { value: "oversized", label: "Oversized Fit" },
];

const tshirtMockupImage = "/images/mocktee.jpg";

const baseColorOptions = [
  { value: "#ffffff", label: "White" },
  { value: "#111111", label: "Black" },
];

const CustomisePage = () => {
  const [productType, setProductType] = useState("tshirt");
  const [teeFit, setTeeFit] = useState("regular");
  const [baseColor, setBaseColor] = useState("#ffffff");

  const [designText, setDesignText] = useState("Groovy Bugs");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(24);
  const [textY, setTextY] = useState(55);

  const [uploadedImage, setUploadedImage] = useState("");
  const [imageScale, setImageScale] = useState(55);
  const [imageY, setImageY] = useState(45);
  const [imageOpacity, setImageOpacity] = useState(100);

  const [rotationY, setRotationY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const mockupCaptureRef = useRef(null);

  const isTshirt = productType === "tshirt";
  const isOversized = teeFit === "oversized";
  const isWhiteBase = baseColor === "#ffffff";

  const onProductChange = (type) => {
    setProductType(type);
    setRotationY(0);
  };

  const handlePointerDown = (event) => {
    setIsDragging(true);
    setDragStartX(event.clientX);
  };

  const handlePointerMove = (event) => {
    if (!isDragging) {
      return;
    }

    const deltaX = event.clientX - dragStartX;
    const nextRotation = (rotationY + deltaX * 0.7 + 360) % 360;
    setRotationY(nextRotation);
    setDragStartX(event.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const tshirtContainerStyle = useMemo(
    () => ({
      width: isOversized ? "340px" : "304px",
      height: isOversized ? "420px" : "396px",
      left: "50%",
      top: isOversized ? "22px" : "38px",
      transform: "translateX(-50%)",
      overflow: "hidden",
      // Crops out the image background so only the tshirt remains as the mockup.
      clipPath:
        "polygon(49% 5%, 58% 5%, 66% 10%, 84% 26%, 73% 40%, 66% 32%, 65% 95%, 35% 95%, 34% 32%, 27% 40%, 16% 26%, 34% 10%, 42% 5%)",
    }),
    [isOversized]
  );

  const tshirtImageStyle = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center",
      filter: isWhiteBase ? "invert(1) grayscale(1) brightness(1.24) contrast(0.9)" : "none",
    }),
    [isWhiteBase]
  );

  const mockupStyle = useMemo(
    () => ({
      width: "360px",
      height: "460px",
      borderRadius: "20px",
      transformStyle: "preserve-3d",
      transform: `rotateY(${rotationY}deg)`,
      transition: isDragging ? "none" : "transform 160ms ease-out",
    }),
    [rotationY, isDragging]
  );

  const printAreaStyle = useMemo(
    () => ({
      width: isTshirt ? (isOversized ? "54%" : "48%") : "64%",
      height: isTshirt ? (isOversized ? "34%" : "33%") : "50%",
      top: isTshirt ? (isOversized ? "40%" : "40%") : "30%",
      left: "50%",
      transform: "translateX(-50%)",
      pointerEvents: "none",
    }),
    [isTshirt, isOversized]
  );

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMockup = async () => {
    if (!mockupCaptureRef.current) {
      toast.error("Preview is not ready yet.", { theme: "dark" });
      return;
    }

    try {
      const canvas = await html2canvas(mockupCaptureRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      const imageData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imageData;
      link.download = `groovybugs-mockup-${productType}-${Date.now()}.png`;
      link.click();

      toast.success("Mockup saved as PNG.", { theme: "dark" });
    } catch (error) {
      console.error("Failed to save mockup:", error);
      toast.error("Could not save mockup. Please try again.", { theme: "dark" });
    }
  };

  return (
    <section className="bg-main-bg min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-black text-white text-center mb-4 font-mono tracking-wider uppercase">
          CUSTOMISE
        </h1>
        <p className="text-gray-300 text-center font-mono mb-12 max-w-3xl mx-auto">
          Upload your own design or add text to preview it on a T-shirt or Tote Bag mockup.
        </p>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white text-xl font-bold font-mono mb-6">Design Controls</h2>

            <div className="mb-6">
              <p className="text-gray-300 font-mono text-sm mb-3 uppercase">Product</p>
              <div className="grid grid-cols-2 gap-3">
                {productTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => onProductChange(type.value)}
                    className={`rounded-lg py-2 px-4 font-mono font-bold transition-colors ${
                      productType === type.value
                        ? "bg-main-purple text-white"
                        : "bg-gray-800 text-gray-200 hover:bg-gray-700"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {isTshirt && (
              <div className="mb-6">
                <p className="text-gray-300 font-mono text-sm mb-3 uppercase">T-Shirt Fit</p>
                <div className="grid grid-cols-2 gap-3">
                  {teeFits.map((fit) => (
                    <button
                      key={fit.value}
                      type="button"
                      onClick={() => setTeeFit(fit.value)}
                      className={`rounded-lg py-2 px-4 font-mono font-bold transition-colors ${
                        teeFit === fit.value
                          ? "bg-main-purple text-white"
                          : "bg-gray-800 text-gray-200 hover:bg-gray-700"
                      }`}
                    >
                      {fit.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <p className="text-gray-300 font-mono text-sm mb-3 uppercase">Base Color</p>
              <div className="grid grid-cols-2 gap-3">
                {baseColorOptions.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setBaseColor(colorOption.value)}
                    className={`rounded-lg py-2 px-4 border font-mono font-bold transition-colors ${
                      baseColor === colorOption.value
                        ? "border-main-purple bg-main-purple text-white"
                        : "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-gray-400"
                        style={{ backgroundColor: colorOption.value }}
                      />
                      {colorOption.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 font-mono text-sm mb-2 uppercase" htmlFor="design-upload">
                Upload Image
              </label>
              <input
                id="design-upload"
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-main-purple file:px-4 file:py-2 file:font-mono file:font-bold file:text-white hover:file:bg-purple-600"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 font-mono text-sm mb-2 uppercase" htmlFor="design-text">
                Custom Text
              </label>
              <input
                id="design-text"
                type="text"
                value={designText}
                onChange={(e) => setDesignText(e.target.value)}
                placeholder="Type your design text"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-4 py-3 font-mono focus:outline-none focus:border-main-purple"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 font-mono text-xs mb-2 uppercase" htmlFor="text-size">
                  Text Size ({textSize}px)
                </label>
                <input
                  id="text-size"
                  type="range"
                  min="12"
                  max="48"
                  value={textSize}
                  onChange={(e) => setTextSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-mono text-xs mb-2 uppercase" htmlFor="text-y">
                  Text Position ({textY}%)
                </label>
                <input
                  id="text-y"
                  type="range"
                  min="20"
                  max="85"
                  value={textY}
                  onChange={(e) => setTextY(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-mono text-xs mb-2 uppercase" htmlFor="image-scale">
                  Image Size ({imageScale}%)
                </label>
                <input
                  id="image-scale"
                  type="range"
                  min="20"
                  max="100"
                  value={imageScale}
                  onChange={(e) => setImageScale(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-mono text-xs mb-2 uppercase" htmlFor="image-y">
                  Image Position ({imageY}%)
                </label>
                <input
                  id="image-y"
                  type="range"
                  min="15"
                  max="85"
                  value={imageY}
                  onChange={(e) => setImageY(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-mono text-xs mb-2 uppercase" htmlFor="image-opacity">
                  Image Opacity ({imageOpacity}%)
                </label>
                <input
                  id="image-opacity"
                  type="range"
                  min="20"
                  max="100"
                  value={imageOpacity}
                  onChange={(e) => setImageOpacity(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-mono text-xs mb-2 uppercase" htmlFor="text-color">
                  Text Color
                </label>
                <input
                  id="text-color"
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-full h-10 rounded-lg bg-gray-800 border border-gray-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-mono text-xs mb-2 uppercase" htmlFor="rotation-y">
                  360 Rotation ({Math.round(rotationY)}deg)
                </label>
                <input
                  id="rotation-y"
                  type="range"
                  min="0"
                  max="360"
                  value={rotationY}
                  onChange={(e) => setRotationY(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white text-xl font-bold font-mono mb-6">Mockup Preview</h2>

            <div ref={mockupCaptureRef} className="py-3 flex justify-center" style={{ perspective: "1200px" }}>
              <div
                className="relative cursor-grab active:cursor-grabbing select-none"
                style={mockupStyle}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {isTshirt && (
                  <>
                    <div className="absolute" style={tshirtContainerStyle}>
                      <img
                        src={tshirtMockupImage}
                        alt="T-Shirt Mockup"
                        className="drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"
                        style={tshirtImageStyle}
                      />
                    </div>
                  </>
                )}

                {!isTshirt && (
                  <>
                    <div
                      className="absolute rounded-xl"
                      style={{
                        width: "290px",
                        height: "360px",
                        left: "50%",
                        top: "72px",
                        transform: "translateX(-50%)",
                        background: isWhiteBase
                          ? "linear-gradient(180deg, #ffffff 0%, #e5e7eb 100%)"
                          : "linear-gradient(180deg, #2b313b 0%, #101826 100%)",
                        boxShadow: isWhiteBase
                          ? "inset 0 0 0 1px rgba(148,163,184,0.6)"
                          : "inset 0 0 0 1px rgba(255,255,255,0.14)",
                      }}
                    />
                    <div
                      className="absolute rounded-t-full border-[10px]"
                      style={{
                        width: "170px",
                        height: "130px",
                        top: "18px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        borderColor: isWhiteBase ? "#d1d5db" : "#4b5563",
                        borderBottom: "none",
                      }}
                    />
                  </>
                )}

                <div className="absolute border border-dashed border-white/30 rounded-lg overflow-hidden" style={printAreaStyle}>
                  {uploadedImage && (
                    <img
                      src={uploadedImage}
                      alt="Custom upload"
                      className="absolute left-1/2 -translate-x-1/2 object-contain"
                      style={{
                        top: `${imageY}%`,
                        transform: "translate(-50%, -50%)",
                        width: `${imageScale}%`,
                        opacity: imageOpacity / 100,
                      }}
                    />
                  )}

                  {designText.trim() && (
                    <p
                      className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-black font-mono text-center px-2"
                      style={{
                        top: `${textY}%`,
                        transform: "translate(-50%, -50%)",
                        color: textColor,
                        fontSize: `${textSize}px`,
                        lineHeight: 1,
                      }}
                    >
                      {designText}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-400 font-mono mt-6 text-center">
              Drag left or right for a 360-degree view. Final print placement may vary slightly.
            </p>

            <button
              type="button"
              onClick={handleSaveMockup}
              className="w-full mt-5 bg-main-purple text-white rounded-xl py-3 font-mono font-bold tracking-wider hover:bg-purple-600 transition-colors"
            >
              SAVE MOCKUP
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomisePage;
