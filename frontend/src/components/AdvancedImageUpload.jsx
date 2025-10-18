import { useState, useRef } from 'react';
import { X, Upload, Crop, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdvancedImageUpload({ onImageSelect, existingImages = [] }) {
  const [images, setImages] = useState(existingImages);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const newImage = {
            file,
            preview: reader.result,
            name: file.name,
            size: file.size
          };
          
          setImages(prev => [...prev, newImage]);
          setPreviewUrls(prev => [...prev, reader.result]);
          
          // Call parent callback
          if (onImageSelect) {
            onImageSelect([...images, newImage]);
          }
        };
        
        reader.readAsDataURL(file);
      }
    });
    
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    setImages(newImages);
    setPreviewUrls(newPreviews);
    
    if (onImageSelect) {
      onImageSelect(newImages);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Add Photo
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <span className="text-sm text-gray-500">
          {images.length} photo{images.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-teal-500 transition-all"
            >
              {/* Image Preview */}
              <img
                src={image.preview || image}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {/* Remove Button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
                
                {/* Image Info */}
                <div className="absolute bottom-2 left-2 right-2 text-white text-xs">
                  <p className="truncate font-medium">{image.name || `Photo ${index + 1}`}</p>
                  {image.size && (
                    <p className="text-gray-300">{formatFileSize(image.size)}</p>
                  )}
                </div>
              </div>
              
              {/* Index Badge */}
              <div className="absolute top-2 left-2 bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all"
        >
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Click to add photos
          </p>
          <p className="text-sm text-gray-500">
            or drag and drop
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Tip:</strong> You can add multiple photos. The first photo will be the cover image.
        </p>
      </div>
    </div>
  );
}
