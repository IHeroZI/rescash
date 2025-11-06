import { X } from "lucide-react";
import Image from "next/image";

interface ImageViewerProps {
  imageUrl: string;
  onClose: () => void;
}

export default function ImageViewer({ imageUrl, onClose }: ImageViewerProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
      >
        <X size={24} />
      </button>
      
      <div className="relative w-full max-w-2xl aspect-square" onClick={(e) => e.stopPropagation()}>
        <Image
          src={imageUrl}
          alt="Preview"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}
