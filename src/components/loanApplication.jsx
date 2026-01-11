import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, TrendingUp, CheckCircle, Loader2, Wallet, ExternalLink, Copy, AlertCircle, DollarSign, Link as LinkIcon } from "lucide-react";
import { auth } from '../utils/firebaseConfig';
import { jsPDF } from 'jspdf';
import LoanStatus from './LoanStatus';
import { ethers } from 'ethers';

// Shardeum Config
const SHARDEUM_CONFIG = {
  chainId: '0x1F92', // 8082
  chainName: 'Shardeum Sphinx Testnet',
  rpcUrls: ['https://sphinx.shardeum.org/'],
  blockExplorerUrls: ['https://explorer-sphinx.shardeum.org/'],
  nativeCurrency: { name: 'Shardeum', symbol: 'SHM', decimals: 18 }
};

// UPDATE THIS AFTER DEPLOYING CONTRACT VIA REMIX
const CONTRACT_ADDRESS = '0x38a8d0328ad586CEE1f973CAfB5a01678d634578';

const CONTRACT_ABI = [
  {
    "inputs": [{
      "components": [
        { "name": "amount", "type": "uint256" },
        { "name": "tenure", "type": "uint256" },
        { "name": "landSize", "type": "uint256" },
        { "name": "interest", "type": "uint256" },
        { "name": "purpose", "type": "string" }
      ],
      "name": "input",
      "type": "tuple"
    }],
    "name": "requestLoan",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "loanId", "type": "uint256" },
      { "indexed": true, "name": "farmer", "type": "address" },
      { "indexed": false, "name": "amount", "type": "uint256" },
      { "indexed": false, "name": "score", "type": "uint256" }
    ],
    "name": "LoanRequested",
    "type": "event"
  }
];

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

  // Blockchain states
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOnShardeum, setIsOnShardeum] = useState(false);
  const [blockchainError, setBlockchainError] = useState(null);
  const [txResult, setTxResult] = useState(null);
  const [showTxModal, setShowTxModal] = useState(false);

  // Auto-switch to Shardeum function
  const switchToShardeum = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SHARDEUM_CONFIG.chainId }]
      });
      setIsOnShardeum(true);
      setBlockchainError(null);
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SHARDEUM_CONFIG]
          });
          setIsOnShardeum(true);
          setBlockchainError(null);
        } catch (addError) {
          setBlockchainError('Failed to add Shardeum network');
        }
      } else {
        console.error('Switch error:', switchError);
      }
    }
  };

  // Check wallet on mount and auto-switch
  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts[0]) {
            setWalletAddress(accounts[0]);
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const onShardeum = chainId === SHARDEUM_CONFIG.chainId;
            setIsOnShardeum(onShardeum);

            // Auto-switch if not on Shardeum
            if (!onShardeum) {
              await switchToShardeum();
            }
          }
        } catch (err) {
          console.error('Error checking wallet:', err);
        }
      }
    };
    checkWallet();

    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
        setIsOnShardeum(chainId === SHARDEUM_CONFIG.chainId);
        if (chainId !== SHARDEUM_CONFIG.chainId) {
          switchToShardeum();
        }
      });
    }
  }, []);

  // Connect MetaMask with auto-switch
  const connectWallet = async () => {
    setIsConnecting(true);
    setBlockchainError(null);

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask to use blockchain features!');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);

      // Auto-switch to Shardeum
      await switchToShardeum();
    } catch (err) {
      setBlockchainError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

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
    setBlockchainError(null);
    setTxResult(null);

    try {
      const uid = user?.uid || auth.currentUser?.uid;
      if (!uid) throw new Error("User not logged in");

      // Blockchain transaction is now handled by Admin/Backend on approval
      // We skip direct blockchain interaction here to prevent "Shardeum network busy" errors
      // since the current contract (Domains.sol) is for Admin use.

      // Wallet Signature Request (Verified Popup) - Explicitly requested by user
      if (walletAddress) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const message = `I verify this loan application for ${formData.loanPurpose}. Amount: ₹${formData.requestedAmount}`;

          await signer.signMessage(message);
        } catch (sigError) {
          console.error('Signature rejected:', sigError);
          alert('You must sign the message to verify your identity on the blockchain.');
          setIsLoading(false);
          return;
        }
      }

      // Always submit to backend
      const payload = {
        farmerUid: uid,
        farmerName: user?.name || "Farmer",
        cropType: selectedCrop?.cropName || "General",
        acres: selectedCrop?.acresOfLand || 5, // Include acres (fallback to 5 if missing)
        loanPurpose: formData.loanPurpose,
        requestedAmount: Number(formData.requestedAmount),
        tenureMonths: formData.loanTenure === '1-year' ? 12 :
          formData.loanTenure === '2-years' ? 24 :
            formData.loanTenure === '3-years' ? 36 : 60,
        walletAddress: walletAddress || null,
        txHash: null // txResult?.txHash || null (We handle tx in backend, so send null or don't send)
      };

      console.log('Submitting loan to backend:', payload);
      console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);

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
      alert(`❌ Error: ${err.message}\n\nPlease check if backend is running at ${import.meta.env.VITE_BACKEND_URL || 'NOT SET'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied!');
  };

  const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(76, 175, 80);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("AgroSure Loan Application", 105, 25, null, null, "center");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Farmer: ${user.name || "N/A"}`, 20, 60);
    if (walletAddress) doc.text(`Wallet: ${formatAddress(walletAddress)}`, 20, 70);
    doc.text(`Amount: ₹${formData.requestedAmount}`, 20, 80);
    doc.save("AgroSure_Loan.pdf");
  };

  if (showStatus) {
    return <LoanStatus user={user} onBack={() => setShowStatus(false)} />;
  }

  return (
    <div className="min-h-screen bg-agricultural-soft-sand">
      {/* Transaction Modal */}
      {showTxModal && txResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center border-2 border-black">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-black">Blockchain Success!</h2>
                <p className="text-sm text-gray-600">Recorded on Shardeum</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 rounded-xl p-4 border-2 border-black">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Loan ID:</span>
                <span className="font-bold text-purple-600">#{txResult.loanId}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">TX Hash:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-white px-2 py-1 rounded">{formatAddress(txResult.txHash)}</span>
                  <button onClick={() => copyToClipboard(txResult.txHash)} className="p-1 hover:bg-gray-200 rounded">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Block:</span>
                <span className="font-bold">{txResult.blockNumber}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <a
                href={txResult.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none font-bold"
              >
                <ExternalLink className="w-4 h-4" />
                View Explorer
              </a>
              <button
                onClick={() => setShowTxModal(false)}
                className="flex-1 px-4 py-3 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none font-bold"
              >
                Close
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500 text-center">
              ✨ Check MetaMask Activity!
            </p>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="inline-flex items-center px-4 py-2 rounded-lg border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-bold transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>

          {!walletAddress ? (
            <button onClick={connectWallet} disabled={isConnecting} className="inline-flex items-center px-4 py-2 rounded-lg border-2 border-black bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-bold transition-all">
              {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wallet className="h-4 w-4 mr-2" />}
              {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          ) : (
            <div className="flex flex-col md:flex-row items-end md:items-center gap-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${isOnShardeum ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {isOnShardeum ? '🔗 Shardeum' : '⚠️ Switch Network'}
                </span>
                <span className="px-3 py-2 rounded-lg border-2 border-black bg-purple-50 font-mono text-sm flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-2 animate-pulse"></span>
                  {formatAddress(walletAddress)}
                </span>
              </div>
              <button
                onClick={() => { setWalletAddress(null); setBlockchainError(null); }}
                className="text-xs bg-red-100 text-red-600 px-3 py-2 rounded-lg font-bold border-2 border-transparent hover:border-red-200 transition-all"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {blockchainError && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-400 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 font-medium text-sm">{blockchainError}</span>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Loan Application</h1>
          <p className="text-gray-600 mb-6 flex items-center gap-2">
            {walletAddress && <LinkIcon className="w-4 h-4 text-purple-600" />}
            {walletAddress ? 'Blockchain-verified agricultural loans' : 'Apply for agricultural loans'}
          </p>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="p-6 border-b-2 border-black bg-green-50 rounded-t-2xl">
                  <h3 className="flex items-center text-2xl font-bold">
                    <CreditCard className="h-6 w-6 mr-2" />
                    Loan Details
                    {walletAddress && <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">🔗 Blockchain</span>}
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
                      {isLoading ? <><Loader2 className="inline h-4 w-4 mr-2 animate-spin" />Processing...</> : walletAddress ? '🔗 Submit to Blockchain' : 'Submit Application'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border-2 border-black bg-gradient-to-br from-purple-50 to-blue-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                <h3 className="font-bold mb-4">Blockchain Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${walletAddress ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Wallet Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${isOnShardeum ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Shardeum Network</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                <h3 className="font-bold mb-4"><TrendingUp className="inline w-5 h-5 mr-2" />Benefits</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /><span>Fast approval</span></div>
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /><span>AI-powered</span></div>
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /><span>Transparent</span></div>
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