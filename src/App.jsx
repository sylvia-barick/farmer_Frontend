import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Index from "./pages";
import FarmerDashboard from "./components/FarmerDashboard";
import Architecture from './pages/Architecture';

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Index />} />
                {/* <Route path="/dashboard/:id" element={<FarmerDashboard/>}/> */}
                <Route path="/dashboard" element={<FarmerDashboard />} />
                <Route path="/architecture" element={<Architecture />} />
            </Routes>
        </Router>
    )
};