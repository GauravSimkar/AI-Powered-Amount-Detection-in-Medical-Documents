export const EnhancedResponseViewer = ({ response }) => {
  if (!response) return null;

  // Parse the response if it's a string, otherwise use as is
  const parseResponse = (data) => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        // If parsing fails, try to clean the string and parse again
        try {
          const cleanedData = data.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
          return JSON.parse(cleanedData);
        } catch (e) {
          // If it still fails, return the original string
          return { raw_data: data };
        }
      }
    }
    return data;
  };

  const parsedResponse = parseResponse(response);

  const formatJSON = (obj) => {
    if (typeof obj === 'string') {
      return obj;
    }
    return JSON.stringify(obj, null, 2);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatJSON(parsedResponse));
  };

  const downloadJSON = () => {
    const blob = new Blob([formatJSON(parsedResponse)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'response.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderJSON = (obj) => {
    const jsonString = formatJSON(obj);
    return (
      <div className="whitespace-pre font-mono text-sm">
        {jsonString.split('\n').map((line, index) => (
          <div key={`line-${index}`} className="flex hover:bg-gray-800/50 transition-colors"> 
            <span className="text-gray-500 select-none mr-4 w-8 text-right">{index + 1}</span>
            <span className="flex-1 text-gray-300">
              {line}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 border-b border-gray-700/50 flex justify-between items-center">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-200">AI Response</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
          <button
            onClick={downloadJSON}
            className="flex items-center px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* JSON Content */}
      <div className="p-6 bg-gray-900/50">
        <div className="bg-gray-900/80 rounded-lg border border-gray-700/50 max-h-96 overflow-y-auto">
          <div className="p-4">
            {renderJSON(parsedResponse)}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-900/50 px-6 py-3 border-t border-gray-700/50">
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Response received
          </div>
          <div>
            {parsedResponse && typeof parsedResponse === 'object' && `Objects: ${Object.keys(parsedResponse).length} | Size: ${formatJSON(parsedResponse).length} chars`}
          </div>
        </div>
      </div>
    </div>
  );
};