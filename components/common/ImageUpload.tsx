
import React, { useRef } from 'react';
import Icon from '../Icon';

interface ImageUploadProps {
  onImageUpload: (file: File, base64: string, mimeType: string) => void;
  imagePreviewUrl?: string | null;
  promptText: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, imagePreviewUrl, promptText }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        onImageUpload(file, base64String, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="w-full h-64 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center cursor-pointer hover:border-cyan-400 hover:bg-gray-800/50 transition-all duration-300 relative overflow-hidden"
      onClick={handleAreaClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      {imagePreviewUrl ? (
        <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
      ) : (
        <div className="text-center text-gray-400">
          <Icon name="upload_file" className="text-5xl" />
          <p className="mt-2">{promptText}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
