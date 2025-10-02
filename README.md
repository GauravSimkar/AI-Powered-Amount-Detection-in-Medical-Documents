# AI-Powered Amount Detection in Medical Documents

An intelligent system that automatically extracts and classifies monetary amounts from medical bills, receipts, and healthcare documents using OCR technology and AI-enhanced processing.

## 🚀 Overview

This project provides a sophisticated pipeline for detecting and categorizing financial amounts in medical documents. It combines traditional OCR with AI-powered classification to accurately identify different types of medical expenses like consultation fees, medicine costs, lab tests, and procedure charges.

### Key Features

- **Multi-format Support**: Process both text input and image uploads (JPEG, PNG, BMP)
- **Dual Processing Modes**: Choose between fast rule-based processing or AI-enhanced analysis
- **Smart Classification**: Automatically categorizes amounts into medical expense types
- **Currency Detection**: Supports multiple currencies (INR, USD, EUR, GBP)
- **RESTful API**: Fully documented endpoints for easy integration
- **Modern Web Interface**: React-based frontend with real-time processing visualization

## 🛠️ Tech Stack

### Backend
- **Node.js & Express** - Server runtime and API framework
- **Tesseract.js** - OCR for text extraction from images
- **Google Gemini AI** - AI-enhanced processing and validation
- **Multer** - File upload handling

### Frontend
- **React** - Modern UI framework
- **Tailwind CSS** - Styling and responsive design

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Google Gemini API key (for AI-enhanced mode)

### Backend Setup
```bash
cd backend
npm install

# Set environment variables
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Start development server
npm run dev

```
### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🚀 Usage

Fast Mode 🚀 - Rule-based processing for quick results

AI Enhanced Mode 🤖 - Gemini AI-powered analysis for higher accuracy


## 🏗️ Project Structure
```bash
AI-Powered-Amount-Detection/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Handles request/response
│   │   │   └── amountController.js
│   │   ├── services/          # Business logic (OCR, normalization, classification, final)
│   │   │   ├── ocrService.js
│   │   │   ├── normalizationService.js
│   │   │   ├── classificationService.js
│   │   │   └── finalService.js
│   │   ├── routes/            # API routes
│   │   │   └── amountRoutes.js
│   │   └── config/            # Config (Gemini, DB, etc.)
│   │       └── gemini.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React UI components
│   │   └── App.jsx            # Main React app
│   └── package.json
│
└── README.md
```


## Environment Variables

Create a .env file in the backend directory:
```bash
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=your_gemini-model
```
## API Endpoints

```bash
| Endpoint              | Method | Description                      | Input              |
| --------------------- | ------ | -------------------------------- | ------------------ |
| `/api/ocr`            | POST   | Extract text and amounts         | Image file or text |
| `/api/normalize`      | POST   | Normalize extracted amounts      | OCR tokens         |
| `/api/classify`       | POST   | Classify amounts by type         | Normalized amounts |
| `/api/final`          | POST   | Generate final structured output | Classified amounts |
| `/api/detect-amounts` | POST   | Complete pipeline processing     | Image file or text |


```
## Screenshots
<img width="1366" height="768" alt="Screenshot (588)" src="https://github.com/user-attachments/assets/91446e4c-6a64-4327-9c8b-f32c53754064" />
<img width="1366" height="768" alt="Screenshot (589)" src="https://github.com/user-attachments/assets/f2be30da-7701-4baa-ba1e-f9f75305b1f4" />
<img width="1366" height="768" alt="Screenshot (590)" src="https://github.com/user-attachments/assets/0de3bea3-9c02-4a3e-a377-be68fd486063" />
<img width="1366" height="768" alt="Screenshot (591)" src="https://github.com/user-attachments/assets/cea200df-1813-4702-aee2-b5e81c111e8a" />

