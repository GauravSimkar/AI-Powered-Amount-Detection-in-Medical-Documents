import React from "react";

export default function JsonEditor() {
  return (
    <textarea
      placeholder="Paste your JSON object here..."
      className="w-full max-w-lg h-40 p-3 border rounded-lg focus:ring focus:ring-indigo-300"
    ></textarea>
  );
}
