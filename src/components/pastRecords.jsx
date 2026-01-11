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
      <div className="mb-8">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] h-10 px-4 py-2 text-gray-900 transition-all"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="flex items-center space-x-3 mb-2">
          <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gray-900" />
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Past Reports</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl">
          View and manage your complete history of insurance claims and yield predictions.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
        </div>
      ) : (
        /* Two Column Layout */
        <div className="grid lg:grid-cols-2 gap-8">

          {/* Insurance Claim History */}
          <div>
            <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] h-full overflow-hidden flex flex-col">
              <div className="flex flex-col space-y-1.5 p-6 border-b-2 border-black bg-green-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-900 flex items-center">
                    <Shield className="h-6 w-6 mr-2 text-green-700" />
                    Insurance Claim History
                  </h2>
                  <span className="text-xs font-bold bg-white border-2 border-black px-3 py-1 rounded-full text-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {insuranceHistory.length} Records
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                {insuranceHistory.length > 0 ? (
                  insuranceHistory.map((claim) => (
                    <div
                      key={claim._id}
                      className="bg-white rounded-xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all group relative"
                    >
                      <button
                        onClick={() => handleDeleteInsurance(claim._id)}
                        className="absolute top-3 right-3 p-1.5 text-black hover:text-red-600 hover:bg-red-50 rounded-md border-2 border-transparent hover:border-black transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="flex justify-between items-start mb-4 pr-8">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{claim.provider}</h3>
                          <p className="text-xs text-gray-600 font-bold font-mono mt-1">Policy: {claim.policyNumber || 'N/A'}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-lg border-2 border-black ${claim.status?.toLowerCase() === 'approved' || claim.status?.toLowerCase() === 'success' ? 'bg-green-100' :
                          claim.status?.toLowerCase() === 'rejected' || claim.status?.toLowerCase() === 'failed' ? 'bg-red-100' :
                            'bg-yellow-100'
                          }`}>
                          {getStatusIcon(claim.status)}
                          {claim.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mt-3 pt-3 border-t-2 border-black/10">
                        <div>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Damage Confidence</span>
                          <span className="font-black text-gray-900">{claim.damageConfidence ? `${claim.damageConfidence}%` : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Authenticity Score</span>
                          <span className="font-black text-gray-900">{claim.authenticityScore ? `${claim.authenticityScore}%` : 'N/A'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Submission Date</span>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1.5 text-gray-700" />
                            <span className="font-bold text-gray-900">
                              {new Date(claim.submissionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-black">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="font-bold text-gray-900">No insurance claims found</p>
                    <p className="text-xs font-medium text-gray-500 mt-1">Your submitted claims will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Yield Prediction History */}
          <div>
            <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] h-full overflow-hidden flex flex-col">
              <div className="flex flex-col space-y-1.5 p-6 border-b-2 border-black bg-yellow-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-900 flex items-center">
                    <TrendingUp className="h-6 w-6 mr-2 text-yellow-700" />
                    Yield Prediction History
                  </h2>
                  <span className="text-xs font-bold bg-white border-2 border-black px-3 py-1 rounded-full text-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {yieldClaimHistory.length} Records
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                {yieldClaimHistory.length > 0 ? (
                  yieldClaimHistory.map((prediction) => (
                    <div
                      key={prediction._id}
                      className="bg-white rounded-xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all group relative"
                    >
                      <button
                        onClick={() => handleDeleteYield(prediction._id)}
                        className="absolute top-3 right-3 p-1.5 text-black hover:text-red-600 hover:bg-red-50 rounded-md border-2 border-transparent hover:border-black transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="flex justify-between items-start mb-4 pr-8">
                        <div>
                          <h3 className="font-black text-gray-900 text-xl capitalize">{prediction.cropName || 'Unknown Crop'}</h3>
                          <p className="text-xs text-gray-600 font-bold font-mono mt-1">ID: {prediction._id.slice(-6).toUpperCase()}</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-lg border-2 border-black bg-yellow-100">
                          {getStatusIcon(prediction.status || 'Predicted')}
                          {prediction.status || 'Predicted'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm bg-gray-50 p-3 rounded-lg border-2 border-black/10">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-bold text-xs">Land Size</span>
                          <span className="font-black text-gray-900">{prediction.acresOfLand || 0} acres</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-bold text-xs">Predicted Yield</span>
                          <span className="font-black text-gray-900">{prediction.predictedYieldKgPerAcre ? prediction.predictedYieldKgPerAcre.toFixed(1) : 0} kg/acre</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-bold text-xs">Yield Category</span>
                          <span className="font-black text-gray-900">{prediction.yieldCategory}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-bold text-xs">Climate Score</span>
                          <span className={`font-black ${prediction.climateScore > 75 ? 'text-green-700' : 'text-amber-700'}`}>
                            {prediction.climateScore || '-'}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t-2 border-black/10 flex items-center justify-between text-xs text-gray-600 font-medium">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1.5" />
                          {new Date(prediction.createdAt || prediction.predictionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className="bg-gray-200 px-2 py-0.5 rounded border border-gray-400 text-[10px] uppercase font-bold text-gray-800">Soil: {prediction.soilType || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-black">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="font-bold text-gray-900">No yield predictions found</p>
                    <p className="text-xs font-medium text-gray-500 mt-1">Make a prediction to see it here</p>
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
