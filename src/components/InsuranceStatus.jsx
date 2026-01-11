import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, XCircle, Shield, Loader2, FileText } from 'lucide-react';
import { auth } from '../utils/firebaseConfig';

const InsuranceStatus = ({ user, onBack }) => {
    const [claims, setClaims] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserClaims = async () => {
            const uid = user?.uid || auth.currentUser?.uid;

            if (!uid) {
                console.warn("No UID found for insurance status");
                setIsLoading(false);
                return;
            }

            try {
                console.log(`Fetching insurance claims for UID: ${uid}`);
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/insurance/user/${uid}`);
                const data = await response.json();
                console.log('User Claims Response:', data);

                if (data.success) {
                    setClaims(data.claims);
                } else {
                    console.error('Failed to fetch claims:', data.message);
                }
            } catch (error) {
                console.error('Error fetching insurance status:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserClaims();
    }, [user]);

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED': return 'text-green-600 bg-green-50 border-green-200';
            case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200';
            case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'UNDER_REVIEW': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toUpperCase()) {
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
                        Back to Dashboard
                    </button>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-agricultural-soil-brown mb-2">My Insurance Claims</h1>
                    <p className="text-agricultural-stone-gray">Track the status of your insurance claims</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-agricultural-forest-green" />
                    </div>
                ) : claims.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-agricultural-stone-gray/20 shadow-sm">
                        <Shield className="mx-auto h-12 w-12 text-agricultural-stone-gray/40 mb-3" />
                        <h3 className="text-lg font-medium text-agricultural-soil-brown">No Claims Found</h3>
                        <p className="text-agricultural-stone-gray">You haven't filed any insurance claims yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {claims.map((claim) => (
                            <div key={claim._id} className="bg-white rounded-xl border border-agricultural-stone-gray/20 shadow-sm p-6 transition-all hover:shadow-md">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="w-full">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(claim.status)}`}>
                                                {getStatusIcon(claim.status)}
                                                {claim.status}
                                            </span>
                                            <span className="text-xs font-medium text-agricultural-stone-gray">
                                                ID: {claim._id?.slice(-6).toUpperCase()} • Filed on {new Date(claim.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-agricultural-soil-brown mb-1">
                                            {claim.provider || 'Insurance Claim'}
                                        </h3>
                                        <div className="flex gap-4 text-sm text-agricultural-stone-gray">
                                            <span>Policy: {claim.policyNumber || 'N/A'}</span>
                                            <span>•</span>
                                            <span>UIN: {claim.uin || 'N/A'}</span>
                                        </div>

                                        {claim.aiReasoning && (
                                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FileText className="h-4 w-4 text-blue-600" />
                                                    <span className="text-xs font-bold text-blue-800 uppercase">AI Analysis</span>
                                                </div>
                                                <p className="text-sm text-blue-900">{claim.aiReasoning}</p>
                                                {claim.damagePrediction && (
                                                    <p className="text-sm text-blue-700 mt-2">Damage: {claim.damagePrediction}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-3xl font-black text-agricultural-forest-green">
                                            ₹{Number(claim.claimAmount || 0).toLocaleString('en-IN')}
                                        </div>
                                        <div className="text-sm font-medium text-agricultural-stone-gray">
                                            Claimed Amount
                                        </div>
                                        {claim.authenticityScore && (
                                            <div className="text-xs text-gray-500 mt-2">
                                                Authenticity: {claim.authenticityScore}%
                                            </div>
                                        )}
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

export default InsuranceStatus;
