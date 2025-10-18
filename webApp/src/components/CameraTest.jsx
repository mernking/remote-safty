import { useState } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { CameraCapture } from './CameraCapture.jsx';

export const CameraTest = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);

  const handleCapture = (imageData) => {
    setCapturedImages(prev => [...prev, imageData]);
    console.log('Image captured:', imageData);
  };

  const openCamera = () => {
    // Check for camera support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera not supported on this device');
      return;
    }
    setShowCamera(true);
  };

  return (
    <div className="p-6 bg-base-100 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5" />
        Camera Test
      </h3>

      <div className="space-y-4">
        <button
          onClick={openCamera}
          className="btn btn-primary gap-2"
        >
          <Camera className="w-4 h-4" />
          Open Camera
        </button>

        {capturedImages.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Captured Images ({capturedImages.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {capturedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.dataUrl}
                    alt={`Captured ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {new Date(image.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {capturedImages.length === 0 && (
          <div className="text-center py-8 text-base-content/50">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No images captured yet</p>
            <p className="text-sm">Click "Open Camera" to test photo capture</p>
          </div>
        )}
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};