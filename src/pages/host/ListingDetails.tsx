import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Loader2,
    ArrowLeft,
    Home,
    MapPin,
    Coins,
    Users,
    BedDouble,
    Bath,
    Star,
    Calendar,
    Eye,
    EyeOff,
    Zap,
    CheckCircle2,
    Building,
    Settings,
    Image as ImageIcon
} from 'lucide-react';
import { listingService } from '@/services/listingService';
import { bookingService } from '@/services/bookingService';
import type { Listing } from '@/types/listings';
import type { ListingReservation } from '@/types/bookings';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import ImageManager from '@/components/host/listings/ImageManager';
import BookingSummaryCard from '@/components/host/listings/BookingSummaryCard';

const detailSchema = z.object({
    name: z.string().min(3, 'Listing name must be at least 3 characters'),
    description: z.string().min(20, 'Description should be more detailed'),
    price_per_night: z.coerce.number().min(10, 'Price must be at least UGX 10'),
    category: z.string().min(1, 'Please select a category'),
    max_guests: z.coerce.number().min(1, 'At least one guest required'),
    bedrooms: z.coerce.number().min(0).optional(),
    bathrooms: z.coerce.number().min(0).optional(),
    amenities: z.string().optional(),
    house_rules: z.string().optional(),
    tags: z.string().optional(),
    instant_book: z.boolean().optional(),
    is_active: z.boolean().optional(),
});

type DetailFormValues = z.infer<typeof detailSchema>;

const defaultValues: DetailFormValues = {
    name: '',
    description: '',
    price_per_night: 0,
    category: 'general',
    max_guests: 1,
    bedrooms: 0,
    bathrooms: 0,
    amenities: '',
    house_rules: '',
    tags: '',
    instant_book: false,
    is_active: true,
};

// Predefined options for better UX
const CATEGORIES = [
    { value: 'general', label: 'General', icon: Building },
    { value: 'luxury', label: 'Luxury', icon: Star },
    { value: 'adventure', label: 'Adventure', icon: MapPin },
    { value: 'business', label: 'Business', icon: CheckCircle2 },
];

const AMENITY_OPTIONS = [
    'Wi-Fi', 'Pool', 'Workspace', 'Kitchen', 'Free parking', 'Air conditioning',
    'Heating', 'Washer', 'Dryer', 'Hot tub', 'EV charger', 'Gym',
    'Beach access', 'Fireplace', 'BBQ grill', 'Breakfast', 'Pet friendly'
];

const TAG_OPTIONS = [
    'Romantic', 'Remote', 'Pet-friendly', 'Family-friendly', 'Luxury',
    'Budget', 'City center', 'Waterfront', 'Mountain view', 'Historic'
];

const HOUSE_RULE_OPTIONS = [
    'No smoking', 'No parties', 'No pets', 'Quiet hours', 'Check-in before 10 PM',
    'Shoes off inside', 'No unregistered guests', 'Clean up after cooking'
];

const formatUGX = (value: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(value);

const HostListingDetails: React.FC = () => {
    const { listingId } = useParams<{ listingId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('details');

    const form = useForm<DetailFormValues>({
        resolver: zodResolver(detailSchema),
        defaultValues,
    });

    const {
        data: listing,
        isLoading: isLoadingListing,
        isError: isListingError,
    } = useQuery({
        queryKey: ['listing', listingId],
        queryFn: () => listingService.getListing(listingId!),
        enabled: Boolean(listingId),
    });

    const { data: reservations = [], isLoading: isLoadingReservations } = useQuery({
        queryKey: ['listingReservations', listingId],
        queryFn: () => bookingService.getListingReservations(listingId!),
        enabled: Boolean(listingId),
    });

    const updateMutation = useMutation({
        mutationFn: (payload: Partial<Listing>) => listingService.updateListing(listingId!, payload),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
            queryClient.invalidateQueries({ queryKey: ['hostListings'] });
            toast({
                title: 'Success!',
                description: `${updated.name} has been updated successfully.`
            });
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Failed to update listing';
            toast({
                title: 'Update failed',
                description: message,
                variant: 'destructive'
            });
        },
    });

    useEffect(() => {
        if (!listing) return;
        form.reset({
            name: listing.name,
            description: listing.description ?? '',
            price_per_night: listing.price_per_night,
            category: listing.category ?? 'general',
            max_guests: listing.max_guests ?? 1,
            bedrooms: listing.bedrooms ?? 0,
            bathrooms: listing.bathrooms ?? 0,
            amenities: listing.amenities?.join(', ') ?? '',
            house_rules: listing.house_rules?.join(', ') ?? '',
            tags: listing.tags?.join(', ') ?? '',
            instant_book: listing.instant_book ?? false,
            is_active: listing.is_active ?? true,
        });
    }, [listing, form]);

    const selectedAmenities = form.watch('amenities')?.split(',').map(item => item.trim()).filter(Boolean) || [];
    const selectedTags = form.watch('tags')?.split(',').map(item => item.trim()).filter(Boolean) || [];
    const selectedHouseRules = form.watch('house_rules')?.split(',').map(item => item.trim()).filter(Boolean) || [];

    const handleSubmit = (values: DetailFormValues) => {
        if (!listingId) return;
        updateMutation.mutate({
            name: values.name,
            description: values.description,
            price_per_night: values.price_per_night,
            category: values.category,
            max_guests: values.max_guests,
            bedrooms: values.bedrooms,
            bathrooms: values.bathrooms,
            amenities: values.amenities?.split(',').map((item) => item.trim()).filter(Boolean),
            house_rules: values.house_rules?.split(',').map((item) => item.trim()).filter(Boolean),
            tags: values.tags?.split(',').map((item) => item.trim()).filter(Boolean),
            instant_book: values.instant_book,
            is_active: values.is_active,
        });
    };

    const handleToggle = (field: 'is_active' | 'instant_book', value: boolean) => {
        if (!listingId) return;
        updateMutation.mutate({ [field]: value } as Partial<Listing>);
    };

    const toggleArrayItem = (currentItems: string[], item: string, fieldName: 'amenities' | 'tags' | 'house_rules') => {
        const updated = currentItems.includes(item)
            ? currentItems.filter(i => i !== item)
            : [...currentItems, item];
        form.setValue(fieldName, updated.join(', '), { shouldDirty: true, shouldValidate: true });
    };

    const handlePriceChange = (value: number[]) => {
        form.setValue('price_per_night', value[0], { shouldDirty: true, shouldValidate: true });
    };

    const propertyName = useMemo(() => listing?.property?.name ?? 'Property', [listing]);
    const propertyAddress = useMemo(() => listing?.property?.location?.address ?? 'Address unavailable', [listing]);

    const renderContent = () => {
        if (isLoadingListing) {
            return (
                <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading your listing details...</p>
                </div>
            );
        }

        if (isListingError || !listing) {
            return (
                <Card>
                    <CardContent className="py-16 text-center">
                        <div className="mx-auto max-w-md space-y-4">
                            <div className="rounded-full bg-destructive/10 p-3 w-fit mx-auto">
                                <EyeOff className="h-6 w-6 text-destructive" />
                            </div>
                            <h3 className="font-semibold text-lg">Listing not found</h3>
                            <p className="text-muted-foreground">We couldn't find the listing you're looking for.</p>
                            <Button onClick={() => navigate('/host/listings')} className="mt-4">
                                Back to listings
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="details" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Details
                            </TabsTrigger>
                            <TabsTrigger value="media" className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Photos
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Settings
                            </TabsTrigger>
                            <TabsTrigger value="bookings" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Bookings
                            </TabsTrigger>
                        </TabsList>

                        {/* Details Tab */}
                        <TabsContent value="details" className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-3">
                                <Card className="lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle>Listing Information</CardTitle>
                                        <CardDescription>
                                            Update your listing details to attract more guests
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Listing Title</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Cozy beachfront apartment with stunning ocean views"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Make it descriptive and appealing to potential guests
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            rows={6}
                                                            placeholder="Describe what makes your space special. Highlight unique features, nearby attractions, and the overall experience guests can expect..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        {field.value?.length || 0}/500 characters
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="price_per_night"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <Coins className="h-4 w-4" />
                                                            Nightly Price
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-4">
                                                                    <Input
                                                                        type="number"
                                                                        min={10}
                                                                        className="w-32"
                                                                        {...field}
                                                                    />
                                                                    <span className="text-muted-foreground">UGX</span>
                                                                </div>
                                                                <Slider
                                                                    value={[field.value]}
                                                                    onValueChange={handlePriceChange}
                                                                    max={1000}
                                                                    step={10}
                                                                    className="w-full"
                                                                />
                                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                                    <span>UGX 10</span>
                                                                    <span>UGX 500</span>
                                                                    <span>UGX 1000+</span>
                                                                </div>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Category</FormLabel>
                                                        <FormControl>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {CATEGORIES.map((category) => {
                                                                    const Icon = category.icon;
                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            key={category.value}
                                                                            onClick={() => field.onChange(category.value)}
                                                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${field.value === category.value
                                                                                    ? 'border-primary bg-primary/5'
                                                                                    : 'border-muted hover:border-muted-foreground/50'
                                                                                }`}
                                                                        >
                                                                            <Icon className="h-4 w-4" />
                                                                            <span className="text-sm font-medium">{category.label}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-3">
                                            <FormField
                                                control={form.control}
                                                name="max_guests"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <Users className="h-4 w-4" />
                                                            Max Guests
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="flex items-center gap-3">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => field.onChange(Math.max(1, field.value - 1))}
                                                                >
                                                                    -
                                                                </Button>
                                                                <span className="w-8 text-center font-medium">{field.value}</span>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => field.onChange(field.value + 1)}
                                                                >
                                                                    +
                                                                </Button>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="bedrooms"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <BedDouble className="h-4 w-4" />
                                                            Bedrooms
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="flex items-center gap-3">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => field.onChange(Math.max(0, field.value - 1))}
                                                                >
                                                                    -
                                                                </Button>
                                                                <span className="w-8 text-center font-medium">{field.value}</span>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => field.onChange(field.value + 1)}
                                                                >
                                                                    +
                                                                </Button>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="bathrooms"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <Bath className="h-4 w-4" />
                                                            Bathrooms
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="flex items-center gap-3">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => field.onChange(Math.max(0, field.value - 0.5))}
                                                                >
                                                                    -
                                                                </Button>
                                                                <span className="w-12 text-center font-medium">{field.value}</span>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => field.onChange(field.value + 0.5)}
                                                                >
                                                                    +
                                                                </Button>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="amenities"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Amenities</FormLabel>
                                                    <FormDescription>
                                                        Select all amenities available at your property
                                                    </FormDescription>
                                                    <FormControl>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                            {AMENITY_OPTIONS.map((amenity) => (
                                                                <Badge
                                                                    key={amenity}
                                                                    variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                                                                    className="cursor-pointer py-2 px-3 text-sm justify-start"
                                                                    onClick={() => toggleArrayItem(selectedAmenities, amenity, 'amenities')}
                                                                >
                                                                    {selectedAmenities.includes(amenity) && <CheckCircle2 className="h-3 w-3 mr-2" />}
                                                                    {amenity}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="house_rules"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>House Rules</FormLabel>
                                                    <FormDescription>
                                                        Let guests know what's expected during their stay
                                                    </FormDescription>
                                                    <FormControl>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {HOUSE_RULE_OPTIONS.map((rule) => (
                                                                <div
                                                                    key={rule}
                                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedHouseRules.includes(rule)
                                                                            ? 'border-primary bg-primary/5'
                                                                            : 'border-muted hover:border-muted-foreground/50'
                                                                        }`}
                                                                    onClick={() => toggleArrayItem(selectedHouseRules, rule, 'house_rules')}
                                                                >
                                                                    <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedHouseRules.includes(rule)
                                                                            ? 'bg-primary border-primary text-primary-foreground'
                                                                            : 'border-muted-foreground'
                                                                        }`}>
                                                                        {selectedHouseRules.includes(rule) && <CheckCircle2 className="h-3 w-3" />}
                                                                    </div>
                                                                    <span className="text-sm">{rule}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="tags"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Listing Tags</FormLabel>
                                                    <FormDescription>
                                                        Help guests find your property by adding relevant tags
                                                    </FormDescription>
                                                    <FormControl>
                                                        <div className="flex flex-wrap gap-2">
                                                            {TAG_OPTIONS.map((tag) => (
                                                                <Badge
                                                                    key={tag}
                                                                    variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                                                                    className="cursor-pointer py-1 px-3"
                                                                    onClick={() => toggleArrayItem(selectedTags, tag, 'tags')}
                                                                >
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium flex items-center gap-2">
                                                        {form.watch('is_active') ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                                                        Listing Visibility
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {form.watch('is_active') ? 'Visible to guests' : 'Hidden from search'}
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={form.watch('is_active')}
                                                    onCheckedChange={(checked) => {
                                                        form.setValue('is_active', checked, { shouldDirty: true });
                                                        handleToggle('is_active', checked);
                                                    }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium flex items-center gap-2">
                                                        <Zap className={`h-4 w-4 ${form.watch('instant_book') ? 'text-yellow-600' : 'text-muted-foreground'}`} />
                                                        Instant Book
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {form.watch('instant_book') ? 'Guests can book instantly' : 'Manual approval required'}
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={form.watch('instant_book')}
                                                    onCheckedChange={(checked) => {
                                                        form.setValue('instant_book', checked, { shouldDirty: true });
                                                        handleToggle('instant_book', checked);
                                                    }}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Property Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                                <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-sm">{propertyName}</p>
                                                    <p className="text-xs text-muted-foreground">Property</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-sm">{propertyAddress}</p>
                                                    <p className="text-xs text-muted-foreground">Location</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                                <Coins className="h-5 w-5 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-sm">{formatUGX(listing.price_per_night)}/night</p>
                                                    <p className="text-xs text-muted-foreground">Current rate</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Save Changes</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={updateMutation.isPending || !form.formState.isDirty}
                                            >
                                                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save All Changes
                                            </Button>
                                            {form.formState.isDirty && (
                                                <p className="text-xs text-center text-muted-foreground">
                                                    You have unsaved changes
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Media Tab */}
                        <TabsContent value="media" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5" />
                                        Photo Management
                                    </CardTitle>
                                    <CardDescription>
                                        Update your listing photos to showcase your space
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ImageManager
                                        images={listing.images}
                                        onUpdate={(nextImages) => updateMutation.mutateAsync({ images: nextImages })}
                                        isUpdating={updateMutation.isPending}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Settings Tab */}
                        <TabsContent value="settings" className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Visibility Settings</CardTitle>
                                        <CardDescription>
                                            Control how guests discover and book your listing
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between rounded-xl border p-6">
                                            <div className="space-y-1">
                                                <FormLabel className="text-base flex items-center gap-2">
                                                    <Eye className="h-5 w-5" />
                                                    Listing Visibility
                                                </FormLabel>
                                                <FormDescription>
                                                    Make your listing visible to guests and available for booking
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={form.watch('is_active')}
                                                    onCheckedChange={(checked) => {
                                                        form.setValue('is_active', checked, { shouldDirty: true });
                                                        handleToggle('is_active', checked);
                                                    }}
                                                    className="scale-125"
                                                />
                                            </FormControl>
                                        </div>

                                        <div className="flex items-center justify-between rounded-xl border p-6">
                                            <div className="space-y-1">
                                                <FormLabel className="text-base flex items-center gap-2">
                                                    <Zap className="h-5 w-5" />
                                                    Instant Booking
                                                </FormLabel>
                                                <FormDescription>
                                                    Guests can book immediately without waiting for approval
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={form.watch('instant_book')}
                                                    onCheckedChange={(checked) => {
                                                        form.setValue('instant_book', checked, { shouldDirty: true });
                                                        handleToggle('instant_book', checked);
                                                    }}
                                                    className="scale-125"
                                                />
                                            </FormControl>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Performance</CardTitle>
                                        <CardDescription>
                                            Your listing's performance metrics
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                            <div>
                                                <p className="text-sm font-medium">Total Bookings</p>
                                                <p className="text-2xl font-bold">{reservations.length}</p>
                                            </div>
                                            <Calendar className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                            <div>
                                                <p className="text-sm font-medium">Monthly Revenue</p>
                                                <p className="text-2xl font-bold">
                                                    {formatUGX(reservations.length * listing.price_per_night * 0.7)}
                                                </p>
                                            </div>
                                            <Coins className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Bookings Tab */}
                        <TabsContent value="bookings" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Bookings</CardTitle>
                                    <CardDescription>
                                        Manage reservations and guest information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingReservations ? (
                                        <div className="flex min-h-[200px] items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : reservations.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="font-semibold text-lg mb-2">No bookings yet</h3>
                                            <p className="text-muted-foreground mb-4">
                                                Share your listing to attract your first guests
                                            </p>
                                            <Button onClick={() => setActiveTab('details')}>
                                                Optimize Listing
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {reservations.map((reservation: ListingReservation) => (
                                                <BookingSummaryCard key={reservation.id} reservation={reservation} />
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </form>
            </Form>
        );
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col gap-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/host/dashboard" className="flex items-center gap-2">
                                    <Home className="h-4 w-4" />
                                    Host
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/host/listings">Listings</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{listing?.name ?? 'Listing Details'}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{listing?.name ?? 'Listing'}</h1>
                            <Badge variant={listing?.is_active ? 'default' : 'secondary'}>
                                {listing?.is_active ? 'Active' : 'Hidden'}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Fine-tune your listing details, photos, and settings to maximize bookings
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => navigate('/host/listings')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            All Listings
                        </Button>
                    </div>
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default HostListingDetails;