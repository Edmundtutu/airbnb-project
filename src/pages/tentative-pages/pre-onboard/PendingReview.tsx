import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { propertyService } from '@/services/propertyService';
import { Property } from '@/types/properties';

const PendingReview: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingStatus, setCheckingStatus] = useState(false);

    useEffect(() => {
        checkVerificationStatus();
        loadHostProperties();
        
        // Check status every 10 seconds
        const interval = setInterval(() => {
            checkVerificationStatus();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const checkVerificationStatus = async () => {
        if (!user || user.role !== 'host') {
            return;
        }

        setCheckingStatus(true);
        try {
            // Refresh user data to get latest verification status
            const updatedUser = await authService.me();
            
            // Check if user now has verified property
            if ((updatedUser as any).can_access_host_dashboard) {
                // Redirect to dashboard
                navigate('/host/dashboard', { replace: true });
                return;
            }
        } catch (error) {
            console.error('Failed to check verification status:', error);
        } finally {
            setCheckingStatus(false);
        }
    };

    const loadHostProperties = async () => {
        try {
            const response = await propertyService.getHostProperties();
            setProperties(response.data || []);
        } catch (error) {
            console.error('Failed to load properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const verifiedCount = properties.filter(p => p.verified).length;
    const pendingCount = properties.filter(p => !p.verified).length;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
                        {checkingStatus ? (
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
                        ) : (
                            <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        {checkingStatus ? 'Checking Status...' : 'Property Under Review'}
                    </h1>

                    {/* Description */}
                    <p className="text-gray-600 mb-8">
                        {checkingStatus 
                            ? 'We\'re checking if your property has been verified...'
                            : 'Thank you for registering as a host! Your property is currently under review by our team. We\'ll notify you once it\'s been verified and you can access your dashboard.'
                        }
                    </p>

                    {/* Property Status Summary */}
                    {!loading && properties.length > 0 && (
                        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Properties</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-600 mb-1">{pendingCount}</div>
                                    <div className="text-sm text-gray-600">Pending Review</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600 mb-1">{verifiedCount}</div>
                                    <div className="text-sm text-gray-600">Verified</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Property List */}
                    {!loading && properties.length > 0 && (
                        <div className="mb-8 text-left">
                            <h3 className="text-md font-semibold text-gray-900 mb-3">Property Details</h3>
                            <div className="space-y-3">
                                {properties.map((property) => (
                                    <div
                                        key={property.id}
                                        className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{property.name}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {property.location?.address || 'Address not available'}
                                            </p>
                                        </div>
                                        <div className="ml-4">
                                            {property.verified ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    ✓ Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    ⏳ Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">What happens next?</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    <li>Our team will review your property submission</li>
                                    <li>You'll be able to access your dashboard once at least one property is verified</li>
                                    <li>This page will automatically refresh to check your verification status</li>
                                    <li>You can also refresh this page manually to check for updates</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={checkVerificationStatus}
                            disabled={checkingStatus}
                            className="flex-1 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {checkingStatus ? 'Checking...' : 'Check Status Now'}
                        </button>
                        <button
                            onClick={() => navigate('/pre-onboard/register-host')}
                            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Add Another Property
                        </button>
                    </div>

                    {/* Auto-refresh indicator */}
                    <p className="mt-6 text-xs text-gray-500">
                        Status is checked automatically every 10 seconds
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PendingReview;
