import axios from 'axios';

const API_URL = import.meta.env.VITE_MAIN_BACKEND_URL || 'http://localhost:5000/api';
const API_ROOT_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const getWeather = async (lat, lon) => {
    try {
        const response = await api.get(`/weather?lat=${lat}&lon=${lon}`);
        return response.data; // Expecting backend to now return 7-day forecast structure if updated, or we handle it in TomorrowService
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
    }
};

export const getFarmSummary = async (user, weather) => {
    try {
        const response = await api.post('/ai/analyze', {
            type: 'farm-summary',
            data: { user, weather }
        });
        return response.data.analysis;
    } catch (error) {
        console.error('Error fetching farm summary:', error);
        return "Unable to generate farm summary at this time.";
    }
};

export const sendFeedback = async (originalPrompt, userRating) => {
    try {
        const response = await api.post('/ai/analyze', {
            type: 'feedback',
            data: { originalPrompt, userRating }
        });
        return response.data;
    } catch (error) {
        console.error('Error sending feedback:', error);
        return null;
    }
};

export const askAI = async (prompt, lang = 'hi') => {
    try {
        const response = await api.post('/ai/analyze', { type: 'chat', prompt, lang });
        return response.data; // Now returns { success, analysis, ttsUrl }
    } catch (error) {
        console.error('Error fetching AI analysis:', error);
        return { analysis: "I apologize, but I'm unable to analyze that right now. Please try again later.", ttsUrl: null };
    }
};

/**
 * Chat with Mastra Farmer Assistant Agent
 * @param {string} message - User's message
 * @param {string} userId - Firebase UID of the user
 * @param {string} threadId - Optional conversation thread ID
 * @param {string} lang - Preferred language (default: 'hi')
 * @returns {Promise<Object>} - { success, response, threadId, timestamp }
 */
export const chatWithMastra = async (message, userId, threadId = null, lang = 'hi') => {
    try {
        const response = await api.post('/mastra/chat', {
            message,
            userId,
            threadId,
            lang
        });
        return response.data; // Returns { success, response, threadId, timestamp }
    } catch (error) {
        console.error('Error chatting with Mastra:', error);
        return {
            success: false,
            response: "I apologize, but I'm unable to process your request right now. Please try again later.",
            threadId: threadId || null,
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Execute a Mastra workflow
 * @param {string} workflowName - Name of the workflow to execute
 * @param {Object} input - Input data for the workflow
 * @param {string} userId - Firebase UID of the user
 * @returns {Promise<Object>} - { success, result, workflowName, timestamp }
 */
export const executeMastraWorkflow = async (workflowName, input, userId) => {
    try {
        const response = await api.post('/mastra/workflow', {
            workflowName,
            input,
            userId
        });
        return response.data;
    } catch (error) {
        console.error('Error executing Mastra workflow:', error);
        throw error;
    }
};

export const analyzeYield = async (data) => {
    const response = await api.post('/ai/analyze', { type: 'yield', data });
    return response.data.analysis;
};

export const assessLoan = async (data) => {
    const response = await api.post('/ai/analyze', { type: 'loan', data });
    return response.data.analysis;
};

export const validateInsurance = async (data) => {
    const response = await api.post('/ai/analyze', { type: 'insurance', data });
    return response.data.analysis;
};

export const identifyDisease = async (imageFile, description) => {
    try {
        // Convert image to base64 if provided
        let image = null;
        if (imageFile) {
            const toBase64 = (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
            image = await toBase64(imageFile);
        }

        const response = await api.post('/ai/analyze', {
            type: 'disease',
            data: { image, description }
        });
        return response.data.analysis;
    } catch (error) {
        console.error('Error identifying disease:', error);
        throw error;
    }
};

export const analyzePolicy = async (text) => {
    try {
        const response = await api.post('/ai/analyze', {
            type: 'policy-summary',
            data: { policyText: text }
        });
        return response.data.analysis;
    } catch (error) {
        console.error('Error analyzing policy:', error);
        return "Unable to analyze policy at this time.";
    }
};

export const getFarms = async (lat, lon, maxDistance) => {
    try {
        const response = await api.get('/maps/farms', { params: { lat, lon, maxDistance } });
        return response.data;
    } catch (error) {
        console.error('Error fetching farms:', error);
        throw error;
    }
};

export const createFarm = async (farmData) => {
    try {
        const response = await api.post('/maps/farms', farmData);
        return response.data;
    } catch (error) {
        console.error('Error creating farm:', error);
        throw error;
    }
};

export const getSatelliteImagery = async (lat, lon, date) => {
    try {
        const response = await api.get('/maps/satellite', { params: { lat, lon, date } });
        return response.data;
    } catch (error) {
        console.error('Error fetching satellite imagery:', error);
        throw error;
    }
};


export const applyLoan = async (loanData) => {
    try {
        // Use API_ROOT_URL because loan routes are at /loan, not /api/loan
        const response = await axios.post(`${API_ROOT_URL}/loan/apply`, loanData, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('Error applying for loan:', error);
        throw error;
    }
};

export const submitInsuranceClaim = async (formData) => {
    try {
        // Use API_ROOT_URL because insurance routes are at /insurance, not /api/insurance
        const response = await axios.post(`${API_ROOT_URL}/insurance/create`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error('Error submitting insurance claim:', error);
        throw error;
    }
};

export const submitYieldPrediction = async (predictionData) => {
    // Note: Yield prediction usually comes from an LLM/AI service directly in the frontend component 
    // or a specific backend endpoint. If the user wants to "submit" a request for prediction:
    // We already have 'analyzeYield' which calls '/ai/analyze' with type 'yield'. 
    // But if there is a specific DB record to be created, we might need a dedicated endpoint. 
    // Based on 'YieldPredictionForm.jsx', it uses Groq directly. 
    // For now, we will wrap the AI analysis as the "submission" or create a record if the backend supports it.
    // Assuming we just want to get the prediction:
    try {
        // Re-using the logic from YieldPredictionForm would be ideal, but here we simply expose an endpoint 
        // if the backend implementation follows the pattern. 
        // Let's assume we use the existing analyzeYield for now, but if persistence is needed, we'd add it here.
        return await analyzeYield(predictionData);
    } catch (error) {
        throw error;
    }
};

export const getAgriculturalNews = async () => {
    try {
        const response = await api.get('/news');
        console.log("Fetching agricultural news from backend...", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching agricultural news:', error);
        return { success: false, data: [] };
    }
};

export const getFarmInsights = async (location, crops) => {
    try {
        const cropsParam = Array.isArray(crops) ? crops.join(',') : crops;
        const response = await api.get('/news/insights', {
            params: { location, crops: cropsParam }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching farm insights:', error);
        return { success: false, data: [] };
    }
};

export default api;
