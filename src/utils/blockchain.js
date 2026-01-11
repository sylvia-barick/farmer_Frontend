/**
 * Blockchain Utilities for KisaanSaathi Frontend
 * Handles MetaMask connection and smart contract interactions
 */

import { ethers } from 'ethers';

// Shardeum Testnet Configuration
export const SHARDEUM_TESTNET = {
    chainId: '0x1F92', // 8082 in hex
    chainName: 'Shardeum Sphinx',
    nativeCurrency: {
        name: 'Shardeum',
        symbol: 'SHM',
        decimals: 18
    },
    rpcUrls: ['https://sphinx.shardeum.org/'],
    blockExplorerUrls: ['https://explorer-sphinx.shardeum.org/']
};

// Contract Address - UPDATE THIS AFTER DEPLOYING VIA REMIX
export const CONTRACT_ADDRESS = '0x38a8d0328ad586CEE1f973CAfB5a01678d634578';

// Admin Address (same as deployer)
export const ADMIN_ADDRESS = '0x38a8d0328ad586CEE1f973CAfB5a01678d634578';

// Contract ABI
export const CONTRACT_ABI = [
    // Events
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "loanId", "type": "uint256" },
            { "indexed": true, "name": "farmer", "type": "address" },
            { "indexed": false, "name": "amount", "type": "uint256" },
            { "indexed": false, "name": "tenure", "type": "uint256" },
            { "indexed": false, "name": "interestRate", "type": "uint256" },
            { "indexed": false, "name": "purpose", "type": "string" },
            { "indexed": false, "name": "authenticityScore", "type": "uint256" },
            { "indexed": false, "name": "timestamp", "type": "uint256" }
        ],
        "name": "LoanRequested",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "loanId", "type": "uint256" },
            { "indexed": true, "name": "farmer", "type": "address" },
            { "indexed": false, "name": "amount", "type": "uint256" },
            { "indexed": false, "name": "totalRepayment", "type": "uint256" },
            { "indexed": false, "name": "timestamp", "type": "uint256" }
        ],
        "name": "LoanApproved",
        "type": "event"
    },

    // Read Functions
    {
        "inputs": [],
        "name": "admin",
        "outputs": [{ "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_loanId", "type": "uint256" }],
        "name": "getLoan",
        "outputs": [{
            "components": [
                { "name": "id", "type": "uint256" },
                { "name": "farmer", "type": "address" },
                { "name": "amount", "type": "uint256" },
                { "name": "tenure", "type": "uint256" },
                { "name": "interestRate", "type": "uint256" },
                { "name": "totalRepayment", "type": "uint256" },
                { "name": "amountRepaid", "type": "uint256" },
                { "name": "requestTime", "type": "uint256" },
                { "name": "approvalTime", "type": "uint256" },
                { "name": "authenticityScore", "type": "uint256" },
                { "name": "status", "type": "uint8" },
                { "name": "purpose", "type": "string" },
                { "name": "cropType", "type": "string" }
            ],
            "name": "",
            "type": "tuple"
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_farmer", "type": "address" }],
        "name": "getFarmerLoanIds",
        "outputs": [{ "name": "", "type": "uint256[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalLoans",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_farmer", "type": "address" }],
        "name": "isFarmerRegistered",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_loanId", "type": "uint256" }],
        "name": "getLoanStatusString",
        "outputs": [{ "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },

    // Write Functions
    {
        "inputs": [{ "name": "_farmer", "type": "address" }],
        "name": "registerFarmer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "name": "_amount", "type": "uint256" },
            { "name": "_tenure", "type": "uint256" },
            { "name": "_interestRate", "type": "uint256" },
            { "name": "_purpose", "type": "string" },
            { "name": "_cropType", "type": "string" },
            { "name": "_authenticityScore", "type": "uint256" }
        ],
        "name": "requestLoan",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_loanId", "type": "uint256" }],
        "name": "approveLoan",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "name": "_loanId", "type": "uint256" },
            { "name": "_reason", "type": "string" }
        ],
        "name": "rejectLoan",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_loanId", "type": "uint256" }],
        "name": "repayLoan",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
];

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

/**
 * Connect to MetaMask wallet
 */
export const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        return accounts[0];
    } catch (error) {
        if (error.code === 4001) {
            throw new Error('User rejected the connection request.');
        }
        throw error;
    }
};

/**
 * Get current connected account
 */
export const getConnectedAccount = async () => {
    if (!isMetaMaskInstalled()) return null;

    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return accounts[0] || null;
    } catch (error) {
        console.error('Error getting connected account:', error);
        return null;
    }
};

/**
 * Switch to Shardeum Testnet
 */
export const switchToShardeum = async () => {
    if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed.');
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SHARDEUM_TESTNET.chainId }]
        });
    } catch (switchError) {
        // Chain not added, let's add it
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [SHARDEUM_TESTNET]
                });
            } catch (addError) {
                throw new Error('Failed to add Shardeum network to MetaMask.');
            }
        } else {
            throw switchError;
        }
    }
};

/**
 * Get current chain ID
 */
export const getCurrentChainId = async () => {
    if (!isMetaMaskInstalled()) return null;

    try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        return chainId;
    } catch (error) {
        console.error('Error getting chain ID:', error);
        return null;
    }
};

/**
 * Check if connected to Shardeum
 */
export const isConnectedToShardeum = async () => {
    const chainId = await getCurrentChainId();
    return chainId === SHARDEUM_TESTNET.chainId;
};

/**
 * Get Web3 Provider
 */
export const getProvider = () => {
    if (!isMetaMaskInstalled()) return null;
    return new ethers.BrowserProvider(window.ethereum);
};

/**
 * Get Contract Instance
 */
export const getContract = async (withSigner = false) => {
    const provider = getProvider();
    if (!provider) throw new Error('No provider available');

    if (withSigner) {
        const signer = await provider.getSigner();
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }

    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
};

/**
 * Request a loan on the blockchain
 */
export const requestLoanOnChain = async (loanData) => {
    const contract = await getContract(true);

    // Convert amount to wei (using ether as base unit)
    const amountInWei = ethers.parseEther(loanData.amount.toString());

    const tx = await contract.requestLoan(
        amountInWei,
        loanData.tenure,
        loanData.interestRate * 100, // Convert to basis points
        loanData.purpose,
        loanData.cropType,
        loanData.authenticityScore
    );

    const receipt = await tx.wait();

    // Parse the LoanRequested event
    const event = receipt.logs.find(log => {
        try {
            const parsed = contract.interface.parseLog(log);
            return parsed.name === 'LoanRequested';
        } catch {
            return false;
        }
    });

    const parsedEvent = contract.interface.parseLog(event);
    return {
        transactionHash: receipt.hash,
        loanId: parsedEvent.args.loanId.toString(),
        blockNumber: receipt.blockNumber
    };
};

/**
 * Get loan details from blockchain
 */
export const getLoanFromChain = async (loanId) => {
    const contract = await getContract();
    const loan = await contract.getLoan(loanId);

    return {
        id: loan.id.toString(),
        farmer: loan.farmer,
        amount: ethers.formatEther(loan.amount),
        tenure: loan.tenure.toString(),
        interestRate: (Number(loan.interestRate) / 100).toFixed(2),
        totalRepayment: ethers.formatEther(loan.totalRepayment),
        amountRepaid: ethers.formatEther(loan.amountRepaid),
        requestTime: new Date(Number(loan.requestTime) * 1000),
        approvalTime: loan.approvalTime > 0 ? new Date(Number(loan.approvalTime) * 1000) : null,
        authenticityScore: loan.authenticityScore.toString(),
        status: ['REQUESTED', 'APPROVED', 'REJECTED', 'REPAID', 'DEFAULTED'][loan.status],
        purpose: loan.purpose,
        cropType: loan.cropType
    };
};

/**
 * Get farmer's loan IDs
 */
export const getFarmerLoanIds = async (farmerAddress) => {
    const contract = await getContract();
    const loanIds = await contract.getFarmerLoanIds(farmerAddress);
    return loanIds.map(id => id.toString());
};

/**
 * Calculate real-time authenticity score
 */
export const calculateAuthenticityScore = (loanData) => {
    let score = 50; // Base score
    const breakdown = {};

    // Amount-based scoring (0-25 points)
    const amount = parseFloat(loanData.requestedAmount) || 0;
    if (amount <= 50000) {
        breakdown.amount = { score: 25, reason: 'Low loan amount - Very Safe' };
    } else if (amount <= 100000) {
        breakdown.amount = { score: 20, reason: 'Moderate loan amount - Safe' };
    } else if (amount <= 300000) {
        breakdown.amount = { score: 15, reason: 'Standard loan amount' };
    } else if (amount <= 500000) {
        breakdown.amount = { score: 10, reason: 'High loan amount - Needs Review' };
    } else {
        breakdown.amount = { score: 5, reason: 'Very high loan amount - High Risk' };
    }
    score += breakdown.amount.score;

    // Tenure-based scoring (0-15 points)
    const tenure = parseInt(loanData.tenureMonths) || 12;
    if (tenure >= 12 && tenure <= 24) {
        breakdown.tenure = { score: 15, reason: 'Optimal repayment period' };
    } else if (tenure >= 6 && tenure <= 36) {
        breakdown.tenure = { score: 10, reason: 'Acceptable tenure' };
    } else {
        breakdown.tenure = { score: 5, reason: 'Unusual tenure period' };
    }
    score += breakdown.tenure.score;

    // Land size scoring (0-15 points)
    const landSize = parseFloat(loanData.landSize || loanData.acres) || 0;
    if (landSize >= 5) {
        breakdown.land = { score: 15, reason: 'Large farm - Good collateral' };
    } else if (landSize >= 2) {
        breakdown.land = { score: 10, reason: 'Medium farm' };
    } else {
        breakdown.land = { score: 5, reason: 'Small holding' };
    }
    score += breakdown.land.score;

    // Purpose scoring (0-10 points)
    const highValuePurposes = ['Crop Cultivation', 'Seeds Purchase', 'Fertilizers'];
    if (highValuePurposes.includes(loanData.loanPurpose)) {
        breakdown.purpose = { score: 10, reason: 'High-value agricultural purpose' };
    } else {
        breakdown.purpose = { score: 5, reason: 'General purpose' };
    }
    score += breakdown.purpose.score;

    // Cap at 100
    const finalScore = Math.min(score, 100);

    return {
        score: finalScore,
        breakdown,
        risk: finalScore >= 70 ? 'Low Risk' : finalScore >= 50 ? 'Medium Risk' : 'High Risk',
        recommendation: finalScore >= 70 ? 'Auto-Approve' : finalScore >= 50 ? 'Manual Review' : 'Investigate',
        color: finalScore >= 70 ? '#22c55e' : finalScore >= 50 ? '#eab308' : '#ef4444'
    };
};

/**
 * Subscribe to account changes
 */
export const onAccountChange = (callback) => {
    if (!isMetaMaskInstalled()) return;
    window.ethereum.on('accountsChanged', callback);
};

/**
 * Subscribe to chain changes
 */
export const onChainChange = (callback) => {
    if (!isMetaMaskInstalled()) return;
    window.ethereum.on('chainChanged', callback);
};

/**
 * Format wallet address for display
 */
export const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
