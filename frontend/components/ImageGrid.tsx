// src/components/ImageGrid.tsx

import React from "react";
import { ImageFile } from "../types";
import { CheckCircleIcon } from "./Icons";

interface ImageGridProps {
  images: ImageFile[];
  title: string;
  isResult?: boolean;
  onImageClick?: (image: ImageFile) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  title,
  isResult = false,
  onImageClick,
}) => {
  const isClickable = isResult && onImageClick;

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold text-slate-300 mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {images.map((imageFile) => (
          <div
            key={imageFile.id}
            className={`relative aspect-square group overflow-hidden rounded-lg shadow-lg ${
              isClickable ? "cursor-pointer" : ""
            }`}
            onClick={() => isClickable && onImageClick(imageFile)}
          >
            <img
              src={imageFile.previewUrl}
              alt={imageFile.file.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-white text-xs text-center p-2 break-all">
                {imageFile.file.name}
              </p>
            </div>
            {isResult && (
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGrid;
