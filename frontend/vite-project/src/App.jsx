import React, { useState } from "react";
import ModeSelector from "./components/ModeSelector.jsx";
import JsonEditor from "./components/JsonEditor.jsx";
import FileUploader from "./components/FileUploader.jsx";
import EndpointDrop from "./components/EndpointDropdown.jsx";
import { EnhancedResponseViewer } from "./components/ResponseConsole.jsx";

export default function App() {
  const [mode, setMode] = useState(null); // "text" or "image"
  const [pipelineMode, setPipelineMode] = useState("fast"); // "fast" or "aiEnhanced"
  const [endpoint, setEndpoint] = useState("");
  const [response, setResponse] = useState("");

  const BACKEND_URL = "https://ai-powered-amount-detection-in-medical.onrender.com/api";

  const handleStepSubmit = async () => {
    if (!endpoint) {
      setResponse("❌ Please select an endpoint first.");
      return;
    }

    setResponse("⏳ Running selected step...");

    try {
      const text =
        mode === "text"
          ? document.querySelector("textarea")?.value || ""
          : null;
      const file =
        mode === "image"
          ? document.querySelector("#fileInput")?.files[0]
          : null;

      if (mode === "text" && !text.trim())
        return setResponse("❌ Please enter some text.");
      if (mode === "image" && !file)
        return setResponse("❌ Please select a file.");

      // Helper function for API calls
      const apiCall = async (url, options) => {
        const res = await fetch(url, options);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `API call failed: ${res.status}`);
        }
        return await res.json();
      };

      let result;

      switch (endpoint) {
        case "/ocr":
          const ocrUrl = `${BACKEND_URL}/ocr?mode=${pipelineMode}`;

          // TEXT MODE
          if (mode === "text") {
            result = await apiCall(ocrUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });
          }
          // IMAGE MODE: NO headers for FormData - browser sets it automatically
          else {
            const formData = new FormData();
            formData.append("image", file);

            result = await apiCall(ocrUrl, {
              method: "POST",
              body: formData,
            });
          }
          break;

        case "/normalize":
          // For normalization, we need to run OCR first to get tokens
          const ocrUrlForNorm = `${BACKEND_URL}/ocr?mode=${pipelineMode}`;
          let ocrData;

          if (mode === "text") {
            ocrData = await apiCall(ocrUrlForNorm, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });
          }
          else {
            const formData = new FormData();
            formData.append("image", file);

            ocrData = await apiCall(ocrUrlForNorm, {
              method: "POST",
              body: formData,
            });
          }

          if (!ocrData.raw_tokens || !Array.isArray(ocrData.raw_tokens)) {
            throw new Error("No tokens found from OCR step");
          }

          const normUrl = `${BACKEND_URL}/normalize?mode=${pipelineMode}`;
          result = await apiCall(normUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tokens: ocrData.raw_tokens }),
          });
          break;

        case "/classify":
          // For classification, we need OCR -> Normalize first
          const ocrUrlForClass = `${BACKEND_URL}/ocr?mode=${pipelineMode}`;
          let ocrDataForClass;

          if (mode === "text") {
            ocrDataForClass = await apiCall(ocrUrlForClass, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });
          }
          else {
            const formData = new FormData();
            formData.append("image", file);

            ocrDataForClass = await apiCall(ocrUrlForClass, {
              method: "POST",
              body: formData,
            });
          }

          if (
            !ocrDataForClass.raw_tokens ||
            !Array.isArray(ocrDataForClass.raw_tokens)
          ) {
            throw new Error("No tokens found from OCR step");
          }

          const normUrlForClass = `${BACKEND_URL}/normalize?mode=${pipelineMode}`;
          const normalized = await apiCall(normUrlForClass, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tokens: ocrDataForClass.raw_tokens }),
          });

          if (
            !normalized.normalized_amounts ||
            !Array.isArray(normalized.normalized_amounts)
          ) {
            throw new Error("No normalized amounts found");
          }

          const classUrl = `${BACKEND_URL}/classify?mode=${pipelineMode}`;
          result = await apiCall(classUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              normalizedAmounts: normalized.normalized_amounts,
              text: mode === "text" ? text : ocrDataForClass.text,
            }),
          });
          break;

        case "/final":
          // For final, we need the complete pipeline: OCR -> Normalize -> Classify
          const ocrUrlForFinal = `${BACKEND_URL}/ocr?mode=${pipelineMode}`;
          let ocrDataForFinal;

          if (mode === "text") {
            ocrDataForFinal = await apiCall(ocrUrlForFinal, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });
          }
          else {
            const formData = new FormData();
            formData.append("image", file);

            ocrDataForFinal = await apiCall(ocrUrlForFinal, {
              method: "POST",
              body: formData,
            });
          }

          if (
            !ocrDataForFinal.raw_tokens ||
            !Array.isArray(ocrDataForFinal.raw_tokens)
          ) {
            throw new Error("No tokens found from OCR step");
          }

          const normUrlForFinal = `${BACKEND_URL}/normalize?mode=${pipelineMode}`;
          const normalizedForFinal = await apiCall(normUrlForFinal, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tokens: ocrDataForFinal.raw_tokens }),
          });

          if (
            !normalizedForFinal.normalized_amounts ||
            !Array.isArray(normalizedForFinal.normalized_amounts)
          ) {
            throw new Error("No normalized amounts found");
          }

          const classUrlForFinal = `${BACKEND_URL}/classify?mode=${pipelineMode}`;
          const classified = await apiCall(classUrlForFinal, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              normalizedAmounts: normalizedForFinal.normalized_amounts,
              text: mode === "text" ? text : ocrDataForFinal.text,
            }),
          });

          if (!classified.amounts || !Array.isArray(classified.amounts)) {
            throw new Error("No classified amounts found");
          }

          const finalUrl = `${BACKEND_URL}/final`;
          result = await apiCall(finalUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amounts: classified.amounts,
              currency: ocrDataForFinal.currency_hint || "INR",
            }),
          });
          break;

        default:
          throw new Error("Unknown endpoint");
      }

      setResponse(JSON.stringify(result, null, 2));
    } catch (err) {
      setResponse(`❌ Error: ${err.message}`);
      console.error("Step execution error:", err);
    }
  };

  const handleFullPipeline = async () => {
    setResponse("⏳ Running full pipeline...");
    try {
      const text =
        mode === "text"
          ? document.querySelector("textarea")?.value || ""
          : null;
      const file =
        mode === "image"
          ? document.querySelector("#fileInput")?.files[0]
          : null;

      if (mode === "text" && !text.trim())
        return setResponse("❌ Please enter some text.");
      if (mode === "image" && !file)
        return setResponse("❌ Please select a file.");

      if (mode === "text") {
        const res = await fetch(
          `${BACKEND_URL}/detect-amounts?mode=${pipelineMode}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          }
        );

        const data = await res.json();
        setResponse(JSON.stringify(data, null, 2));
      }

      else {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch(
          `${BACKEND_URL}/detect-amounts?mode=${pipelineMode}`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();
        setResponse(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setResponse(`❌ Error: ${err.message}`);
    }
  };

  const handleCancel = () => {
    setMode(null);
    setPipelineMode("fast");
    setEndpoint("");
    setResponse("❌ Request cancelled.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent mb-3">
          AI-Powered Amount Detection
        </h1>
        <p className="text-gray-300 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
          Upload your medical bill or paste text to test the pipeline with
          intelligent AI analysis
        </p>

        {/* Pipeline Mode Selector */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => setPipelineMode("fast")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              pipelineMode === "fast"
                ? "bg-indigo-500 text-white shadow-lg"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🚀 Fast Mode
          </button>
          <button
            onClick={() => setPipelineMode("aiEnhanced")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              pipelineMode === "aiEnhanced"
                ? "bg-green-500 text-white shadow-lg"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🤖 AI Enhanced
          </button>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          {pipelineMode === "fast"
            ? "Using rule-based processing"
            : "Using AI-enhanced processing"}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl border border-gray-700/50 relative z-10">
        {/* Mode Selection */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-200 mb-4 flex items-center">
            <svg
              className="w-5 h-5 text-indigo-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Select Input Method
          </h2>
          <ModeSelector mode={mode} setMode={setMode} />
        </div>

        {/* Content Area */}
        <div className="mb-8">
          {mode === "text" && <JsonEditor />}
          {mode === "image" && <FileUploader />}
        </div>

        {/* Endpoint */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-200 mb-4 flex items-center">
            <svg
              className="w-5 h-5 text-indigo-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            API Configuration
          </h2>
          <EndpointDrop endpoint={endpoint} setEndpoint={setEndpoint} />
          <p className="text-gray-400 text-sm mt-2 text-center">
            Use "Run Full Pipeline" below for complete end-to-end processing
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8">
          <button
            onClick={handleStepSubmit}
            className="flex items-center justify-center bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl font-semibold"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Run Selected Step
          </button>
          <button
            onClick={handleFullPipeline}
            className="flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl font-semibold"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Run Full Pipeline
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-200 px-6 py-3 rounded-xl shadow transition-all duration-200 font-semibold border border-gray-600 hover:border-gray-500"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Cancel
          </button>
        </div>

        {/* Usage Guide */}
        <div className="mt-8 p-4 bg-gray-700/50 rounded-lg border border-gray-600/50">
          <h3 className="text-lg font-semibold text-gray-200 mb-2 flex items-center">
            <svg
              className="w-5 h-5 text-blue-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            How to Use
          </h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>
              • <span className="font-semibold">Run Selected Step:</span> Test
              individual pipeline steps (OCR, Normalize, Classify, Final)
            </li>
            <li>
              • <span className="font-semibold">Run Full Pipeline:</span>{" "}
              Complete end-to-end processing from input to final output
            </li>
            <li>
              • <span className="font-semibold">Fast Mode:</span> Rule-based
              processing (faster, less accurate)
            </li>
            <li>
              • <span className="font-semibold">AI Enhanced:</span> AI-powered
              processing (slower, more accurate)
            </li>
          </ul>
        </div>
      </div>

      {/* Response Section */}
      <div className="w-full max-w-4xl mt-6 sm:mt-8 relative z-10">
        <EnhancedResponseViewer response={response} />
      </div>
    </div>
  );
}
