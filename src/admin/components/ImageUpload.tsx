import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  label?: string;
  accept?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  label = 'Upload Image',
  accept = 'image/*'
}) => {
  const [preview, setPreview] = useState<string>(currentImage || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onImageChange(result);
      };
      reader.readAsDataURL(file);

      // In a real application, you would upload to a storage service like Supabase Storage
      // For demo purposes, we're using the base64 data URL
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview('');
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div className="flex items-start space-x-4">
        {/* Upload Area */}
        <div
          onClick={handleClick}
          className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              <p className="mt-2 text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          )}
        </div>

        {/* Preview */}
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-lg border border-gray-300"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Current Image Display */}
      {currentImage && !preview && (
        <div className="mt-2">
          <p className="text-sm text-gray-600 mb-2">Current Image:</p>
          <div className="relative inline-block">
            <img
              src={currentImage}
              alt="Current"
              className="w-24 h-24 object-cover rounded-lg border border-gray-300"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;