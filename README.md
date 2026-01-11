# KisaanSaathi Frontend 🌾

The official farmer-facing frontend for **KisaanSaathi**, a next-generation AI-powered agricultural platform. This application provides farmers with intelligent tools for crop management, financial aid, disease diagnosis, and yield prediction.

![KisaanSaathi Demo](public/vite.svg) *Add a screenshot here*

## 🚀 Key Features

### 🤖 Kisaan Saathi (AI Companion)
*   **Floating Chatbot**: Accessible from anywhere in the dashboard.
*   **Multimodal AI**: Accepts **Voice** inputs (Speech-to-Text) and **Image** uploads.
*   **Plant Doctor**: Instant disease diagnosis using **Llama 4 Maverick** Vision AI.
*   **Smart Flows**: Guided conversational assistance for Loans, Insurance Claims, and Yield Prediction.

### 📊 Farmer Dashboard
*   **Loan Management**: Apply for loans with ML-driven fraud risk assessment and simulated Smart Contract disbursement.
*   **Insurance**: File claims with policy document uploads and AI verification.
*   **Yield Prediction**: Get yield estimates based on soil, crop, and location data using predictive models.
*   **Weather Updates**: Real-time weather forecasts tailored to the farm's location.

### 🎨 Modern UI/UX
*   **Landing Page**: High-performance, interactive 3D Globe (Three.js), and Bauhaus/Aegis-inspired design aesthetics.
*   **Responsive**: Fully optimized for mobile and desktop devices.
*   **Multilingual**: Built-in translation support for regional accessibility.

## 🛠️ Tech Stack

*   **Framework**: [React 19](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) (Animations)
*   **AI Integration**: [Groq SDK](https://groq.com/) (Llama 3, Llama 4 Maverick)
*   **Visualization**: [React Globe GL](https://github.com/vasturiano/react-globe.gl) / Three.js
*   **Authentication**: Firebase Auth
*   **State Management**: React Hooks & Context

## 🔧 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/deba2k5/agri_front.git
cd agri_front/KisaanSaathi_main_frontend/frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (`frontend/`) and add the following keys:

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:5000

# AI Services
VITE_GROQ_API_KEY=your_groq_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run Locally
Start the development server:
```bash
npm run dev
```
Access the app at `http://localhost:5173`.

## 📦 Build & Production

To build the application for production:

```bash
npm run build
```
This generates a static `dist` folder optimized for deployment.

You can preview the production build locally:
```bash
npm run preview
```

## 🐳 Docker Deployment

To containerize the frontend:

1.  **Build the Image**:
    ```bash
    docker build -t kisaansaathi-frontend .
    ```

2.  **Run the Container**:
    ```bash
    docker run -p 5173:80 kisaansaathi-frontend
    ```
    *(Note: Ensure your Nginx/server config inside Docker handles client-side routing)*

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

**Developed by KisaanSaathi Team**
