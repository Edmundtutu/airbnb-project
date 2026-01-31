import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { propertyService } from '@/services/propertyService';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

// ============================================================================
// 1. BASE COMPONENTS
// ============================================================================

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    stepLabels: string[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, stepLabels }) => {
    const percentage = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
            <div className="max-w-2xl mx-auto">
                {/* Progress line */}
                <div className="relative h-1 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {/* Step label */}
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                        {stepLabels[currentStep]}
                    </span>
                    <span className="text-xs text-gray-500">
                        Step {currentStep + 1} of {totalSteps}
                    </span>
                </div>
            </div>
        </div>
    );
};

interface StepLayoutProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    ctaLabel?: string;
    onNext?: () => void;
    onBack?: () => void;
    isNextDisabled?: boolean;
    isLastStep?: boolean;
    isLoading?: boolean;
}

const StepLayout: React.FC<StepLayoutProps> = ({
    title,
    description,
    children,
    ctaLabel,
    onNext,
    onBack,
    isNextDisabled = false,
    isLastStep = false,
    isLoading = false,
}) => {
    return (
        <div className="min-h-[calc(100vh-140px)] flex flex-col px-4 py-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {title}
                </h1>
                {description && (
                    <p className="text-gray-600">
                        {description}
                    </p>
                )}
            </div>

            {/* Content */}
            <div className="flex-1">
                {children}
            </div>

            {/* Footer CTA */}
            <div className="mt-8 pt-4 border-t border-gray-200">
                <div className="flex gap-3">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1"
                        >
                            Back
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onNext}
                        disabled={isNextDisabled || isLoading}
                        className={`px-4 py-3 text-sm font-medium text-white rounded-lg transition-colors flex-1
              ${isNextDisabled || isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-primary hover:bg-primary/90'
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            ctaLabel || (isLastStep ? 'Finish Registration' : 'Continue')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// 2. FORM COMPONENTS
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

const TextInput: React.FC<InputProps> = ({ label, error, ...props }) => {
    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <input
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
          ${error ? 'border-red-500' : 'border-gray-300'}`}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

interface RadioGroupProps {
    label: string;
    options: Array<{ value: string; label: string }>;
    value: string;
    onChange: (value: string) => void;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ label, options, value, onChange }) => {
    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
                {label}
            </label>
            <div className="space-y-2">
                {options.map((option) => (
                    <label
                        key={option.value}
                        className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                        <input
                            type="radio"
                            name={label}
                            value={option.value}
                            checked={value === option.value}
                            onChange={(e) => onChange(e.target.value)}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="ml-3 text-gray-700">{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

interface ImageUploadProps {
    onImageSelect: (file: File) => void;
    currentImage?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, currentImage }) => {
    const [preview, setPreview] = useState<string | null>(currentImage || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageSelect(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
                Property Image
            </label>
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="image-upload"
                />

                {preview ? (
                    <div className="relative w-full max-w-md">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                        />
                        <label
                            htmlFor="image-upload"
                            className="mt-3 inline-block px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                            Change Image
                        </label>
                    </div>
                ) : (
                    <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-primary mb-1">
                            Click to upload
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                            Upload a photo of your property
                            <br />
                            PNG, JPG up to 5MB
                        </span>
                    </label>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// 3. STEP COMPONENTS
// ============================================================================

interface StepProps {
    onNext: () => void;
    onBack: () => void;
    updateFormData: (data: any) => void;
    formData: any;
}

const Step1Welcome: React.FC<StepProps> = ({ onNext }) => {
    return (
        <StepLayout
            title="Welcome, Future Host!"
            description="Let's get your property set up. This will take about 5 minutes."
            ctaLabel="Get Started"
            onNext={onNext}
        >
            <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                    Thank you for choosing to host with us
                </h2>
                <p className="text-gray-600 text-center mb-8">
                    We're excited to help you share your space with travelers from around the world.
                </p>

                <div className="w-full max-w-sm space-y-4">
                    <div className="flex items-center text-gray-600">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                            <span className="text-xs font-medium text-primary">1</span>
                        </div>
                        <span>Create your account</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                            <span className="text-xs font-medium text-primary">2</span>
                        </div>
                        <span>Tell us about yourself</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                            <span className="text-xs font-medium text-primary">3</span>
                        </div>
                        <span>Add your property details</span>
                    </div>
                </div>
            </div>
        </StepLayout>
    );
};

const Step2Account: React.FC<StepProps> = ({ onNext, onBack, updateFormData, formData }) => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isRegistering, setIsRegistering] = useState(false);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName?.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = async () => {
        if (!validate()) {
            return;
        }

        // If user is already registered (has token), skip registration
        if (formData.isRegistered) {
            onNext();
            return;
        }

        setIsRegistering(true);
        try {
            const response = await authService.register({
                name: formData.fullName,
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.confirmPassword,
                role: 'host',
            });

            // Store token
            localStorage.setItem('auth-token', response.access_token);
            localStorage.setItem('auth-user', JSON.stringify(response.user));
            api.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`;

            // Mark as registered
            updateFormData({ isRegistered: true, userId: response.user.id });
            onNext();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
            setErrors({ submit: errorMessage });
        } finally {
            setIsRegistering(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        updateFormData({ [field]: value });
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <StepLayout
            title="Create Your Account"
            description="Let's start with your basic information."
            onNext={handleNext}
            onBack={onBack}
            isNextDisabled={!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword}
            isLoading={isRegistering}
        >
            <TextInput
                label="Full Name"
                value={formData.fullName || ''}
                onChange={(e) => handleChange('fullName', e.target.value)}
                error={errors.fullName}
                placeholder="John Doe"
                autoFocus
            />

            <TextInput
                label="Email Address"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                placeholder="john@example.com"
            />

            <TextInput
                label="Phone Number"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
            />

            <TextInput
                label="Password"
                type="password"
                value={formData.password || ''}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                placeholder="At least 8 characters"
            />

            <TextInput
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword || ''}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
            />
            {errors.submit && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
            )}
        </StepLayout>
    );
};

const Step3HostDetails: React.FC<StepProps> = ({ onNext, onBack, updateFormData, formData }) => {
    const hostTypeOptions = [
        { value: 'individual', label: 'Individual host' },
        { value: 'professional', label: 'Professional host or property manager' },
        { value: 'co-host', label: 'Co-host' },
    ];

    const experienceOptions = [
        { value: 'none', label: 'First time hosting' },
        { value: 'some', label: 'Some experience (1-2 years)' },
        { value: 'experienced', label: 'Experienced host (3+ years)' },
    ];

    return (
        <StepLayout
            title="Tell Us About Yourself"
            description="Help us understand your hosting style."
            onNext={onNext}
            onBack={onBack}
            isNextDisabled={!formData.hostType}
        >
            <RadioGroup
                label="You are hosting as:"
                options={hostTypeOptions}
                value={formData.hostType || ''}
                onChange={(value) => updateFormData({ hostType: value })}
            />

            <RadioGroup
                label="Your hosting experience:"
                options={experienceOptions}
                value={formData.experience || ''}
                onChange={(value) => updateFormData({ experience: value })}
            />

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <textarea
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    rows={4}
                    placeholder="Tell potential guests about yourself and your hosting philosophy..."
                    value={formData.bio || ''}
                    onChange={(e) => updateFormData({ bio: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">
                    This will be visible on your host profile
                </p>
            </div>
        </StepLayout>
    );
};

const Step4PropertyBasics: React.FC<StepProps> = ({ onNext, onBack, updateFormData, formData }) => {
    const propertyTypeOptions = [
        { value: 'apartment', label: 'Apartment' },
        { value: 'house', label: 'House' },
        { value: 'villa', label: 'Villa' },
        { value: 'condo', label: 'Condominium' },
        { value: 'loft', label: 'Loft' },
        { value: 'cottage', label: 'Cottage' },
    ];

    return (
        <StepLayout
            title="Property Details"
            description="Let's learn about your space."
            onNext={onNext}
            onBack={onBack}
            isNextDisabled={!formData.propertyType || !formData.location}
        >
            <RadioGroup
                label="Property Type"
                options={propertyTypeOptions}
                value={formData.propertyType || ''}
                onChange={(value) => updateFormData({ propertyType: value })}
            />

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location (Address)
                </label>
                <input
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    placeholder="Enter your property address"
                    value={formData.location || ''}
                    onChange={(e) => updateFormData({ location: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">
                    Enter the full address of your property
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude
                    </label>
                    <input
                        type="number"
                        step="any"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        placeholder="e.g., -0.6152"
                        value={formData.lat || ''}
                        onChange={(e) => updateFormData({ lat: parseFloat(e.target.value) || null })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude
                    </label>
                    <input
                        type="number"
                        step="any"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        placeholder="e.g., 30.6586"
                        value={formData.lng || ''}
                        onChange={(e) => updateFormData({ lng: parseFloat(e.target.value) || null })}
                    />
                </div>
            </div>
            <p className="text-xs text-gray-500 mb-6">
                Note: For MVP, you can use default coordinates (Mbarara: -0.6152, 30.6586) or enter your property coordinates.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Guests
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                            type="button"
                            className="px-3 py-2 text-gray-600 hover:text-gray-900"
                            onClick={() => updateFormData({
                                maxGuests: Math.max(1, (formData.maxGuests || 1) - 1)
                            })}
                        >
                            -
                        </button>
                        <span className="flex-1 text-center font-medium">
                            {formData.maxGuests || 1}
                        </span>
                        <button
                            type="button"
                            className="px-3 py-2 text-gray-600 hover:text-gray-900"
                            onClick={() => updateFormData({
                                maxGuests: (formData.maxGuests || 1) + 1
                            })}
                        >
                            +
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bedrooms
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                            type="button"
                            className="px-3 py-2 text-gray-600 hover:text-gray-900"
                            onClick={() => updateFormData({
                                bedrooms: Math.max(0, (formData.bedrooms || 1) - 1)
                            })}
                        >
                            -
                        </button>
                        <span className="flex-1 text-center font-medium">
                            {formData.bedrooms || 1}
                        </span>
                        <button
                            type="button"
                            className="px-3 py-2 text-gray-600 hover:text-gray-900"
                            onClick={() => updateFormData({
                                bedrooms: (formData.bedrooms || 1) + 1
                            })}
                        >
                            +
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beds
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                            type="button"
                            className="px-3 py-2 text-gray-600 hover:text-gray-900"
                            onClick={() => updateFormData({
                                beds: Math.max(1, (formData.beds || 1) - 1)
                            })}
                        >
                            -
                        </button>
                        <span className="flex-1 text-center font-medium">
                            {formData.beds || 1}
                        </span>
                        <button
                            type="button"
                            className="px-3 py-2 text-gray-600 hover:text-gray-900"
                            onClick={() => updateFormData({
                                beds: (formData.beds || 1) + 1
                            })}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Description
                </label>
                <textarea
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    rows={4}
                    placeholder="Describe your property, amenities, and what makes it special..."
                    value={formData.propertyDescription || ''}
                    onChange={(e) => updateFormData({ propertyDescription: e.target.value })}
                />
            </div>
        </StepLayout>
    );
};

const Step5Review: React.FC<StepProps> = ({ onNext, onBack, updateFormData, formData }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async () => {
        if (!formData.isRegistered) {
            setError('Please complete account registration first');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Use default coordinates if not provided (Mbarara, Uganda)
            const lat = formData.lat ?? -0.6152;
            const lng = formData.lng ?? 30.6586;

            // Prepare property data
            const propertyData = {
                name: formData.propertyType ? `${formData.propertyType.charAt(0).toUpperCase() + formData.propertyType.slice(1)} - ${formData.location || 'Property'}` : 'My Property',
                description: formData.propertyDescription || 'A beautiful property',
                address: formData.location || 'Address not provided',
                lat: lat,
                lng: lng,
                category: formData.propertyType || 'House',
                phone: formData.phone || null,
            };

            // Create property
            const property = await propertyService.createProperty(propertyData);

            // Mark property as created
            updateFormData({ propertyCreated: true, propertyId: property.id });

            // Navigate to success
            onNext();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.errors ? 
                                Object.values(error.response.data.errors).flat().join(', ') :
                                'Failed to create property. Please try again.';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageSelect = (file: File) => {
        setImage(file);
    };

    return (
        <StepLayout
            title="Review & Submit"
            description="Double-check your information and add a photo."
            ctaLabel="Complete Registration"
            onNext={handleSubmit}
            onBack={onBack}
            isLastStep
            isLoading={isSubmitting}
        >
            <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={formData.propertyImage}
            />

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-900">Account Details</h3>
                        <button
                            type="button"
                            className="text-sm text-primary hover:text-primary/80"
                            onClick={() => updateFormData({ editStep: 1 })}
                        >
                            Edit
                        </button>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>{formData.fullName}</p>
                        <p>{formData.email}</p>
                        {formData.phone && <p>{formData.phone}</p>}
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-900">Host Information</h3>
                        <button
                            type="button"
                            className="text-sm text-primary hover:text-primary/80"
                            onClick={() => updateFormData({ editStep: 2 })}
                        >
                            Edit
                        </button>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>{formData.hostType === 'individual' ? 'Individual host' :
                            formData.hostType === 'professional' ? 'Professional host' : 'Co-host'}</p>
                        <p>{formData.experience === 'none' ? 'First time hosting' :
                            formData.experience === 'some' ? 'Some experience' : 'Experienced host'}</p>
                        {formData.bio && <p className="mt-2">{formData.bio}</p>}
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-900">Property Details</h3>
                        <button
                            type="button"
                            className="text-sm text-primary hover:text-primary/80"
                            onClick={() => updateFormData({ editStep: 3 })}
                        >
                            Edit
                        </button>
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                        <p><span className="font-medium">Type:</span> {formData.propertyType}</p>
                        <p><span className="font-medium">Location:</span> {formData.location}</p>
                        <p><span className="font-medium">Capacity:</span> {formData.maxGuests || 1} guests, {formData.bedrooms || 1} bedrooms, {formData.beds || 1} beds</p>
                        {formData.propertyDescription && (
                            <p className="mt-2">{formData.propertyDescription}</p>
                        )}
                    </div>
                </div>
            </div>
        </StepLayout>
    );
};

// ============================================================================
// 4. MAIN FLOW COMPONENT
// ============================================================================

const RegisterHost: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<any>({});
    const [showSuccess, setShowSuccess] = useState(false);

    const stepLabels = [
        'Get started',
        'Account details',
        'Host information',
        'Property details',
        'Review & submit'
    ];

    const updateFormData = (data: any) => {
        setFormData((prev: any) => ({ ...prev, ...data }));
    };

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(prev => prev + 1);
        } else {
            setShowSuccess(true);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleEditStep = (stepIndex: number) => {
        setCurrentStep(stepIndex);
    };

    useEffect(() => {
        if (formData.editStep !== undefined) {
            handleEditStep(formData.editStep);
            const { editStep, ...rest } = formData;
            setFormData(rest);
        }
    }, [formData]);

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Registration Complete!</h1>
                    <p className="text-gray-600 mb-8">
                        Your host account has been created and your property has been submitted for review. Our team will review your property and notify you once it's verified. You'll be able to access your dashboard once your property is verified.
                    </p>
                    <button
                        onClick={() => {
                            window.location.href = '/pre-onboard/pending-review';
                        }}
                        className="w-full py-3 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors mb-3"
                    >
                        View Review Status
                    </button>
                    <button
                        onClick={() => {
                            setShowSuccess(false);
                            setCurrentStep(0);
                            setFormData({});
                        }}
                        className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Start Over
                    </button>
                </div>
            </div>
        );
    }

    const steps = [
        <Step1Welcome
            key="step1"
            onNext={handleNext}
            onBack={handleBack}
            updateFormData={updateFormData}
            formData={formData}
        />,
        <Step2Account
            key="step2"
            onNext={handleNext}
            onBack={handleBack}
            updateFormData={updateFormData}
            formData={formData}
        />,
        <Step3HostDetails
            key="step3"
            onNext={handleNext}
            onBack={handleBack}
            updateFormData={updateFormData}
            formData={formData}
        />,
        <Step4PropertyBasics
            key="step4"
            onNext={handleNext}
            onBack={handleBack}
            updateFormData={updateFormData}
            formData={formData}
        />,
        <Step5Review
            key="step5"
            onNext={handleNext}
            onBack={handleBack}
            updateFormData={updateFormData}
            formData={formData}
        />
    ];

    return (
        <div className="min-h-screen bg-white">
            <ProgressBar
                currentStep={currentStep}
                totalSteps={steps.length}
                stepLabels={stepLabels}
            />
            {steps[currentStep]}
        </div>
    );
};

export default RegisterHost;