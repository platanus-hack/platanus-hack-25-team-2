"use client";

import FaceRecognition from "@/components/FaceRecognition";

export default function FaceRecognitionPage() {
  const handlePhotoCapture = (photo: string) => {
    console.log("📸 Photo captured:", photo.substring(0, 50) + "...");
    // Here you can send the photo to your API
    // Example: sendToAPI(photo);
  };

  return <FaceRecognition onPhotoCapture={handlePhotoCapture} />;
}
