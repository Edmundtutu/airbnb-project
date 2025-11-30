import React, { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ImageIcon,
    Loader2,
    Plus,
    Trash2,
    Home,
    Users,
    DollarSign,
    BedDouble,
    Bath,
    Star,
    MapPin,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { listingService } from '@/services/listingService';
import { propertyService } from '@/services/propertyService';
import uploadService from '@/services/uploadService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import type { Listing } from '@/types/listings';
import type { Property } from '@/types/properties';

const listingSchema = z.object({
    name: z.string().min(3, 'Name is required'),
    property_id: z.string().min(1, 'Select a property'),
    description: z.string().min(20, 'Add a richer description'),
    category: z.string().min(1, 'Pick a category'),
    price_per_night: z.coerce.number().min(10, 'Price must be at least $10'),
    max_guests: z.coerce.number().min(1, 'At least one guest'),
    bedrooms: z.coerce.number().min(0).optional(),
    bathrooms: z.coerce.number().min(0).optional(),
    amenities: z.string().optional(),
    house_rules: z.string().optional(),
    tags: z.string().optional(),
    instant_book: z.boolean().optional(),
    is_active: z.boolean().optional(),
    images: z.array(z.string().url('Image must be a valid URL')).optional(),
});

type ListingFormValues = z.infer<typeof listingSchema>;

const defaultValues: ListingFormValues = {
    name: '',
    property_id: '',
    description: '',
    category: 'general',
    price_per_night: 150,
    max_guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: '',
    house_rules: '',
    tags: '',
    instant_book: true,
    is_active: true,
    images: [],
};

// Predefined options for better UX
const CATEGORIES = [
    { value: 'general', label: 'General', icon: Home },
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

const HostCreateListing: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user } = useAuth();
    const [uploadingImages, setUploadingImages] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [activeTab, setActiveTab] = useState('basics');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_IMAGES = 10;

    const form = useForm<ListingFormValues>({
        resolver: zodResolver(listingSchema),
        defaultValues,
    });

    const images = form.watch('images') ?? [];
    const remainingSlots = Math.max(MAX_IMAGES - images.length, 0);
    const selectedAmenities = form.watch('amenities')?.split(',').map(item => item.trim()).filter(Boolean) || [];
    const selectedTags = form.watch('tags')?.split(',').map(item => item.trim()).filter(Boolean) || [];
    const selectedHouseRules = form.watch('house_rules')?.split(',').map(item => item.trim()).filter(Boolean) || [];

    const { data: propertiesResponse, isLoading: isLoadingProperties } = useQuery({
        queryKey: ['hostProperties'],
        queryFn: () => propertyService.getHostProperties(),
        enabled: !!user,
    });

    const properties = useMemo(() => propertiesResponse?.data ?? [], [propertiesResponse]);

    const createMutation = useMutation({
        mutationFn: async (payload: Partial<Listing>) => listingService.createListing(payload),
        onSuccess: (listing) => {
            toast({
                title: 'Listing created successfully!',
                description: `${listing.name} is now live and ready for bookings.`
            });
            queryClient.invalidateQueries({ queryKey: ['hostListings'] });
            navigate(`/host/listings/${listing.id}`);
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Failed to create listing';
            toast({
                variant: 'destructive',
                title: 'Unable to create listing',
                description: message
            });
        },
    });

    const handleOpenFilePicker = () => {
        if (remainingSlots <= 0) {
            toast({
                variant: 'destructive',
                title: 'Image limit reached',
                description: `You can only upload up to ${MAX_IMAGES} photos per listing.`,
            });
            return;
        }
        fileInputRef.current?.click();
    };

    const processFiles = async (selectedFiles: File[]) => {
        if (!selectedFiles.length) return;

        const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Unsupported files',
                description: 'Only PNG, JPG, or WEBP images are allowed.',
            });
            return;
        }

        if (imageFiles.length < selectedFiles.length) {
            toast({
                title: 'Some files were skipped',
                description: 'Only PNG, JPG, or WEBP images can be uploaded.',
            });
        }

        const currentImages = form.getValues('images') ?? [];
        const slotsLeft = Math.max(MAX_IMAGES - currentImages.length, 0);

        if (slotsLeft <= 0) {
            toast({
                variant: 'destructive',
                title: 'Image limit reached',
                description: `Remove an image before uploading new ones.`,
            });
            return;
        }

        const filesToUpload = imageFiles.slice(0, slotsLeft);
        setUploadingImages(true);
        try {
            const uploaded = await uploadService.uploadPropertyImages(filesToUpload);
            const urls = uploaded.map((file) => file.url);
            const updatedImages = form.getValues('images') ?? [];
            const nextImages = [...updatedImages, ...urls].slice(0, MAX_IMAGES);
            form.setValue('images', nextImages, { shouldDirty: true, shouldValidate: true });
            toast({
                title: 'Images added successfully!',
                description: `${urls.length} photo${urls.length === 1 ? '' : 's'} uploaded.`
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload images';
            toast({
                variant: 'destructive',
                title: 'Upload failed',
                description: message
            });
        } finally {
            setUploadingImages(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        await processFiles(files);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (uploadingImages) return;
        setIsDragActive(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragActive(false);
    };

    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (uploadingImages) return;
        setIsDragActive(false);
        const files = Array.from(event.dataTransfer?.files ?? []);
        await processFiles(files);
    };

    const handleRemoveImage = (index: number) => {
        const nextImages = images.filter((_, idx) => idx !== index);
        form.setValue('images', nextImages, { shouldDirty: true });
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

    const onSubmit = (values: ListingFormValues) => {
        const payload: Partial<Listing> = {
            name: values.name,
            property_id: values.property_id,
            description: values.description,
            price_per_night: values.price_per_night,
            max_guests: values.max_guests,
            bedrooms: values.bedrooms,
            bathrooms: values.bathrooms,
            category: values.category,
            amenities: values.amenities?.split(',').map((item) => item.trim()).filter(Boolean),
            house_rules: values.house_rules?.split(',').map((item) => item.trim()).filter(Boolean),
            tags: values.tags?.split(',').map((item) => item.trim()).filter(Boolean) as string[] | undefined,
            instant_book: values.instant_book,
            is_active: values.is_active,
            images: values.images,
        };

        createMutation.mutate(payload);
    };

    const propertyEmptyState = !isLoadingProperties && properties.length === 0;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="space-y-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/host/dashboard" className="flex items-center gap-1">
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
                            <BreadcrumbPage>New listing</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create your listing</h1>
                    <p className="text-muted-foreground">Share your space with travelers and start earning.</p>
                </div>
            </div>

            {propertyEmptyState && (
                <Alert variant="destructive">
                    <AlertDescription>
                        You need at least one property before creating listings.
                        <Link to="/host/properties/create" className="ml-2 font-semibold underline">
                            Add your first property
                        </Link>
                    </AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="basics" className="flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                Basics
                            </TabsTrigger>
                            <TabsTrigger value="details" className="flex items-center gap-2">
                                <Star className="h-4 w-4" />
                                Details
                            </TabsTrigger>
                            <TabsTrigger value="media" className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Photos
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Settings
                            </TabsTrigger>
                        </TabsList>

                        {/* Basics Tab */}
                        <TabsContent value="basics" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Home className="h-5 w-5" />
                                        Property Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Listing title</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Cozy beachfront apartment with stunning views"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Make it descriptive and appealing to guests
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="property_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Select property</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={propertyEmptyState}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={isLoadingProperties ? 'Loading properties...' : 'Choose your property'} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {properties.map((property: Property) => (
                                                            <SelectItem key={property.id} value={String(property.id)}>
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                                    {property.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <FormControl>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            {CATEGORIES.map((category) => {
                                                                const Icon = category.icon;
                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        key={category.value}
                                                                        onClick={() => field.onChange(category.value)}
                                                                        className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${field.value === category.value
                                                                                ? 'border-primary bg-primary/5'
                                                                                : 'border-muted hover:border-muted-foreground/50'
                                                                            }`}
                                                                    >
                                                                        <Icon className="h-6 w-6" />
                                                                        <span className="font-medium">{category.label}</span>
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

                                    <FormField
                                        control={form.control}
                                        name="price_per_night"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4" />
                                                    Price per night
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
                                                            <span className="text-muted-foreground">USD</span>
                                                        </div>
                                                        <Slider
                                                            value={[field.value]}
                                                            onValueChange={handlePriceChange}
                                                            max={1000}
                                                            step={10}
                                                            className="w-full"
                                                        />
                                                        <div className="flex justify-between text-sm text-muted-foreground">
                                                            <span>$10</span>
                                                            <span>$500</span>
                                                            <span>$1000+</span>
                                                        </div>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="max_guests"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    Maximum guests
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center gap-4">
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
                                                    <div className="flex items-center gap-4">
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
                                                    <div className="flex items-center gap-4">
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
                                </CardContent>
                            </Card>

                            <div className="flex justify-between">
                                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                                    Cancel
                                </Button>
                                <Button type="button" onClick={() => setActiveTab('details')}>
                                    Continue to Details
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Details Tab */}
                        <TabsContent value="details" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Description & Features</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>About your space</FormLabel>
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

                                    <FormField
                                        control={form.control}
                                        name="amenities"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Amenities</FormLabel>
                                                <FormDescription>
                                                    Select all that apply to your property
                                                </FormDescription>
                                                <FormControl>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                        {AMENITY_OPTIONS.map((amenity) => (
                                                            <Badge
                                                                key={amenity}
                                                                variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                                                                className="cursor-pointer py-2 px-3 text-sm"
                                                                onClick={() => toggleArrayItem(selectedAmenities, amenity, 'amenities')}
                                                            >
                                                                {selectedAmenities.includes(amenity) && <CheckCircle2 className="h-3 w-3 mr-1" />}
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
                                                <FormLabel>House rules</FormLabel>
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
                                                <FormLabel>Listing tags</FormLabel>
                                                <FormDescription>
                                                    Help guests find your property by adding relevant tags
                                                </FormDescription>
                                                <FormControl>
                                                    <div className="flex flex-wrap gap-2">
                                                        {TAG_OPTIONS.map((tag) => (
                                                            <Badge
                                                                key={tag}
                                                                variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                                                                className="cursor-pointer py-1 px-2"
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

                            <div className="flex justify-between">
                                <Button type="button" variant="outline" onClick={() => setActiveTab('basics')}>
                                    Back
                                </Button>
                                <Button type="button" onClick={() => setActiveTab('media')}>
                                    Continue to Photos
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Media Tab */}
                        <TabsContent value="media" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5" />
                                        Photos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />

                                    <div
                                        className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${isDragActive
                                                ? 'border-primary bg-primary/10 scale-[1.02]'
                                                : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                                            } ${uploadingImages ? 'opacity-70 pointer-events-none' : ''}`}
                                        onDragEnter={handleDragOver}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        role="presentation"
                                    >
                                        <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                                            <div className="rounded-full bg-primary/10 p-4">
                                                <ImageIcon className="h-8 w-8 text-primary" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="font-semibold text-lg">Add photos of your property</h3>
                                                <p className="text-muted-foreground text-sm">
                                                    Drag & drop images here or click to browse. High-quality photos help guests imagine their stay.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span>PNG, JPG, WEBP</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <XCircle className="h-4 w-4" />
                                                    <span>Max {MAX_IMAGES} photos</span>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                size="lg"
                                                onClick={handleOpenFilePicker}
                                                disabled={uploadingImages || remainingSlots <= 0}
                                                className="mt-4"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Choose photos
                                                {remainingSlots > 0 && ` (${remainingSlots} remaining)`}
                                            </Button>
                                            {uploadingImages && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Uploading your photos...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {images.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium">Your photos ({images.length}/{MAX_IMAGES})</h4>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleOpenFilePicker}
                                                    disabled={uploadingImages || remainingSlots <= 0}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add more
                                                </Button>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                {images.map((image, index) => (
                                                    <div key={`${image}-${index}`} className="group relative overflow-hidden rounded-lg border">
                                                        <AspectRatio ratio={4 / 3}>
                                                            <img
                                                                src={image}
                                                                alt={`Listing photo ${index + 1}`}
                                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                            />
                                                        </AspectRatio>
                                                        <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/20" />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveImage(index)}
                                                            className="absolute right-3 top-3 rounded-full bg-destructive/90 p-2 text-destructive-foreground opacity-0 transition-all hover:scale-110 group-hover:opacity-100"
                                                            aria-label="Remove image"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                        {index === 0 && (
                                                            <div className="absolute left-3 top-3">
                                                                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                                                                    Cover photo
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="flex justify-between">
                                <Button type="button" variant="outline" onClick={() => setActiveTab('details')}>
                                    Back
                                </Button>
                                <Button type="button" onClick={() => setActiveTab('settings')}>
                                    Continue to Settings
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Settings Tab */}
                        <TabsContent value="settings" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5" />
                                        Booking Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="instant_book"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-xl border p-6">
                                                <div className="space-y-1">
                                                    <FormLabel className="text-base">Instant booking</FormLabel>
                                                    <FormDescription>
                                                        Guests can book immediately without waiting for approval. Recommended for faster bookings.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="scale-125"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="is_active"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-xl border p-6">
                                                <div className="space-y-1">
                                                    <FormLabel className="text-base">Publish listing</FormLabel>
                                                    <FormDescription>
                                                        Make your listing visible to guests and available for booking.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="scale-125"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <div className="rounded-lg bg-muted/50 p-6">
                                <h4 className="font-semibold mb-2">Ready to publish?</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Review your information and click publish to make your listing live.
                                </p>
                                <div className="flex items-center gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setActiveTab('media')}
                                    >
                                        Back to photos
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={createMutation.isPending || propertyEmptyState}
                                        className="flex-1"
                                    >
                                        {createMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Publishing...
                                            </>
                                        ) : (
                                            'Publish listing'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </form>
            </Form>
        </div>
    );
};

export default HostCreateListing;