// src/components/ImageModal.tsx

import React from "react";
import { ImageFile } from "../types";
import { CloseIcon } from "./Icons";

interface ImageModalProps {
  image: ImageFile;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
      onClick={onClose} // Close modal on backdrop click
    >
      <div
        className="relative bg-slate-800 p-4 rounded-lg max-w-4xl max-h-[90vh] flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
      >
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-slate-600 rounded-full p-2 text-white hover:bg-slate-500 transition-colors"
          aria-label="Close"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        <h3 className="text-lg font-semibold text-center text-slate-300 truncate">
          {image.file.name}
        </h3>
        <img
          src={image.previewUrl}
          alt={`Processed result for ${image.file.name}`}
          className="max-w-full max-h-[75vh] object-contain"
        />
      </div>
    </div>
  );
};

export default ImageModal;
