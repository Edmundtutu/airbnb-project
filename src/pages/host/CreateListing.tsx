import React, { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react';
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

const HostCreateListing: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user } = useAuth();
    const [uploadingImages, setUploadingImages] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_IMAGES = 10;

    const form = useForm<ListingFormValues>({
        resolver: zodResolver(listingSchema),
        defaultValues,
    });
    const images = form.watch('images') ?? [];
    const remainingSlots = Math.max(MAX_IMAGES - images.length, 0);

    const { data: propertiesResponse, isLoading: isLoadingProperties } = useQuery({
        queryKey: ['hostProperties', user?.id],
        queryFn: () => propertyService.getProperties({ host_id: user?.id }),
        enabled: Boolean(user?.id),
    });

    const properties = useMemo(() => propertiesResponse?.data ?? [], [propertiesResponse]);

    const createMutation = useMutation({
        mutationFn: async (payload: Partial<Listing>) => listingService.createListing(payload),
        onSuccess: (listing) => {
            toast({ title: 'Listing created', description: `${listing.name} is live in your portfolio.` });
            queryClient.invalidateQueries({ queryKey: ['hostListings'] });
            navigate(`/host/listings/${listing.id}`);
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Failed to create listing';
            toast({ variant: 'destructive', title: 'Unable to create listing', description: message });
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
            toast({ title: 'Images added', description: `${urls.length} photo${urls.length === 1 ? '' : 's'} uploaded.` });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload images';
            toast({ variant: 'destructive', title: 'Upload failed', description: message });
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
        <div className="space-y-8">
            <div className="space-y-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/host/dashboard">Host</Link>
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
                    <h1 className="text-3xl font-bold tracking-tight">Create a new listing</h1>
                    <p className="text-muted-foreground">Describe your space, set availability, and start earning.</p>
                </div>
            </div>

            {propertyEmptyState && (
                <Alert variant="destructive">
                    <AlertDescription>
                        You need at least one property before creating listings. Add a property first in the host profile section.
                    </AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basics</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Listing name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Beachfront loft" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="property_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Property</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={propertyEmptyState}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isLoadingProperties ? 'Loading properties...' : 'Select property'} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {properties.map((property: Property) => (
                                                    <SelectItem key={property.id} value={String(property.id)}>
                                                        {property.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="general">General</SelectItem>
                                                <SelectItem value="luxury">Luxury</SelectItem>
                                                <SelectItem value="adventure">Adventure</SelectItem>
                                                <SelectItem value="business">Business</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="price_per_night"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nightly price (USD)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={10} {...field} />
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
                                        <FormLabel>Max guests</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={1} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-6 md:grid-cols-2 md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="bedrooms"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bedrooms</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={0} {...field} />
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
                                            <FormLabel>Bathrooms</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={0} step="0.5" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>About this space</FormLabel>
                                        <FormControl>
                                            <Textarea rows={5} placeholder="Highlight unique amenities, nearby attractions, and house style." {...field} />
                                        </FormControl>
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
                                        <FormDescription>Separate items with commas (Wi-Fi, Pool, Workspace).</FormDescription>
                                        <FormControl>
                                            <Input placeholder="Wi-Fi, Pool, Workspace" {...field} />
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
                                        <FormControl>
                                            <Input placeholder="No parties, No smoking" {...field} />
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
                                        <FormLabel>Tags</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Romantic, Remote, Pet-friendly" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Media</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <div
                                className={`rounded-lg border border-dashed p-6 text-center transition-colors ${
                                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
                                } ${uploadingImages ? 'opacity-70' : ''}`}
                                onDragEnter={handleDragOver}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                role="presentation"
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <p className="font-medium text-foreground">Drag & drop images here</p>
                                        <p>
                                            or click below to browse. {remainingSlots} slot{remainingSlots === 1 ? '' : 's'} remaining (max {MAX_IMAGES}).
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleOpenFilePicker}
                                        disabled={uploadingImages || remainingSlots <= 0 || createMutation.isPending}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Browse files
                                    </Button>
                                    {uploadingImages && (
                                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Uploading photos…
                                        </p>
                                    )}
                                </div>
                            </div>
                            {images.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                                    <ImageIcon className="mb-3 h-8 w-8" />
                                    <p>Add at least one photo to help guests discover your listing.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-3">
                                    {images.map((image, index) => (
                                        <div key={`${image}-${index}`} className="group relative overflow-hidden rounded-lg border">
                                            <AspectRatio ratio={16 / 9}>
                                                <img src={image} alt={`Listing preview ${index + 1}`} className="h-full w-full object-cover" />
                                            </AspectRatio>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                aria-label="Remove image"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="instant_book"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <FormLabel>Instant book</FormLabel>
                                            <FormDescription>Guests can confirm without waiting for approval.</FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="is_active"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <FormLabel>Listing visibility</FormLabel>
                                            <FormDescription>Keep this on to show the listing in search.</FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending || propertyEmptyState}>
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Publish listing
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default HostCreateListing;
