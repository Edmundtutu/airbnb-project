import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react';

interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyFilters: (filters: any) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen, onClose, onApplyFilters }) => {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-xl border-l">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
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
                <ScrollArea className="h-[calc(100vh-140px)]">
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
                </ScrollArea>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background">
                    <div className="flex items-center justify-between">
                        <Button variant="outline" onClick={clearAllFilters}>
                            Clear all
                        </Button>
                        <Button
                            onClick={() => onApplyFilters(filters)}
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