export enum ProcessStatus {
  IDLE = "IDLE",
  PROCESSING = "PROCESSING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
}

// New interface for the backend API response
export interface ProcessedImageResponse {
  filename: string;
  processed_image_b64: string;
  content_type: string;
}
