import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, TrendingUp, CreditCard, Calendar, CheckCircle, Clock, AlertCircle, Trash2, Shield } from "lucide-react";
import { auth } from '../utils/firebaseConfig';

const PastReports = ({ user, onBack }) => {

  const [insuranceHistory, setInsuranceHistory] = useState([]);
  const [yieldClaimHistory, setYieldClaimHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    try {
      // Fetch Yield History
      const yieldRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/crop/getAllCrops/${auth.currentUser.uid}`);
      const yieldData = await yieldRes.json();
      if (yieldData.success) {
        setYieldClaimHistory(yieldData.cropRecord || []);
      }

      // Fetch Insurance History
      const insRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/insurance/user/${auth.currentUser.uid}`);
      const insData = await insRes.json();
      if (insData.success) {
        setInsuranceHistory(insData.claims || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteYield = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/crop/delete/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setYieldClaimHistory(prev => prev.filter(item => item._id !== id));
      }
    } catch (error) {
      console.error("Failed to delete yield record", error);
    }
  };

  const handleDeleteInsurance = async (id) => {
    if (!window.confirm("Are you sure you want to delete this claim?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/insurance/delete/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInsuranceHistory(prev => prev.filter(item => item._id !== id));
      }
    } catch (error) {
      console.error("Failed to delete insurance claim", error);
    }
  };


  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'success':
        return 'bg-agricultural-crop-green/10 text-agricultural-crop-green border-agricultural-crop-green';
      case 'under review':
      case 'predicted':
        return 'bg-agricultural-harvest-gold/10 text-agricultural-harvest-gold border-agricultural-harvest-gold';
      case 'rejected':
      case 'failed':
        return 'bg-agricultural-drought-orange/10 text-agricultural-drought-orange border-agricultural-drought-orange';
      default:
        return 'bg-agricultural-stone-gray/10 text-agricultural-stone-gray border-agricultural-stone-gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'under review':
      case 'predicted':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-agricultural-soft-sand p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={onBack}
          className="mb-4 text-agricultural-soil-brown hover:bg-agricultural-stone-gray/10 px-3 py-2 rounded-md inline-flex items-center text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="flex items-center space-x-3 mb-2">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-agricultural-forest-green" />
          <h1 className="text-2xl sm:text-3xl font-bold text-agricultural-soil-brown">Past Reports</h1>
        </div>
        <p className="text-sm sm:text-base text-agricultural-stone-gray">
          View and manage your complete history of insurance claims and yield predictions.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agricultural-forest-green"></div>
        </div>
      ) : (
        /* Two Column Layout */
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">

          {/* Insurance Claim History */}
          <div>
            <div className="bg-white rounded-lg shadow-md border border-agricultural-stone-gray/20 p-4 sm:p-6 warm-shadow h-full">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-agricultural-soil-brown flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-agricultural-forest-green" />
                  Insurance Claim History
                </h2>
                <span className="text-xs font-medium bg-agricultural-soft-sand px-2 py-1 rounded-full text-agricultural-stone-gray">
                  {insuranceHistory.length} Records
                </span>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {insuranceHistory.length > 0 ? (
                  insuranceHistory.map((claim) => (
                    <div
                      key={claim._id}
                      className="bg-gray-50 rounded-lg p-4 border border-agricultural-stone-gray/10 hover:shadow-md transition-all group relative"
                    >
                      <button
                        onClick={() => handleDeleteInsurance(claim._id)}
                        className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="flex justify-between items-start mb-3 pr-8">
                        <div>
                          <h3 className="font-semibold text-agricultural-soil-brown text-base">{claim.provider}</h3>
                          <p className="text-xs text-agricultural-stone-gray font-mono mt-0.5">Policy: {claim.policyNumber || 'N/A'}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(claim.status)}`}>
                          {getStatusIcon(claim.status)}
                          {claim.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mt-3 pt-3 border-t border-gray-200">
                        <div>
                          <span className="text-xs text-agricultural-stone-gray block">Damage Confidence</span>
                          <span className="font-medium text-agricultural-soil-brown">{claim.damageConfidence ? `${claim.damageConfidence}%` : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-agricultural-stone-gray block">Authenticity Score</span>
                          <span className="font-medium text-agricultural-soil-brown">{claim.authenticityScore ? `${claim.authenticityScore}%` : 'N/A'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-agricultural-stone-gray block">Submission Date</span>
                          <div className="flex items-center mt-0.5">
                            <Calendar className="h-3 w-3 mr-1.5 text-agricultural-stone-gray" />
                            <span className="font-medium text-agricultural-soil-brown">
                              {new Date(claim.submissionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))) : (
                  <div className="text-center py-12 text-agricultural-stone-gray bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <CreditCard className="h-10 w-10 mx-auto mb-3 text-agricultural-stone-gray/40" />
                    <p className="font-medium">No insurance claims found</p>
                    <p className="text-xs mt-1">Your submitted claims will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Yield Prediction History */}
          <div>
            <div className="bg-white rounded-lg shadow-md border border-agricultural-stone-gray/20 p-4 sm:p-6 warm-shadow h-full">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-agricultural-soil-brown flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-agricultural-forest-green" />
                  Yield Prediction History
                </h2>
                <span className="text-xs font-medium bg-agricultural-soft-sand px-2 py-1 rounded-full text-agricultural-stone-gray">
                  {yieldClaimHistory.length} Records
                </span>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {yieldClaimHistory.length > 0 ? (
                  yieldClaimHistory.map((prediction) => (
                    <div
                      key={prediction._id}
                      className="bg-gray-50 rounded-lg p-4 border border-agricultural-stone-gray/10 hover:shadow-md transition-all group relative"
                    >
                      <button
                        onClick={() => handleDeleteYield(prediction._id)}
                        className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="flex justify-between items-start mb-3 pr-8">
                        <div>
                          <h3 className="font-semibold text-agricultural-soil-brown text-lg capitalize">{prediction.cropName || 'Unknown Crop'}</h3>
                          <p className="text-xs text-agricultural-stone-gray font-mono mt-0.5">ID: {prediction._id.slice(-6).toUpperCase()}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(prediction.status || 'Predicted')}`}>
                          {getStatusIcon(prediction.status || 'Predicted')}
                          {prediction.status || 'Predicted'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm bg-white p-3 rounded-md border border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-agricultural-stone-gray text-xs">Land Size</span>
                          <span className="font-medium text-agricultural-soil-brown">{prediction.acresOfLand || 0} acres</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-agricultural-stone-gray text-xs">Predicted Yield</span>
                          <span className="font-medium text-agricultural-soil-brown">{prediction.predictedYieldKgPerAcre ? prediction.predictedYieldKgPerAcre.toFixed(1) : 0} kg/acre</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-agricultural-stone-gray text-xs">Yield Category</span>
                          <span className="font-medium text-agricultural-soil-brown">{prediction.yieldCategory}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-agricultural-stone-gray text-xs">Climate Score</span>
                          <span className={`font-medium ${prediction.climateScore > 75 ? 'text-green-600' : 'text-amber-600'}`}>
                            {prediction.climateScore || '-'}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-agricultural-stone-gray/10 flex items-center justify-between text-xs text-agricultural-stone-gray">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1.5" />
                          {new Date(prediction.createdAt || prediction.predictionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div className='flex items-center gap-2'>
                          <span>Soil: {prediction.soilType || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-agricultural-stone-gray bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <TrendingUp className="h-10 w-10 mx-auto mb-3 text-agricultural-stone-gray/40" />
                    <p className="font-medium">No yield predictions found</p>
                    <p className="text-xs mt-1">Make a prediction to see it here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PastReports;
