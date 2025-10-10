import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, X, SlidersHorizontal, Key, Zap, Wind, Thermometer, Sparkles, PawPrint, Wifi, ChefHat, WashingMachine } from 'lucide-react';

interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyFilters: (filters: any) => void;
    isMobile?: boolean;
}

// Filter State Interface to match Discover component
interface FilterState {
    priceRange: [number, number];
    propertyTypes: string[];
    bedrooms: number | null;
    beds: number | null;
    bathrooms: number | null;
    amenities: string[];
    bookingOptions: string[];
    houseRules: string[];
    accessibility: string[];
}
const amenitiesConfig = [
    { key: 'wifi', label: 'WiFi', icon: Wifi },
    { key: 'kitchen', label: 'Kitchen', icon: ChefHat },
    { key: 'washer', label: 'Washer', icon: WashingMachine },
    { key: 'dryer', label: 'Dryer', icon: Wind },
    { key: 'air-conditioning', label: 'AC', icon: Sparkles },
    { key: 'heating', label: 'Heating', icon: Thermometer },
    { key: 'hair-dryer', label: 'Hair Dryer', icon: Wind }
];

const bookingConfig = [
    { key: 'instantBook', label: 'Instant Book', icon: Zap },
    { key: 'selfCheckIn', label: 'Self check-in', icon: Key },
    { key: 'allowsPets', label: 'Allows pets', icon: PawPrint }
];
const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen, onClose, onApplyFilters, isMobile = false }) => {
    const [filters, setFilters] = useState({
        priceRange: { min: 34000, max: 780000 },
        placeType: 'any',
        bedrooms: 'any',
        beds: 'any',
        bathrooms: 'any',
        amenities: ['air-conditioning', 'washer', 'hair-dryer'],
        bookingOptions: {
            instantBook: false,
            selfCheckIn: false,
            allowsPets: false
        }
    });

    // Mobile bottom sheet state
    const [isExpanded, setIsExpanded] = useState(false);
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const [expandedSections, setExpandedSections] = useState({
        price: true,
        type: true,
        rooms: true,
        amenities: true,
        booking: true
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const updateAmenity = (amenity: string) => {
        setFilters(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const updateBookingOption = (option: string) => {
        setFilters(prev => ({
            ...prev,
            bookingOptions: {
                ...prev.bookingOptions,
                [option]: !prev.bookingOptions[option]
            }
        }));
    };

    const clearAllFilters = () => {
        setFilters({
            priceRange: { min: 34000, max: 780000 },
            placeType: 'any',
            bedrooms: 'any',
            beds: 'any',
            bathrooms: 'any',
            amenities: [],
            bookingOptions: {
                instantBook: false,
                selfCheckIn: false,
                allowsPets: false
            }
        });
    };

    // Convert internal filter format to FilterState format
    const convertToFilterState = (): FilterState => {
        const bookingOptionsArray: string[] = [];
        if (filters.bookingOptions.instantBook) bookingOptionsArray.push('instantBook');
        if (filters.bookingOptions.selfCheckIn) bookingOptionsArray.push('selfCheckIn');
        if (filters.bookingOptions.allowsPets) bookingOptionsArray.push('allowsPets');

        const propertyTypesArray: string[] = [];
        if (filters.placeType !== 'any') {
            propertyTypesArray.push(filters.placeType);
        }

        return {
            priceRange: [filters.priceRange.min, filters.priceRange.max],
            propertyTypes: propertyTypesArray,
            bedrooms: filters.bedrooms === 'any' ? null : Number(filters.bedrooms),
            beds: filters.beds === 'any' ? null : Number(filters.beds),
            bathrooms: filters.bathrooms === 'any' ? null : Number(filters.bathrooms),
            amenities: filters.amenities,
            bookingOptions: bookingOptionsArray,
            houseRules: [],
            accessibility: []
        };
    };

    // Mobile bottom sheet touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        setStartY(e.touches[0].clientY);
        setCurrentY(e.touches[0].clientY);
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        setCurrentY(e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const deltaY = currentY - startY;
        const threshold = 50;

        if (deltaY > threshold) {
            // Swipe down - close or minimize
            if (isExpanded) {
                setIsExpanded(false);
            } else {
                onClose();
            }
        } else if (deltaY < -threshold) {
            // Swipe up - expand
            setIsExpanded(true);
        }
    };

    const handleHandleClick = () => {
        setIsExpanded(!isExpanded);
    };

    // Desktop layout - always visible sidebar
    if (!isMobile) {
        return (
            <div className="w-full bg-background border rounded-lg shadow-sm h-[calc(100vh-2rem)] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <SlidersHorizontal className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Filters</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Selected Filters Bar */}
                <div className="px-4 py-3 bg-muted/50 border-b flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                            {filters.amenities.length} filters selected
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="text-xs h-7 px-2"
                        >
                            Clear all
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {filters.amenities.map(amenity => (
                            <Badge key={amenity} variant="secondary" className="text-xs capitalize">
                                {amenity.replace('-', ' ')}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Scrollable Filter Content */}
                <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="p-4 space-y-4">
                        {/* Price Range */}
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('price')}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <h3 className="font-semibold text-lg">Price range</h3>
                                {expandedSections.price ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>

                            {expandedSections.price && (
                                <div className="space-y-4 animate-in fade-in-50">
                                    <p className="text-sm text-muted-foreground">Trip price, includes all fees</p>

                                    {/* Price Range Display */}
                                    <div className="flex items-center justify-between bg-secondary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                                        <span>Price Range</span>
                                        <span>UGX {filters.priceRange.min.toLocaleString()} - UGX {filters.priceRange.max.toLocaleString()}</span>
                                    </div>

                                    {/* Slider Container */}
                                    <div className="py-6">
                                        <div className="relative h-2 bg-muted rounded-full">
                                            {/* Progress Track */}
                                            <div
                                                className="absolute h-full gradient-warm-red rounded-full"
                                                style={{
                                                    left: `${(filters.priceRange.min / 1000000) * 100}%`,
                                                    width: `${((filters.priceRange.max - filters.priceRange.min) / 1000000) * 100}%`
                                                }}
                                            />

                                            {/* Min Slider */}
                                            <input
                                                type="range"
                                                min="0"
                                                max="1000000"
                                                value={filters.priceRange.min}
                                                onChange={(e) => setFilters(prev => ({
                                                    ...prev,
                                                    priceRange: { ...prev.priceRange, min: Number(e.target.value) }
                                                }))}
                                                className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:border-none"
                                            />

                                            {/* Max Slider */}
                                            <input
                                                type="range"
                                                min="0"
                                                max="1000000"
                                                value={filters.priceRange.max}
                                                onChange={(e) => setFilters(prev => ({
                                                    ...prev,
                                                    priceRange: { ...prev.priceRange, max: Number(e.target.value) }
                                                }))}
                                                className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:border-none"
                                            />
                                        </div>

                                        {/* Price Labels */}
                                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                            <span>UGX 0</span>
                                            <span>UGX 1,000,000</span>
                                        </div>
                                    </div>

                                    {/* Price Breakdown */}
                                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground">Min Price</div>
                                            <div className="font-semibold text-primary">{filters.priceRange.min.toLocaleString()}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground">Max Price</div>
                                            <div className="font-semibold text-destructive">{filters.priceRange.max.toLocaleString()}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground">Price Range</div>
                                            <div className="font-semibold">{(filters.priceRange.max - filters.priceRange.min).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Separator />

                        {/* Type of Place */}
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('type')}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <h3 className="font-semibold text-lg">Type of place</h3>
                                {expandedSections.type ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>

                            {expandedSections.type && (
                                <div className="space-y-3 animate-in fade-in-50">
                                    {['any', 'entire-home', 'room'].map(type => (
                                        <label key={type} className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="placeType"
                                                checked={filters.placeType === type}
                                                onChange={() => setFilters(prev => ({ ...prev, placeType: type }))}
                                                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                            />
                                            <span className="text-sm capitalize">{type.replace('-', ' ')}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Rooms and Beds */}
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('rooms')}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <h3 className="font-semibold text-lg">Rooms and beds</h3>
                                {expandedSections.rooms ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>

                            {expandedSections.rooms && (
                                <div className="space-y-4 animate-in fade-in-50">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Bedrooms</label>
                                            <select
                                                value={filters.bedrooms}
                                                onChange={(e) => setFilters(prev => ({ ...prev, bedrooms: e.target.value }))}
                                                className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                                            >
                                                <option value="any">Any</option>
                                                {[1, 2, 3, 4, 5, 6].map(num => (
                                                    <option key={num} value={num}>{num}+</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Beds</label>
                                            <select
                                                value={filters.beds}
                                                onChange={(e) => setFilters(prev => ({ ...prev, beds: e.target.value }))}
                                                className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                                            >
                                                <option value="any">Any</option>
                                                {[1, 2, 3, 4, 5, 6].map(num => (
                                                    <option key={num} value={num}>{num}+</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Bathrooms</label>
                                            <select
                                                value={filters.bathrooms}
                                                onChange={(e) => setFilters(prev => ({ ...prev, bathrooms: e.target.value }))}
                                                className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                                            >
                                                <option value="any">Any</option>
                                                {[1, 2, 3, 4, 5, 6].map(num => (
                                                    <option key={num} value={num}>{num}+</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Amenities */}

                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('amenities')}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <h3 className="font-semibold text-lg">Amenities</h3>
                                {expandedSections.amenities ? (
                                    <ChevronUp className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                )}
                            </button>

                            {expandedSections.amenities && (
                                <div className="flex flex-wrap gap-2 animate-in fade-in-50">
                                    {amenitiesConfig.map(amenity => {
                                        const Icon = amenity.icon;
                                        const isSelected = filters.amenities.includes(amenity.key);

                                        return (
                                            <button
                                                key={amenity.key}
                                                onClick={() => updateAmenity(amenity.key)}
                                                className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
                                        transition-all duration-200 ease-in-out
                                        ${isSelected
                                                        ? 'bg-secondary text-white shadow-md scale-105'
                                                        : 'bg-muted text-gray-700 hover:bg-gray-200 hover:scale-102'
                                                    }
                                    `}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span>{amenity.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Booking Options */}
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('booking')}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <h3 className="font-semibold text-lg">Booking options</h3>
                                {expandedSections.booking ? (
                                    <ChevronUp className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                )}
                            </button>

                            {expandedSections.booking && (
                                <div className="flex flex-wrap gap-2 animate-in fade-in-50">
                                    {bookingConfig.map(option => {
                                        const Icon = option.icon;
                                        const isSelected = filters.bookingOptions[option.key];

                                        return (
                                            <button
                                                key={option.key}
                                                onClick={() => updateBookingOption(option.key)}
                                                className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
                                        transition-all duration-200 ease-in-out
                                        ${isSelected
                                                        ? 'bg-secondary text-white shadow-md scale-105'
                                                        : 'bg-muted text-gray-700 hover:bg-gray-200 hover:scale-102'
                                                    }
                                    `}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span>{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 border-t bg-background">
                    <div className="flex items-center justify-between">
                        <Button variant="outline" onClick={clearAllFilters}>
                            Clear all
                        </Button>
                        <Button
                            onClick={() => onApplyFilters(convertToFilterState())}
                            className="bg-gradient-to-r from-red-imperial to-red-cinnabar hover:from-red-imperial/90 hover:to-red-cinnabar/90"
                        >
                            Show 7 places
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Mobile layout - bottom sheet modal
    if (!isOpen) return null;

    const sheetHeight = isExpanded ? 'max-h-[95vh]' : 'max-h-[60vh]';
    const translateY = isDragging ? `translateY(${Math.max(0, currentY - startY)}px)` : '';

    return (
        <div className="fixed inset-0 z-[50] bg-background/80 backdrop-blur-sm">
            <div
                className={`fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl border-t ${sheetHeight} flex flex-col transition-all duration-300 ease-out ${translateY}`}
            >
                {/* Handle bar */}
                <div
                    className="flex justify-center pt-3 pb-2 cursor-pointer select-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={handleHandleClick}
                >
                    <div className="w-12 h-1 bg-muted-foreground/30 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center space-x-2">
                        <SlidersHorizontal className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Filters</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Selected Filters Bar */}
                <div className="px-6 py-3 bg-muted/50 border-b">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                            {filters.amenities.length} filters selected
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="text-xs h-7 px-2"
                        >
                            Clear all
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {filters.amenities.map(amenity => (
                            <Badge key={amenity} variant="secondary" className="text-xs capitalize">
                                {amenity.replace('-', ' ')}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Scrollable Filter Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Price Range */}
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('price')}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <h3 className="font-semibold text-lg">Price range</h3>
                                {expandedSections.price ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>

                            {expandedSections.price && (
                                <div className="space-y-4 animate-in fade-in-50">
                                    <p className="text-sm text-muted-foreground">Trip price, includes all fees</p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Minimum</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                                                    UGX
                                                </span>
                                                <input
                                                    type="number"
                                                    value={filters.priceRange.min}
                                                    onChange={(e) => setFilters(prev => ({
                                                        ...prev,
                                                        priceRange: { ...prev.priceRange, min: Number(e.target.value) }
                                                    }))}
                                                    className="w-full pl-12 pr-3 py-2 border rounded-lg bg-background text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Maximum</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                                                    UGX
                                                </span>
                                                <input
                                                    type="number"
                                                    value={filters.priceRange.max}
                                                    onChange={(e) => setFilters(prev => ({
                                                        ...prev,
                                                        priceRange: { ...prev.priceRange, max: Number(e.target.value) }
                                                    }))}
                                                    className="w-full pl-12 pr-3 py-2 border rounded-lg bg-background text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Type of Place */}
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('type')}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <h3 className="font-semibold text-lg">Type of place</h3>
                                {expandedSections.type ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>

                            {expandedSections.type && (
                                <div className="space-y-3 animate-in fade-in-50">
                                    {['any', 'entire-home', 'room'].map(type => (
                                        <label key={type} className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="placeType"
                                                checked={filters.placeType === type}
                                                onChange={() => setFilters(prev => ({ ...prev, placeType: type }))}
                                                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                            />
                                            <span className="text-sm capitalize">{type.replace('-', ' ')}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Rooms and Beds */}
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('rooms')}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <h3 className="font-semibold text-lg">Rooms and beds</h3>
                                {expandedSections.rooms ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>

                            {expandedSections.rooms && (
                                <div className="space-y-4 animate-in fade-in-50">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Bedrooms</label>
                                            <select
                                                value={filters.bedrooms}
                                                onChange={(e) => setFilters(prev => ({ ...prev, bedrooms: e.target.value }))}
                                                className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                                            >
                                                <option value="any">Any</option>
                                                {[1, 2, 3, 4, 5, 6].map(num => (
                                                    <option key={num} value={num}>{num}+</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Beds</label>
                                            <select
                                                value={filters.beds}
                                                onChange={(e) => setFilters(prev => ({ ...prev, beds: e.target.value }))}
                                                className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                                            >
                                                <option value="any">Any</option>
                                                {[1, 2, 3, 4, 5, 6].map(num => (
                                                    <option key={num} value={num}>{num}+</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Bathrooms</label>
                                            <select
                                                value={filters.bathrooms}
                                                onChange={(e) => setFilters(prev => ({ ...prev, bathrooms: e.target.value }))}
                                                className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                                            >
                                                <option value="any">Any</option>
                                                {[1, 2, 3, 4, 5, 6].map(num => (
                                                    <option key={num} value={num}>{num}+</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Amenities */}
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('amenities')}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <h3 className="font-semibold text-lg">Amenities</h3>
                                {expandedSections.amenities ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>

                            {expandedSections.amenities && (
                                <div className="space-y-3 animate-in fade-in-50">
                                    {[
                                        'wifi', 'kitchen', 'washer', 'dryer',
                                        'air-conditioning', 'heating', 'hair-dryer'
                                    ].map(amenity => (
                                        <label key={amenity} className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filters.amenities.includes(amenity)}
                                                onChange={() => updateAmenity(amenity)}
                                                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                            />
                                            <span className="text-sm capitalize">{amenity.replace('-', ' ')}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Booking Options */}
                        <div className="space-y-4">
                            <button
                                onClick={() => toggleSection('booking')}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <h3 className="font-semibold text-lg">Booking options</h3>
                                {expandedSections.booking ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>

                            {expandedSections.booking && (
                                <div className="space-y-3 animate-in fade-in-50">
                                    {[
                                        { key: 'instantBook', label: 'Instant Book' },
                                        { key: 'selfCheckIn', label: 'Self check-in' },
                                        { key: 'allowsPets', label: 'Allows pets' }
                                    ].map(option => (
                                        <label key={option.key} className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filters.bookingOptions[option.key]}
                                                onChange={() => updateBookingOption(option.key)}
                                                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                            />
                                            <span className="text-sm">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-background flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <Button variant="outline" onClick={clearAllFilters}>
                            Clear all
                        </Button>
                        <Button
                            onClick={() => onApplyFilters(convertToFilterState())}
                            className="bg-gradient-to-r from-red-imperial to-red-cinnabar hover:from-red-imperial/90 hover:to-red-cinnabar/90"
                        >
                            Show 7 places
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;