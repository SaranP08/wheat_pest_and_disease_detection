// src/App.tsx

import React, { useState, useCallback, useMemo } from "react";
import { ProcessStatus, ImageFile, ProcessedImageResponse } from "./types";
import { UploadIcon, SpinnerIcon, CheckCircleIcon } from "./components/Icons";
import ImageGrid from "./components/ImageGrid";
import ImageModal from "./components/ImageModal";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function App() {
  const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ImageFile[]>([]);
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  // New state for drag-and-drop UI
  const [isDragging, setIsDragging] = useState(false);
  // New state for the image modal
  const [modalImage, setModalImage] = useState<ImageFile | null>(null);

  const isProcessing = useMemo(
    () => status === ProcessStatus.PROCESSING,
    [status]
  );
  const hasFilesSelected = useMemo(
    () => selectedFiles.length > 0,
    [selectedFiles]
  );

  const handleFiles = (files: FileList | null) => {
    if (files) {
      const newImageFiles: ImageFile[] = Array.from(files)
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => ({
          id: `${file.name}-${file.lastModified}`,
          file,
          previewUrl: URL.createObjectURL(file),
        }));

      // Prevent duplicates
      setSelectedFiles((prev) => {
        const existingIds = new Set(prev.map((f) => f.id));
        const trulyNewFiles = newImageFiles.filter(
          (f) => !existingIds.has(f.id)
        );
        return [...prev, ...trulyNewFiles];
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    // Reset the input value to allow selecting the same file again
    event.target.value = "";
  };

  // --- Drag and Drop Handlers ---
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };
  // --- End Drag and Drop Handlers ---

  const handleProcessImages = useCallback(async () => {
    if (!hasFilesSelected) return;

    setStatus(ProcessStatus.PROCESSING);
    setError(null);

    const formData = new FormData();
    selectedFiles.forEach((imageFile) => {
      formData.append("files", imageFile.file, imageFile.file.name);
    });

    try {
      const response = await fetch(`${API_URL}/api/process`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: "An unknown error occurred on the server.",
        }));
        throw new Error(
          errorData.detail || `Server responded with status: ${response.status}`
        );
      }

      const processedData: ProcessedImageResponse[] = await response.json();

      const newProcessedFiles: ImageFile[] = processedData.map(
        (item, index) => {
          const originalFile = selectedFiles.find(
            (f) => f.file.name === item.filename
          );
          return {
            id: originalFile ? originalFile.id : `${item.filename}-${index}`,
            file: originalFile
              ? originalFile.file
              : new File([], item.filename),
            previewUrl: `data:${item.content_type};base64,${item.processed_image_b64}`,
          };
        }
      );

      setProcessedFiles(newProcessedFiles);
      setStatus(ProcessStatus.SUCCESS);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to process images. Please check the backend server.";
      setError(errorMessage);
      setStatus(ProcessStatus.ERROR);
      console.error(err);
    }
  }, [selectedFiles, hasFilesSelected]);

  const handleReset = () => {
    setSelectedFiles([]);
    setProcessedFiles([]);
    setStatus(ProcessStatus.IDLE);
    setError(null);
  };

  const renderContent = () => {
    switch (status) {
      case ProcessStatus.PROCESSING:
        return (
          <div className="text-center p-8">
            <SpinnerIcon className="animate-spin h-12 w-12 text-indigo-400 mx-auto" />
            <p className="mt-4 text-lg font-medium text-slate-300">
              Processing {selectedFiles.length} image(s)...
            </p>
          </div>
        );
      case ProcessStatus.SUCCESS:
        return (
          <div className="flex flex-col items-center gap-8 w-full">
            <div className="text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto" />
              <h2 className="text-2xl font-bold mt-4">Processing Complete!</h2>
              <p className="text-slate-400">
                Click on an image to view it larger.
              </p>
            </div>
            <ImageGrid
              images={processedFiles}
              title="Processed Images"
              isResult={true}
              onImageClick={(image) => setModalImage(image)} // Open modal on click
            />
            <button
              onClick={handleReset}
              className="mt-6 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-colors duration-300"
            >
              Process More Images
            </button>
          </div>
        );
      default: // IDLE or ERROR
        return (
          <div className="flex flex-col items-center gap-8 w-full">
            <div className="w-full max-w-2xl">
              <label
                htmlFor="file-upload"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center cursor-pointer transition-colors duration-300 ${
                  isDragging
                    ? "border-indigo-400 bg-slate-800"
                    : "border-slate-600 hover:border-slate-500"
                }`}
              >
                <UploadIcon />
                <span className="mt-2 block text-sm font-semibold text-slate-300">
                  Drag & drop files here, or click to select files
                </span>
                <span className="block text-xs text-slate-500">
                  PNG, JPG, etc.
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {error && (
              <p className="text-red-400 mt-4 text-center bg-red-900/50 p-3 rounded-lg">
                {error}
              </p>
            )}

            {hasFilesSelected && (
              <>
                <ImageGrid images={selectedFiles} title="Image Previews" />
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="px-6 py-3 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleProcessImages}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {isProcessing
                      ? "Processing..."
                      : `Process ${selectedFiles.length} Image(s)`}
                  </button>
                </div>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
        <header className="text-center my-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Wheat Disease and Pest Detection
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Upload images to detect objects with our AI model.
          </p>
          <p className="mt-2 text-lg text-slate-400">
            Diseases ['Aphid', 'Black Rust', 'Blast', 'Brown Rust', 'Common Root
            Rot', 'Fusarium Head', 'Leaf Blight', 'Mildew', 'Mite', 'Septoria',
            'Smut', 'Stem_fly', 'Tan spot', 'yellow_rust']
          </p>
        </header>
        <main className="w-full flex justify-center mt-8">
          {renderContent()}
        </main>
      </div>
      {/* Conditionally render the modal */}
      {modalImage && (
        <ImageModal image={modalImage} onClose={() => setModalImage(null)} />
      )}
    </div>
  );
}
