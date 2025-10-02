import React from "react";

export default function EndpointDropdown({ endpoint, setEndpoint }) {
  const endpoints = [
    { value: "", label: "Select endpoint" },
    { value: "/ocr", label: "OCR Extraction (/ocr)" },
    { value: "/normalize", label: "Normalization (/normalize)" },
    { value: "/classify", label: "Classification (/classify)" },
    { value: "/final", label: "Final Output (/final)" },
  ];

  return (
    <select
      value={endpoint}
      onChange={(e) => setEndpoint(e.target.value)}
      className="w-full max-w-lg p-2 border rounded-lg focus:ring focus:ring-indigo-300 mt-4"
    >
      <option value="">-- Select an Endpoint --</option>
      {endpoints.map((endpoint, index) => (
        <option
          key={`endpoint-${endpoint.value}-${index}`}
          value={endpoint.value}
        >
          {endpoint.label}
        </option>
      ))}
    </select>
  );
}
