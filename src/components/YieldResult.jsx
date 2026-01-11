import { Download, ArrowLeft, CheckCircle, TrendingUp, DollarSign, Shield, Award } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// import { toast } from "@/hooks/use-toast";

const YieldResults = ({ results, user, onBackToDashboard }) => {

  const marketPriceCalculator = (cropName, predictedYieldKgPerAcre) => {
    return cropPricesPerKgHowrah[cropName.toLowerCase()] * predictedYieldKgPerAcre * results.acresOfLand;
  }
  const cropPricesPerKgHowrah = {
    rice: 42.0, // Average price in Howrah as of April 10, 2025. West Bengal average is 40.4 INR/kg as of July 10, 2025.
    wheat: 27.3, // West Bengal average as of July 10, 2025. Durgapur market shows 26-27.35 INR/kg as of July 9-10, 2025.
    sugarcane: 4.0, // India average price, local West Bengal data not specifically for Howrah.
    maize: 16.0, // West Bengal average as of July 7, 2025. Some Kolkata listings show 19-30 INR/kg.
    corn: 19.5, // Taking an average from Kolkata-based yellow corn/maize listings (14-30 INR/kg for various types). Distinguishing from "maize" as field corn.
    cotton: 72.3, // India average for unginned cotton. Howrah specific raw cotton prices vary widely, from 67 INR/kg upwards.
    millet: 60.0 // Average from various millet types listed in Kolkata, e.g., Foxtail Millet at 60 INR/kg. Prices for specific millet types can vary significantly (e.g., Barnyard around 85 INR/kg).
  };

  console.log(cropPricesPerKgHowrah);
  // Transform API response to match component expectations
  const transformedResults = {
    crop: results.cropName || 'Unknown Crop',
    acres: results.acresOfLand || 0,
    predictedYield: results.predictedYieldKgPerAcre || 0,
    confidenceScore: Math.round(results.climateScore || 0),
    riskFactors: [
      {
        factor: 'Soil Health',
        status: results.soilHealthCategory?.toLowerCase() || 'moderate',
        score: Math.round(results.soilHealthScore * 10) || 50
      },
      {
        factor: 'Climate Conditions',
        status: results.climateScore >= 70 ? 'excellent' : results.climateScore >= 50 ? 'good' : 'moderate',
        score: Math.round(results.climateScore || 50)
      }
    ],
    recommendations: [
      `Maintain ${results.soilHealthCategory || 'good soil health'} practices`,
      `Monitor weather conditions for optimal ${results.cropName || 'crop'} growth`,
      `Consider crop rotation with suggested crops: ${results.suggestedCrops?.map(crop => crop.cropName).join(', ') || 'N/A'}`,
      `Expected harvest date: ${results.expectedHarvestDate || 'Not specified'}`
    ],
    projectedRevenue: marketPriceCalculator(results.cropName, results.predictedYieldKgPerAcre) || 25000 * results.acresOfLand, // Assuming ₹25/kg
    marketPrice: cropPricesPerKgHowrah[results.cropName.toLowerCase()] || 45.50, // ₹25,000 per ton
    riskIndex: Math.round(results.climateScore || 50),
    weatherIndex: Math.round(results.climateScore || 50),
    farmerId: results.uid || 'Unknown',
    location: results.location ? `${results.location.lat}, ${results.location.long}` : 'Location not set',
    generatedAt: new Date().toISOString()
  };

  const handleDownloadReport = async () => {
    try {
      // Show loading state
      const downloadButton = document.querySelector('[data-download-report]');
      const originalText = downloadButton.innerHTML;
      downloadButton.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Generating PDF...';
      downloadButton.disabled = true;

      // Create a temporary container for the report
      const reportContainer = document.createElement('div');
      reportContainer.style.position = 'absolute';
      reportContainer.style.left = '-9999px';
      reportContainer.style.top = '-9999px';
      reportContainer.style.width = '800px';
      reportContainer.style.backgroundColor = 'white';
      reportContainer.style.padding = '40px';
      reportContainer.style.fontFamily = 'Arial, sans-serif';
      reportContainer.style.color = '#333';

      // Generate the report HTML
      reportContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2d5a27; font-size: 28px; margin-bottom: 10px;">AgroSure</h1>
          <h2 style="color: #8b4513; font-size: 24px; margin-bottom: 5px;">Yield Prediction Report</h2>
          <p style="color: #666; font-size: 14px;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="margin-bottom: 30px; padding: 20px; border: 2px solid #2d5a27; border-radius: 8px;">
          <h3 style="color: #2d5a27; font-size: 20px; margin-bottom: 15px;">Executive Summary</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p><strong>Crop:</strong> ${transformedResults.crop}</p>
              <p><strong>Land Area:</strong> ${transformedResults.acres} acres</p>
              <p><strong>Predicted Yield:</strong> ${transformedResults.predictedYield.toFixed(1)} kg/acre</p>
              <p><strong>Total Yield:</strong> ${(transformedResults.predictedYield * transformedResults.acres).toFixed(1)} kg</p>
            </div>
            <div>
              <p><strong>Confidence Score:</strong> ${transformedResults.confidenceScore}%</p>
              <p><strong>Projected Revenue:</strong> ₹${transformedResults.projectedRevenue.toLocaleString()}</p>
              <p><strong>Location:</strong> ${transformedResults.location}</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #2d5a27; font-size: 20px; margin-bottom: 15px;">Risk Analysis</h3>
          ${transformedResults.riskFactors.map(factor => `
            <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: bold;">${factor.factor}</span>
                <span style="background: ${factor.status === 'excellent' ? '#d4edda' : factor.status === 'good' ? '#d1ecf1' : '#fff3cd'}; 
                           color: ${factor.status === 'excellent' ? '#155724' : factor.status === 'good' ? '#0c5460' : '#856404'}; 
                           padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: capitalize;">
                  ${factor.status}
                </span>
              </div>
              <div style="background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: #28a745; height: 100%; width: ${factor.score}%;"></div>
              </div>
              <p style="margin-top: 5px; font-size: 14px; color: #666;">Score: ${factor.score}/100</p>
            </div>
          `).join('')}
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #2d5a27; font-size: 20px; margin-bottom: 15px;">Financial Projection</h3>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 24px; font-weight: bold; color: #28a745; margin-bottom: 5px;">
                ₹${transformedResults.projectedRevenue.toLocaleString()}
              </div>
              <p style="color: #666; font-size: 14px;">Projected Revenue</p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
              <div><strong>Yield (tons):</strong> ${transformedResults.predictedYield.toFixed(1)}</div>
              <div><strong>Market Price/kg:</strong> ₹${transformedResults.marketPrice.toLocaleString()}</div>
              <div><strong>Risk Index:</strong> ${transformedResults.riskIndex}/100</div>
              <div><strong>Weather Index:</strong> ${transformedResults.weatherIndex}/100</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #2d5a27; font-size: 20px; margin-bottom: 15px;">Bank Assessment</h3>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border: 1px solid #ffeaa7;">
            <div style="text-align: center; margin-bottom: 15px;">
              <div style="font-size: 18px; margin-bottom: 10px;">
                ${'★'.repeat(4)}${'☆'.repeat(1)}
              </div>
              <p style="font-weight: bold; color: #856404;">Creditworthiness Rating: Excellent</p>
            </div>
            <p style="font-size: 14px; color: #666; text-align: center;">
              This yield prediction report demonstrates strong potential for loan approval based on data-backed projections.
            </p>
          </div>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #2d5a27; text-align: center; color: #666; font-size: 12px;">
          <p><strong>AgroSure</strong> - Empowering Farmers with Data-Backed Financial Support</p>
          <p>Report ID: ${Date.now()} | Valid until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
        </div>
      `;

      // Add the container to the document
      document.body.appendChild(reportContainer);

      // Convert to canvas
      const canvas = await html2canvas(reportContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove the temporary container
      document.body.removeChild(reportContainer);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // 10mm top margin

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      // Download the PDF
      const fileName = `yield-prediction-${transformedResults.crop.toLowerCase()}-${Date.now()}.pdf`;
      pdf.save(fileName);

      // Reset button state
      downloadButton.innerHTML = originalText;
      downloadButton.disabled = false;

      // Show success message
      alert('Report downloaded successfully!');

    } catch (error) {
      console.error('Error generating PDF:', error);

      // Reset button state
      const downloadButton = document.querySelector('[data-download-report]');
      downloadButton.innerHTML = '<Download className="h-4 w-4 mr-2" />Download PDF Report';
      downloadButton.disabled = false;

      alert('Error generating PDF. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-700 bg-green-100';
      case 'good': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-orange-600 bg-orange-100';
    }
  };

  const getRiskColor = (score) => {
    if (score >= 85) return 'text-green-700';
    if (score >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 bg-agricultural-soft-sand min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <button
            onClick={onBackToDashboard}
            className="mb-4 inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] h-10 px-4 py-2 text-gray-900 transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
            Yield Prediction Report
          </h1>
          <p className="text-gray-600 font-medium">
            {transformedResults.crop} • {transformedResults.acres} acres • {user?.location ? `${user.location.lat}, ${user.location.long}` : 'Location not set'}
          </p>
        </div>
        <button
          onClick={handleDownloadReport}
          data-download-report
          className="bg-green-600 text-white font-black uppercase tracking-wider h-12 px-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center text-sm w-full sm:w-auto"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF Report
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Results */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="flex flex-col space-y-1.5 p-6 border-b-2 border-black bg-green-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900">Prediction Confidence</h2>
                <span className="bg-green-600 text-white px-3 py-1 rounded-lg border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {Math.round(transformedResults.confidenceScore)}% Confidence
                </span>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="text-5xl sm:text-6xl font-black text-green-700 mb-2 drop-shadow-sm">
                  {transformedResults.predictedYield.toFixed(1)} <span className="text-2xl sm:text-3xl text-gray-600">KG</span>
                </div>
                <p className="text-gray-600 font-bold">
                  Predicted yield for {transformedResults.acres} acres of {transformedResults.crop}
                </p>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2 text-gray-900 font-bold uppercase tracking-wide">
                  <span>Climate Score</span>
                  <span>{transformedResults.confidenceScore}/100</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full border-2 border-black overflow-hidden relative">
                  <div className="h-full bg-green-500 absolute top-0 left-0 border-r-2 border-black" style={{ width: `${transformedResults.confidenceScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-6 border-b-2 border-black bg-yellow-50">
              <h2 className="text-xl font-black text-gray-900">Risk Analysis</h2>
            </div>
            <div className="p-6 space-y-6">
              {transformedResults.riskFactors.map((factor, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-900 font-bold">{factor.factor}</span>
                      <span className={`px-2 py-0.5 rounded-md border-2 border-black text-xs font-bold uppercase ${factor.status === 'excellent' ? 'bg-green-100 text-green-800' :
                          factor.status === 'good' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {factor.status}
                      </span>
                    </div>
                    <span className={`font-black ${factor.score >= 85 ? 'text-green-700' :
                        factor.score >= 70 ? 'text-yellow-600' : 'text-orange-600'
                      }`}>
                      {factor.score}/100
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full border-2 border-black overflow-hidden relative">
                    <div className={`h-full absolute top-0 left-0 border-r-2 border-black ${factor.score >= 85 ? 'bg-green-500' :
                        factor.score >= 70 ? 'bg-yellow-500' : 'bg-orange-500'
                      }`} style={{ width: `${factor.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-6 border-b-2 border-black bg-blue-50">
              <h2 className="text-xl font-black text-gray-900">Recommendations</h2>
            </div>
            <div className="p-6 space-y-4">
              {transformedResults.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 bg-gray-50 p-4 rounded-xl border-2 border-black">
                  <div className="bg-green-100 p-1 rounded-md border-2 border-black flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-700" />
                  </div>
                  <span className="text-gray-900 font-bold">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-6 border-b-2 border-black bg-white">
              <div className="flex items-center text-gray-900 font-black text-lg">
                <DollarSign className="h-5 w-5 mr-2 text-green-700" />
                Financial Projection
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6 bg-green-50 p-4 rounded-xl border-2 border-black border-dashed">
                <div className="text-3xl font-black text-green-700 mb-1">
                  ₹{transformedResults.projectedRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Projected Revenue</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <span className="text-gray-600 font-bold">Yield (tons):</span>
                  <span className="font-black text-gray-900">{transformedResults.predictedYield.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <span className="text-gray-600 font-bold">Market Price/kg:</span>
                  <span className="font-black text-gray-900">₹{transformedResults.marketPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg border-2 border-black">
                  <span className="text-green-800 font-bold">Total Revenue:</span>
                  <span className="font-black text-green-800">₹{transformedResults.projectedRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-6 border-b-2 border-black bg-white">
              <div className="flex items-center text-gray-900 font-black text-lg">
                <Shield className="h-5 w-5 mr-2 text-yellow-600" />
                Bank Assessment
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="flex justify-center space-x-1 mb-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Award
                      key={i}
                      className={`h-6 w-6 ${i < 4 ? 'text-yellow-500 fill-current drop-shadow-sm' : 'text-gray-300'
                        }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Creditworthiness Rating</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 border-b-2 border-black/10">
                  <span className="text-gray-600 font-bold">Risk Index:</span>
                  <span className={`font-black uppercase text-xs px-2 py-0.5 rounded border-2 border-black ${transformedResults.riskIndex >= 85 ? 'bg-green-100 text-green-800' :
                      transformedResults.riskIndex >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {transformedResults.riskIndex >= 85 ? 'Low' : transformedResults.riskIndex >= 70 ? 'Medium' : 'High'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 border-b-2 border-black/10">
                  <span className="text-gray-600 font-bold">Weather Index:</span>
                  <span className="font-black text-gray-900">{transformedResults.weatherIndex}/100</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-gray-600 font-bold">Success Probability:</span>
                  <span className="font-black text-green-700">{transformedResults.confidenceScore}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-black bg-white text-card-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-6 border-b-2 border-black bg-gray-50">
              <h2 className="text-lg font-black text-gray-900">Report Details</h2>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between border-b-2 border-black/5 pb-2">
                <span className="text-gray-600 font-bold">Location:</span>
                <span className="font-black text-gray-900 text-right max-w-[150px] truncate">{transformedResults.location}</span>
              </div>
              <div className="flex justify-between border-b-2 border-black/5 pb-2">
                <span className="text-gray-600 font-bold">Generated:</span>
                <span className="font-black text-gray-900">
                  {new Date(transformedResults.generatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Valid Until:</span>
                <span className="font-black text-gray-900">
                  {new Date(new Date(transformedResults.generatedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleDownloadReport}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-wider h-12 px-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Full Report
            </button>
            <button
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider h-12 px-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate New Prediction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldResults;
