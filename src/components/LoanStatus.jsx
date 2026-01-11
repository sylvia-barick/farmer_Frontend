import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, XCircle, CreditCard, Loader2 } from 'lucide-react';
import { auth } from '../utils/firebaseConfig';

const LoanStatus = ({ user, onBack }) => {
    const [loans, setLoans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserLoans = async () => {
            const uid = user?.uid || auth.currentUser?.uid;

            console.log('LoanStatus Check:', { propUid: user?.uid, authUid: auth.currentUser?.uid, finalUid: uid });

            if (!uid) {
                console.warn("No UID found for loan status");
                setIsLoading(false);
                return;
            }

            try {
                console.log(`Fetching loans for UID: ${uid}`);
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/loan/user/${uid}`);
                const data = await response.json();
                console.log('User Loans Response:', data);

                if (data.success) {
                    setLoans(data.loans);
                } else {
                    console.error('Failed to fetch user loans:', data.message);
                }
            } catch (error) {
                console.error('Error fetching loan status:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserLoans();
    }, [user]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'text-green-600 bg-green-50 border-green-200';
            case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200';
            case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle className="h-5 w-5" />;
            case 'REJECTED': return <XCircle className="h-5 w-5" />;
            default: return <Clock className="h-5 w-5" />;
        }
    };

    return (
        <div className="min-h-screen bg-agricultural-soft-sand p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center mb-8">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 text-agricultural-soil-brown hover:bg-agricultural-stone-gray/10 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Application
                    </button>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-agricultural-soil-brown mb-2">My Loan Applications</h1>
                    <p className="text-agricultural-stone-gray">Track the status of your submitted applications</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-agricultural-forest-green" />
                    </div>
                ) : loans.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-agricultural-stone-gray/20 shadow-sm">
                        <CreditCard className="mx-auto h-12 w-12 text-agricultural-stone-gray/40 mb-3" />
                        <h3 className="text-lg font-medium text-agricultural-soil-brown">No Applications Found</h3>
                        <p className="text-agricultural-stone-gray">You haven't submitted any loan applications yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {loans.map((loan) => (
                            <div key={loan._id} className="bg-white rounded-xl border border-agricultural-stone-gray/20 shadow-sm p-6 transition-all hover:shadow-md">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="w-full">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(loan.status)}`}>
                                                {getStatusIcon(loan.status)}
                                                {loan.status}
                                            </span>
                                            <span className="text-xs font-medium text-agricultural-stone-gray">
                                                ID: {loan._id.slice(-6).toUpperCase()} • Applied on {new Date(loan.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-agricultural-soil-brown mb-1">
                                            {loan.loanPurpose}
                                        </h3>
                                        <div className="flex gap-4 text-sm text-agricultural-stone-gray">
                                            <span>{loan.cropType}</span>
                                            <span>•</span>
                                            <span>{loan.acres} Acres</span>
                                        </div>

                                        {/* Blockchain & Smart Contract Details - Only for Approved Loans */}
                                        {loan.status === 'APPROVED' && loan.blockchainTxHash && (
                                            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg">
                                                    Smart Contract Executed
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction Hash</label>
                                                        <div className="font-mono text-xs text-gray-800 break-all bg-white border rounded p-2 mt-1">
                                                            {loan.blockchainTxHash}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Smart Contract Address</label>
                                                        <div className="font-mono text-xs text-gray-800 break-all bg-white border rounded p-2 mt-1">
                                                            {loan.smartContractAddress}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-[10px] text-gray-400 text-center">
                                                    Funds automatically disbursed via KisaanSaathi secure blockchain network.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-3xl font-black text-agricultural-forest-green">
                                            ₹{loan.requestedAmount.toLocaleString('en-IN')}
                                        </div>
                                        <div className="text-sm font-medium text-agricultural-stone-gray">
                                            {loan.tenureMonths} Months Tenure
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoanStatus;
