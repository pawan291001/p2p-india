import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface MediaPreviewProps {
  url: string;
  type: string;
  onClose: () => void;
}

const MediaPreview = ({ url, type, onClose }: MediaPreviewProps) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>
      {type === "video" ? (
        <video
          src={url}
          controls
          autoPlay
          className="max-w-full max-h-full rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={url}
          alt="Preview"
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
};

export default MediaPreview;
