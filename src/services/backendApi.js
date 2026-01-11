import axios from 'axios';

const API_URL = import.meta.env.VITE_MAIN_BACKEND_URL || 'http://localhost:5000/api';

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

export const askAI = async (prompt) => {
    try {
        const response = await api.post('/ai/analyze', { type: 'chat', prompt });
        return response.data.analysis;
    } catch (error) {
        console.error('Error fetching AI analysis:', error);
        return "I apologize, but I'm unable to analyze that right now. Please try again later.";
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
            type: 'insurance',
            data: { policyDetails: text, task: 'summary' }
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

export default api;
