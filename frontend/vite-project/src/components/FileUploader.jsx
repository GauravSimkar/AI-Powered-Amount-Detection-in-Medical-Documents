import React from "react";

export default function FileUploader() {
  return (
    <input
      type="file"
      accept="image/*"
      id="fileInput"
      className="block w-full max-w-lg mb-4"
    />
  );
}
