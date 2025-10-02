import React from "react";

export default function ModeSelector({ mode, setMode }) {
  return (
    <div className="mb-6 flex space-x-4">
      <button
        onClick={() => setMode("text")}
        className={`px-4 py-2 rounded-lg ${
          mode === "text" ? "bg-indigo-500 text-white" : "bg-gray-200"
        }`}
      >
        Test with Text
      </button>
      <button
        onClick={() => setMode("image")}
        className={`px-4 py-2 rounded-lg ${
          mode === "image" ? "bg-indigo-500 text-white" : "bg-gray-200"
        }`}
      >
        Test with Image
      </button>
    </div>
  );
}
