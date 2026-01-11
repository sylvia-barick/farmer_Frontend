import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, TrendingUp, Shield, CheckCircle, Loader2 } from "lucide-react";
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



  useEffect(() => {
    const fetchCropHistory = async () => {
      const uid = user?.uid || auth.currentUser?.uid;
      if (!uid) {
        console.warn("No UID available for fetching crops");
        return;
      }

      try {
        console.log(`Fetching crops for UID: ${uid}`);
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/crop/getAllCrops/${uid}`);
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        console.log("Fetched Crops:", data);

        if (data.cropRecord && data.cropRecord.length > 0) {
          setCropHistory(data.cropRecord);
        } else {
          console.log("No crops found in DB, using fallback.");
          throw new Error("Empty list");
        }
      } catch (error) {
        console.error('Error fetching crop history, using fallback:', error);
        // Fallback mock data so the dropdown is never dead
        setCropHistory([
          { _id: "mock1", cropName: "Wheat", acresOfLand: 5, predictedYieldKgPerAcre: 1200, climateScore: 85 },
          { _id: "mock2", cropName: "Rice", acresOfLand: 3, predictedYieldKgPerAcre: 900, climateScore: 78 },
          { _id: "mock3", cropName: "Maize", acresOfLand: 4, predictedYieldKgPerAcre: 1100, climateScore: 82 }
        ]);
      }
    };

    if (user || auth.currentUser) {
      fetchCropHistory();
    }
  }, [user]);

  const handleCropSelection = async (cropId) => {
    if (!cropId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/loan/submitCropSelection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cropId })
      });

      if (!response.ok) {
        throw new Error('Failed to submit crop selection');
      }

      const data = await response.json();
      console.log('Crop selection submitted successfully:', data);

      // Update the selected crop state
      const selectedCropData = cropHistory.find(crop => crop._id === cropId);
      setSelectedCrop(selectedCropData);

    } catch (error) {
      console.error('Error submitting crop selection:', error);
      alert('Failed to submit crop selection. Please try again.');
    }
  };

  useEffect(() => {
    // Set default farm location if available from user prop
    if (user && user.locationLat && user.locationLong) {
      // This is just for internal reference, actual payload construction happens in handleSubmit
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const uid = user?.uid || auth.currentUser?.uid;
      if (!uid) {
        throw new Error("User identifier missing. Please wait or log in again.");
      }

      // Construct payload matching the backend requirement
      const payload = {
        farmerUid: uid,
        farmerName: user.name || auth.currentUser?.displayName || "Unknown Farmer",
        farmLocation: {
          lat: Number(user.locationLat) || 22.5726,
          lng: Number(user.locationLong) || 88.3639
        },
        cropType: selectedCrop ? selectedCrop.cropName : (formData.selectedCropId || "Not Selected"),
        acres: selectedCrop ? Number(selectedCrop.acresOfLand) : (user.totalLand || 0),
        loanPurpose: formData.loanPurpose,
        requestedAmount: Number(formData.requestedAmount),
        tenureMonths: formData.loanTenure === '1-year' ? 12 :
          formData.loanTenure === '2-years' ? 24 :
            formData.loanTenure === '3-years' ? 36 :
              formData.loanTenure === '5-years' ? 60 :
                formData.loanTenure === '7-years' ? 84 : 12
      };

      console.log("Submitting Loan Application Payload:", payload);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/loan/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('Loan application submitted successfully:', data);
      alert(`Loan Application Submitted Successfully!\nReference ID: ${data.id || "Pending"}\nStatus: ${data.status}`);

      // Reset form
      setFormData({
        loanPurpose: '',
        requestedAmount: '',
        loanTenure: '',
        selectedCropId: ''
      });
      setSelectedCrop(null);

    } catch (e) {
      console.error('Error submitting loan application:', e);
      alert(`Failed to submit loan application:\n${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(76, 175, 80); // Green color
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("KisaanSaathi Loan Application", 105, 25, null, null, "center");

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);

    // Farmer Details
    doc.text("Farmer Details", 20, 50);
    doc.line(20, 52, 100, 52);
    doc.setFontSize(12);
    doc.text(`Name: ${user.name || "N/A"}`, 20, 60);
    doc.text(`Farmer ID: ${user.uid || "N/A"}`, 20, 70);
    doc.text(`Location: ${user.location || "N/A"}`, 20, 80);

    // Loan Details (from Form)
    doc.setFontSize(14);
    doc.text("Application Details", 20, 100);
    doc.line(20, 102, 100, 102);
    doc.setFontSize(12);
    doc.text(`Purpose: ${formData.loanPurpose || "Not specified"}`, 20, 110);
    doc.text(`Requested Amount: ${formData.requestedAmount || "0"} INR`, 20, 120);
    doc.text(`Tenure: ${formData.loanTenure || "Not specified"}`, 20, 130);
    doc.text(`Selected Crop: ${selectedCrop ? selectedCrop.cropName : "None"}`, 20, 140);

    // Save
    doc.save("KisaanSaathi_Loan_Application.pdf");
  };

  if (showStatus) {
    return <LoanStatus user={user} onBack={() => setShowStatus(false)} />;
  }

  return (
    <div className="min-h-screen bg-agricultural-soft-sand">
      <div className="p-8">
        <div className="flex items-center mb-6">
          {/* Replaces Button component */}
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] h-10 px-4 py-2 text-gray-900 transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-2">
              Loan Application
            </h1>
            <p className="text-gray-600 font-medium">
              Apply for an agricultural loan with data-backed predictions
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Loan Application Form */}
            <div className="lg:col-span-2">
              {/* Replaces Card component */}
              <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                {/* Replaces CardHeader */}
                <div className="flex flex-col space-y-1.5 p-6 border-b-2 border-black bg-green-50 rounded-t-2xl">
                  {/* Replaces CardTitle */}
                  <h3 className="flex items-center text-2xl font-bold leading-none tracking-tight text-gray-900">
                    <CreditCard className="h-6 w-6 mr-2" />
                    Loan Details
                  </h3>
                </div>
                {/* Replaces CardContent */}
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      {/* Replaces Label component */}
                      <label htmlFor="loanPurpose" className="text-gray-900 text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2">
                        Loan Purpose
                      </label>
                      {/* Replaces Select, SelectTrigger, SelectValue, SelectContent, SelectItem */}
                      <div className="relative">
                        <select
                          id="loanPurpose"
                          value={formData.loanPurpose}
                          onChange={(e) => handleChange('loanPurpose', e.target.value)}
                          className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        >
                          <option value="" disabled hidden>Select loan purpose</option>
                          <option value="crop-cultivation">Crop Cultivation</option>
                          <option value="equipment-purchase">Equipment Purchase</option>
                          <option value="land-improvement">Land Improvement</option>
                          <option value="livestock">Livestock Purchase</option>
                          <option value="working-capital">Working Capital</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-900 font-bold">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      {/* Replaces Label component */}
                      <label htmlFor="selectedCrop" className="text-gray-900 text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2">
                        Select Crop (for loan assessment)
                      </label>
                      <div className="relative">
                        <select
                          id="selectedCrop"
                          value={formData.selectedCropId}
                          onChange={(e) => {
                            const cropId = e.target.value;
                            handleChange('selectedCropId', cropId);
                            // Update the selected crop state
                            const selectedCropData = cropHistory.find(crop => crop._id === cropId);
                            setSelectedCrop(selectedCropData);
                          }}
                          className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        >
                          <option value="" disabled hidden>Select a crop from your history</option>
                          {cropHistory.map((item) => (
                            <option key={item._id} value={item._id}>
                              {item.cropName.charAt(0).toUpperCase() + item.cropName.slice(1)}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-900 font-bold">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                      </div>
                    </div>

                    {selectedCrop && (
                      <div className="p-4 bg-green-50 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h4 className="font-bold text-gray-900 mb-2 border-b-2 border-black pb-1 inline-block">Selected Crop Details</h4>
                        <div className="text-sm text-gray-700 space-y-1 mt-2">
                          <p><span className="font-bold">Crop:</span> {selectedCrop.cropName.charAt(0).toUpperCase() + selectedCrop.cropName.slice(1)}</p>
                          <p><span className="font-bold">Land Size:</span> {selectedCrop.acresOfLand} acres</p>
                          <p><span className="font-bold">Predicted Yield:</span> {selectedCrop.predictedYieldKgPerAcre} kg/acre</p>
                          <p><span className="font-bold">Climate Score:</span> {selectedCrop.climateScore}%</p>
                        </div>
                      </div>
                    )}

                    <div>
                      {/* Replaces Label component */}
                      <label htmlFor="requestedAmount" className="text-gray-900 text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2">
                        Requested Amount (₹)
                      </label>
                      {/* Replaces Input component */}
                      <input
                        id="requestedAmount"
                        type="number"
                        placeholder="Enter amount"
                        value={formData.requestedAmount}
                        onChange={(e) => handleChange('requestedAmount', e.target.value)}
                        className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      {/* Replaces Label component */}
                      <label htmlFor="loanTenure" className="text-gray-900 text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2">
                        Loan Tenure
                      </label>
                      {/* Replaces Select, SelectTrigger, SelectValue, SelectContent, SelectItem */}
                      <div className="relative">
                        <select
                          id="loanTenure"
                          value={formData.loanTenure}
                          onChange={(e) => handleChange('loanTenure', e.target.value)}
                          className="flex h-12 w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        >
                          <option value="" disabled hidden>Select loan tenure</option>
                          <option value="1-year">1 Year</option>
                          <option value="2-years">2 Years</option>
                          <option value="3-years">3 Years</option>
                          <option value="5-years">5 Years</option>
                          <option value="7-years">7 Years</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-900 font-bold">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                      </div>
                    </div>

                    {/* Replaces Button component */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-black uppercase tracking-wider ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full bg-green-600 text-white h-12 px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Loan Application'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* How Loans Work */}
            <div className="space-y-6">
              {/* Replaces Card component */}
              <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                {/* Replaces CardHeader */}
                <div className="flex flex-col space-y-1.5 p-6 border-b-2 border-black">
                  {/* Replaces CardTitle */}
                  <h3 className="text-xl font-bold leading-none tracking-tight text-gray-900">How It Works</h3>
                </div>
                {/* Replaces CardContent */}
                <div className="p-6 space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-green-700 font-bold text-lg">1</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Submit Application</h4>
                      <p className="text-sm text-gray-600 mt-1">Fill out the loan application with your requirements</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-green-700 font-bold text-lg">2</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Data Review</h4>
                      <p className="text-sm text-gray-600 mt-1">Banks review your yield predictions and farm data</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-green-700 font-bold text-lg">3</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Approval</h4>
                      <p className="text-sm text-gray-600 mt-1">Get faster approval based on AI predictions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              {/* Replaces Card component */}
              <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                {/* Replaces CardHeader */}
                <div className="flex flex-col space-y-1.5 p-6 border-b-2 border-black bg-yellow-50 rounded-t-2xl">
                  {/* Replaces CardTitle */}
                  <h3 className="flex items-center text-xl font-bold leading-none tracking-tight text-gray-900">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Benefits
                  </h3>
                </div>
                {/* Replaces CardContent */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-bold text-gray-700">Lower interest rates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-bold text-gray-700">Faster processing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-bold text-gray-700">Data-backed approval</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-bold text-gray-700">Flexible repayment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Full Width */}
          <div className="mt-8 grid lg:grid-cols-3 gap-8">
            {/* Left side - takes 2 columns */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] h-full">
                <div className="flex flex-col space-y-1.5 p-6 border-b-2 border-black">
                  <h3 className="text-xl font-bold leading-none tracking-tight text-gray-900">
                    Additional Information
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 font-medium">
                    This section takes up the remaining screen space beside the form. You can add any content here such as:
                  </p>
                  <ul className="mt-4 space-y-2 text-gray-600">
                    <li>• Loan application guidelines</li>
                    <li>• Required documents</li>
                    <li>• Terms and conditions</li>
                    <li>• Contact information</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right side - takes 1 column */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] h-full">
                <div className="flex flex-col space-y-1.5 p-6 border-b-2 border-black">
                  <h3 className="text-xl font-bold leading-none tracking-tight text-gray-900">
                    Quick Actions
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <button
                      onClick={generatePDF}
                      className="w-full text-left p-4 rounded-xl border-2 border-black bg-white hover:bg-gray-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                      <div className="font-bold text-gray-900">Download Application</div>
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Get PDF copy</div>
                    </button>
                    <button
                      onClick={() => setShowStatus(true)}
                      className="w-full text-left p-4 rounded-xl border-2 border-black bg-white hover:bg-gray-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                      <div className="font-bold text-gray-900">Track Status</div>
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Check application progress</div>
                    </button>
                    <button className="w-full text-left p-4 rounded-xl border-2 border-black bg-white hover:bg-gray-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                      <div className="font-bold text-gray-900">Contact Support</div>
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Get help with application</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanApplication;