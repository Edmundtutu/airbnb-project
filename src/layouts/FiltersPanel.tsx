import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, X, SlidersHorizontal, Key, Zap, Wind, Thermometer, Sparkles, PawPrint, Wifi, ChefHat, WashingMachine, Loader2 } from 'lucide-react';

// Filter State Interface - exported for use in Discover
export interface FilterState {
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

// Default empty filter state - exported for use in Discover
export const DEFAULT_FILTER_STATE: FilterState = {
    priceRange: [0, 1000000],
    propertyTypes: [],
    bedrooms: null,
    beds: null,
    bathrooms: null,
    amenities: [],
    bookingOptions: [],
    houseRules: [],
    accessibility: []
};

interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyFilters: (filters: FilterState) => void;
    onFilterChange?: (filters: FilterState) => void; // For live preview requests
    initialFilters?: FilterState;
    resultCount?: number; // Number of results to show on button
    isLoading?: boolean;
    isMobile?: boolean;
}

// Internal filter state (different structure for UI convenience)
interface InternalFilters {
    priceRange: { min: number; max: number };
    placeType: string;
    bedrooms: string;
    beds: string;
    bathrooms: string;
    amenities: string[];
    bookingOptions: {
        instantBook: boolean;
        selfCheckIn: boolean;
        allowsPets: boolean;
    };
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

// Convert FilterState to internal format
const filterStateToInternal = (filterState: FilterState): InternalFilters => ({
    priceRange: { min: filterState.priceRange[0], max: filterState.priceRange[1] },
    placeType: filterState.propertyTypes.length > 0 ? filterState.propertyTypes[0] : 'any',
    bedrooms: filterState.bedrooms !== null ? String(filterState.bedrooms) : 'any',
    beds: filterState.beds !== null ? String(filterState.beds) : 'any',
    bathrooms: filterState.bathrooms !== null ? String(filterState.bathrooms) : 'any',
    amenities: filterState.amenities,
    bookingOptions: {
        instantBook: filterState.bookingOptions.includes('instantBook'),
        selfCheckIn: filterState.bookingOptions.includes('selfCheckIn'),
        allowsPets: filterState.bookingOptions.includes('allowsPets')
    }
});

// Convert internal format to FilterState
const internalToFilterState = (internal: InternalFilters): FilterState => {
    const bookingOptionsArray: string[] = [];
    if (internal.bookingOptions.instantBook) bookingOptionsArray.push('instantBook');
    if (internal.bookingOptions.selfCheckIn) bookingOptionsArray.push('selfCheckIn');
    if (internal.bookingOptions.allowsPets) bookingOptionsArray.push('allowsPets');

    const propertyTypesArray: string[] = [];
    if (internal.placeType !== 'any') {
        propertyTypesArray.push(internal.placeType);
    }

    return {
        priceRange: [internal.priceRange.min, internal.priceRange.max],
        propertyTypes: propertyTypesArray,
        bedrooms: internal.bedrooms === 'any' ? null : Number(internal.bedrooms),
        beds: internal.beds === 'any' ? null : Number(internal.beds),
        bathrooms: internal.bathrooms === 'any' ? null : Number(internal.bathrooms),
        amenities: internal.amenities,
        bookingOptions: bookingOptionsArray,
        houseRules: [],
        accessibility: []
    };
};

// Count active filters
const countActiveFilters = (filters: InternalFilters): number => {
    let count = 0;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 1000000) count++;
    if (filters.placeType !== 'any') count++;
    if (filters.bedrooms !== 'any') count++;
    if (filters.beds !== 'any') count++;
    if (filters.bathrooms !== 'any') count++;
    count += filters.amenities.length;
    if (filters.bookingOptions.instantBook) count++;
    if (filters.bookingOptions.selfCheckIn) count++;
    if (filters.bookingOptions.allowsPets) count++;
    return count;
};

const FilterPanel: React.FC<FilterPanelProps> = ({
    isOpen,
    onClose,
    onApplyFilters,
    onFilterChange,
    initialFilters = DEFAULT_FILTER_STATE,
    resultCount,
    isLoading = false,
    isMobile = false
}) => {
    // Initialize from props with EMPTY defaults
    const [filters, setFilters] = useState<InternalFilters>(() =>
        filterStateToInternal(initialFilters)
    );

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

    // Sync with initial filters when they change externally
    useEffect(() => {
        setFilters(filterStateToInternal(initialFilters));
    }, [initialFilters]);

    // Debounced filter change callback for LIVE PREVIEW
    useEffect(() => {
        if (!onFilterChange) return;

        const timeoutId = setTimeout(() => {
            onFilterChange(internalToFilterState(filters));
        }, 400); // 400ms debounce for smoother UX

        return () => clearTimeout(timeoutId);
    }, [filters, onFilterChange]);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section as keyof typeof prev]
        }));
    };

    const updateAmenity = useCallback((amenity: string) => {
        setFilters(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    }, []);

    const updateBookingOption = useCallback((option: string) => {
        setFilters(prev => ({
            ...prev,
            bookingOptions: {
                ...prev.bookingOptions,
                [option]: !prev.bookingOptions[option as keyof typeof prev.bookingOptions]
            }
        }));
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilters(filterStateToInternal(DEFAULT_FILTER_STATE));
    }, []);

    const handleApply = useCallback(() => {
        onApplyFilters(internalToFilterState(filters));
        if (isMobile) {
            onClose();
        }
    }, [filters, onApplyFilters, isMobile, onClose]);

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
            if (isExpanded) {
                setIsExpanded(false);
            } else {
                onClose();
            }
        } else if (deltaY < -threshold) {
            setIsExpanded(true);
        }
    };

    const activeFilterCount = countActiveFilters(filters);
    
    // Dynamic button text based on result count
    const showResultText = isLoading 
        ? 'Searching...'
        : resultCount !== undefined
            ? `Show ${resultCount.toLocaleString()} ${resultCount === 1 ? 'place' : 'places'}`
            : 'Apply filters';

    // Price range update handlers with validation
    const updateMinPrice = useCallback((value: number) => {
        setFilters(prev => ({
            ...prev,
            priceRange: {
                ...prev.priceRange,
                min: Math.min(value, prev.priceRange.max)
            }
        }));
    }, []);

    const updateMaxPrice = useCallback((value: number) => {
        setFilters(prev => ({
            ...prev,
            priceRange: {
                ...prev.priceRange,
                max: Math.max(value, prev.priceRange.min)
            }
        }));
    }, []);

    // Shared filter content renderer
    const renderFilterContent = () => (
        <div className="space-y-4">
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
                        <p className="text-sm text-muted-foreground">Trip price per night</p>

                        {/* Price Range Display */}
                        <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-full text-sm font-medium">
                            <span>Price Range</span>
                            <span className="text-primary">
                                {filters.priceRange.min > 0 || filters.priceRange.max < 1000000
                                    ? `UGX ${filters.priceRange.min.toLocaleString()} - UGX ${filters.priceRange.max.toLocaleString()}`
                                    : 'Any price'
                                }
                            </span>
                        </div>

                        {/* Dual Range Slider */}
                        <div className="py-6 px-2">
                            <div className="relative h-2">
                                {/* Background Track */}
                                <div className="absolute inset-0 bg-muted rounded-full" />
                                
                                {/* Progress Track (colored section between thumbs) */}
                                <div
                                    className="absolute h-full bg-primary rounded-full"
                                    style={{
                                        left: `${(filters.priceRange.min / 1000000) * 100}%`,
                                        right: `${100 - (filters.priceRange.max / 1000000) * 100}%`
                                    }}
                                />

                                {/* Min Slider */}
                                <input
                                    type="range"
                                    min="0"
                                    max="1000000"
                                    step="10000"
                                    value={filters.priceRange.min}
                                    onChange={(e) => updateMinPrice(Number(e.target.value))}
                                    className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer z-10
                                        [&::-webkit-slider-thumb]:appearance-none 
                                        [&::-webkit-slider-thumb]:h-6 
                                        [&::-webkit-slider-thumb]:w-6 
                                        [&::-webkit-slider-thumb]:rounded-full 
                                        [&::-webkit-slider-thumb]:bg-background 
                                        [&::-webkit-slider-thumb]:border-2 
                                        [&::-webkit-slider-thumb]:border-primary 
                                        [&::-webkit-slider-thumb]:shadow-lg 
                                        [&::-webkit-slider-thumb]:cursor-pointer
                                        [&::-webkit-slider-thumb]:hover:scale-110
                                        [&::-webkit-slider-thumb]:transition-transform
                                        [&::-moz-range-thumb]:h-6 
                                        [&::-moz-range-thumb]:w-6 
                                        [&::-moz-range-thumb]:rounded-full 
                                        [&::-moz-range-thumb]:bg-background 
                                        [&::-moz-range-thumb]:border-2 
                                        [&::-moz-range-thumb]:border-primary 
                                        [&::-moz-range-thumb]:shadow-lg 
                                        [&::-moz-range-thumb]:cursor-pointer"
                                    style={{ 
                                        background: 'transparent',
                                        pointerEvents: filters.priceRange.min >= filters.priceRange.max - 20000 ? 'none' : 'auto'
                                    }}
                                />

                                {/* Max Slider */}
                                <input
                                    type="range"
                                    min="0"
                                    max="1000000"
                                    step="10000"
                                    value={filters.priceRange.max}
                                    onChange={(e) => updateMaxPrice(Number(e.target.value))}
                                    className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer z-20
                                        [&::-webkit-slider-thumb]:appearance-none 
                                        [&::-webkit-slider-thumb]:h-6 
                                        [&::-webkit-slider-thumb]:w-6 
                                        [&::-webkit-slider-thumb]:rounded-full 
                                        [&::-webkit-slider-thumb]:bg-background 
                                        [&::-webkit-slider-thumb]:border-2 
                                        [&::-webkit-slider-thumb]:border-primary 
                                        [&::-webkit-slider-thumb]:shadow-lg 
                                        [&::-webkit-slider-thumb]:cursor-pointer
                                        [&::-webkit-slider-thumb]:hover:scale-110
                                        [&::-webkit-slider-thumb]:transition-transform
                                        [&::-moz-range-thumb]:h-6 
                                        [&::-moz-range-thumb]:w-6 
                                        [&::-moz-range-thumb]:rounded-full 
                                        [&::-moz-range-thumb]:bg-background 
                                        [&::-moz-range-thumb]:border-2 
                                        [&::-moz-range-thumb]:border-primary 
                                        [&::-moz-range-thumb]:shadow-lg 
                                        [&::-moz-range-thumb]:cursor-pointer"
                                    style={{ background: 'transparent' }}
                                />
                            </div>

                            {/* Price Labels */}
                            <div className="flex justify-between text-xs text-muted-foreground mt-4">
                                <span>UGX 0</span>
                                <span>UGX 1,000,000+</span>
                            </div>
                        </div>

                        {/* Manual Input Fields */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-muted-foreground mb-1 block">Minimum</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">UGX</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max={filters.priceRange.max}
                                        step="10000"
                                        value={filters.priceRange.min}
                                        onChange={(e) => updateMinPrice(Number(e.target.value))}
                                        className="w-full pl-12 pr-3 py-2 border rounded-lg bg-background text-sm"
                                    />
                                </div>
                            </div>
                            <span className="text-muted-foreground mt-5">—</span>
                            <div className="flex-1">
                                <label className="text-xs text-muted-foreground mb-1 block">Maximum</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">UGX</span>
                                    <input
                                        type="number"
                                        min={filters.priceRange.min}
                                        max="1000000"
                                        step="10000"
                                        value={filters.priceRange.max}
                                        onChange={(e) => updateMaxPrice(Number(e.target.value))}
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
                        {['any', 'entire-home', 'private-room', 'shared-room'].map(type => (
                            <label key={type} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="placeType"
                                    checked={filters.placeType === type}
                                    onChange={() => setFilters(prev => ({ ...prev, placeType: type }))}
                                    className="h-4 w-4 text-primary border-muted-foreground focus:ring-primary"
                                />
                                <span className="text-sm capitalize">{type.replace(/-/g, ' ')}</span>
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
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
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
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
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
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
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
                                        transition-all duration-200 ease-in-out border
                                        ${isSelected
                                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                            : 'bg-background text-foreground border-border hover:bg-accent hover:border-accent-foreground/20'
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
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>

                {expandedSections.booking && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in-50">
                        {bookingConfig.map(option => {
                            const Icon = option.icon;
                            const isSelected = filters.bookingOptions[option.key as keyof typeof filters.bookingOptions];

                            return (
                                <button
                                    key={option.key}
                                    onClick={() => updateBookingOption(option.key)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
                                        transition-all duration-200 ease-in-out border
                                        ${isSelected
                                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                            : 'bg-background text-foreground border-border hover:bg-accent hover:border-accent-foreground/20'
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
    );

    // Desktop layout - sidebar panel
    if (!isMobile) {
        return (
            <div className="w-full bg-background border rounded-lg shadow-sm h-[calc(100vh-2rem)] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <SlidersHorizontal className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Filters</h2>
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {activeFilterCount}
                            </Badge>
                        )}
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

                {/* Selected Filters Summary */}
                {activeFilterCount > 0 && (
                    <div className="px-4 py-3 bg-muted/50 border-b flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">
                                {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                            >
                                Clear all
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {filters.amenities.map(amenity => (
                                <Badge key={amenity} variant="outline" className="text-xs capitalize">
                                    {amenity.replace(/-/g, ' ')}
                                </Badge>
                            ))}
                            {filters.placeType !== 'any' && (
                                <Badge variant="outline" className="text-xs capitalize">
                                    {filters.placeType.replace(/-/g, ' ')}
                                </Badge>
                            )}
                            {filters.bedrooms !== 'any' && (
                                <Badge variant="outline" className="text-xs">
                                    {filters.bedrooms}+ beds
                                </Badge>
                            )}
                            {(filters.priceRange.min > 0 || filters.priceRange.max < 1000000) && (
                                <Badge variant="outline" className="text-xs">
                                    Price filtered
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Scrollable Filter Content */}
                <ScrollArea className="flex-1">
                    <div className="p-4">
                        {renderFilterContent()}
                    </div>
                </ScrollArea>

                {/* Footer with Apply Button */}
                <div className="p-4 border-t bg-background flex-shrink-0">
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="outline"
                            onClick={clearAllFilters}
                            disabled={activeFilterCount === 0}
                            className="flex-shrink-0"
                        >
                            Clear all
                        </Button>
                        <Button onClick={handleApply} disabled={isLoading} className="flex-1">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                showResultText
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Mobile layout - bottom sheet modal
    if (!isOpen) return null;

    const sheetHeight = isExpanded ? 'max-h-[95vh]' : 'max-h-[70vh]';
    const translateY = isDragging ? Math.max(0, currentY - startY) : 0;

    return (
        <div className="fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className={`fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl border-t ${sheetHeight} flex flex-col transition-all duration-300 ease-out`}
                style={{ transform: `translateY(${translateY}px)` }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Handle bar */}
                <div
                    className="flex justify-center pt-3 pb-2 cursor-pointer select-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b">
                    <div className="flex items-center space-x-2">
                        <SlidersHorizontal className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Filters</h2>
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary">
                                {activeFilterCount}
                            </Badge>
                        )}
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

                {/* Scrollable Filter Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        {renderFilterContent()}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-background flex-shrink-0 safe-area-inset-bottom">
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="outline"
                            onClick={clearAllFilters}
                            disabled={activeFilterCount === 0}
                            className="flex-1"
                        >
                            Clear all
                        </Button>
                        <Button onClick={handleApply} disabled={isLoading} className="flex-1">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                showResultText
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;
