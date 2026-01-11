import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, TrendingUp, CheckCircle, Loader2, AlertCircle, DollarSign } from "lucide-react";
import { auth } from '../utils/firebaseConfig';
import { jsPDF } from 'jspdf';
import LoanStatus from './LoanStatus';

const LoanApplication = ({ user, onBack }) => {
  const [showStatus, setShowStatus] = useState(false);
  const [formData, setFormData] = useState({
    loanPurpose: '',
    requestedAmount: '',
    loanTenure: '',
    selectedCropId: ''
  });

  const [cropHistory, setCropHistory] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Removed blockchain/wallet connection logic

  // Fetch crops
  useEffect(() => {
    const fetchCropHistory = async () => {
      const uid = user?.uid || auth.currentUser?.uid;
      if (!uid) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/crop/getAllCrops/${uid}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        if (data.cropRecord && data.cropRecord.length > 0) {
          setCropHistory(data.cropRecord);
        } else {
          setCropHistory([
            { _id: "mock1", cropName: "Wheat", acresOfLand: 5, predictedYieldKgPerAcre: 1200, climateScore: 85 },
            { _id: "mock2", cropName: "Rice", acresOfLand: 3, predictedYieldKgPerAcre: 900, climateScore: 78 }
          ]);
        }
      } catch (error) {
        setCropHistory([
          { _id: "mock1", cropName: "Wheat", acresOfLand: 5, predictedYieldKgPerAcre: 1200, climateScore: 85 }
        ]);
      }
    };
    fetchCropHistory();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const uid = user?.uid || auth.currentUser?.uid;
      if (!uid) throw new Error("User not logged in");

      // Submit loan application to backend
      const payload = {
        farmerUid: uid,
        farmerName: user?.name || "Farmer",
        cropType: selectedCrop?.cropName || "General",
        acres: selectedCrop?.acresOfLand || 5,
        loanPurpose: formData.loanPurpose,
        requestedAmount: Number(formData.requestedAmount),
        tenureMonths: formData.loanTenure === '1-year' ? 12 :
          formData.loanTenure === '2-years' ? 24 :
            formData.loanTenure === '3-years' ? 36 : 60
      };

      console.log('Submitting loan to backend:', payload);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/loan/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Backend response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit loan');
      }

      if (data.success) {
        alert(`✅ Loan Application Submitted!\n\nID: ${data.id}\nStatus: ${data.status}\nFraud Score: ${data.fraudScore}`);
      } else {
        alert('Loan submitted but status unclear. Please check loan status page.');
      }

      setFormData({ loanPurpose: '', requestedAmount: '', loanTenure: '', selectedCropId: '' });
      setSelectedCrop(null);

    } catch (err) {
      console.error('Loan submission error:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(76, 175, 80);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("KisaanSathi Loan Application", 105, 25, null, null, "center");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Farmer: ${user.name || "N/A"}`, 20, 60);
    doc.text(`Amount: ₹${formData.requestedAmount}`, 20, 70);
    doc.text(`Purpose: ${formData.loanPurpose}`, 20, 80);
    doc.save("KisaanSathi_Loan.pdf");
  };

  if (showStatus) {
    return <LoanStatus user={user} onBack={() => setShowStatus(false)} />;
  }

  return (
    <div className="min-h-screen bg-agricultural-soft-sand">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="inline-flex items-center px-4 py-2 rounded-lg border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-bold transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Loan Application</h1>
          <p className="text-gray-600 mb-6 flex items-center gap-2">
            Apply for agricultural loans
          </p>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="p-6 border-b-2 border-black bg-green-50 rounded-t-2xl">
                  <h3 className="flex items-center text-2xl font-bold">
                    <CreditCard className="h-6 w-6 mr-2" />
                    Loan Details
                  </h3>
                </div>
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="text-sm font-bold block mb-2">Loan Purpose *</label>
                      <select value={formData.loanPurpose} onChange={(e) => handleChange('loanPurpose', e.target.value)} required className="w-full h-12 rounded-xl border-2 border-black px-3 font-medium">
                        <option value="">Select purpose</option>
                        <option value="crop-cultivation">Crop Cultivation</option>
                        <option value="equipment-purchase">Equipment Purchase</option>
                        <option value="land-improvement">Land Improvement</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-bold block mb-2">Select Crop</label>
                      <select value={formData.selectedCropId} onChange={(e) => { handleChange('selectedCropId', e.target.value); setSelectedCrop(cropHistory.find(c => c._id === e.target.value)); }} className="w-full h-12 rounded-xl border-2 border-black px-3 font-medium">
                        <option value="">Select crop</option>
                        {cropHistory.map((c) => <option key={c._id} value={c._id}>{c.cropName}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-bold block mb-2">Amount (₹) *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-6 w-6 text-gray-500" />
                        <input type="number" placeholder="Enter amount" value={formData.requestedAmount} onChange={(e) => handleChange('requestedAmount', e.target.value)} required min="1000" className="w-full h-12 rounded-xl border-2 border-black pl-11 pr-3 font-medium" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold block mb-2">Tenure *</label>
                      <select value={formData.loanTenure} onChange={(e) => handleChange('loanTenure', e.target.value)} required className="w-full h-12 rounded-xl border-2 border-black px-3 font-medium">
                        <option value="">Select tenure</option>
                        <option value="1-year">1 Year</option>
                        <option value="2-years">2 Years</option>
                        <option value="3-years">3 Years</option>
                      </select>
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl border-2 border-black bg-green-600 text-white font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50">
                      {isLoading ? <><Loader2 className="inline h-4 w-4 mr-2 animate-spin" />Processing...</> : 'Submit Application'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border-2 border-black bg-gradient-to-br from-green-50 to-blue-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                <h3 className="font-bold mb-4">Application Benefits</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Fast Processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>AI-Powered Assessment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Transparent Process</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                <h3 className="font-bold mb-4"><TrendingUp className="inline w-5 h-5 mr-2" />Requirements</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /><span>Valid land records</span></div>
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /><span>Crop history</span></div>
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /><span>Identity proof</span></div>
                </div>
              </div>

              <button onClick={() => setShowStatus(true)} className="w-full p-4 rounded-xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-bold transition-all">
                Track Status →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanApplication;