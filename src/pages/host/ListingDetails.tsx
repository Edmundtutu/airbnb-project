import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Home, MapPin, DollarSign } from 'lucide-react';
import { listingService } from '@/services/listingService';
import { bookingService } from '@/services/bookingService';
import type { Listing } from '@/types/listings';
import type { ListingReservation } from '@/types/bookings';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import ImageManager from '@/components/host/listings/ImageManager';
import BookingSummaryCard from '@/components/host/listings/BookingSummaryCard';

const detailSchema = z.object({
    name: z.string().min(3),
    description: z.string().min(20),
    price_per_night: z.coerce.number().min(10),
    category: z.string().min(1),
    max_guests: z.coerce.number().min(1),
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

const HostListingDetails: React.FC = () => {
    const { listingId } = useParams<{ listingId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

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
            toast({ title: 'Listing updated', description: `${updated.name} looks good.` });
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Failed to update listing';
            toast({ title: 'Update failed', description: message, variant: 'destructive' });
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

    const propertyName = useMemo(() => listing?.property?.name ?? 'Property', [listing]);
    const propertyAddress = useMemo(() => listing?.property?.location?.address ?? 'Address unavailable', [listing]);

    const renderContent = () => {
        if (isLoadingListing) {
            return (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            );
        }

        if (isListingError || !listing) {
            return (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Unable to load this listing.</p>
                        <Button className="mt-4" onClick={() => navigate('/host/listings')}>
                            Back to listings
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                    <section className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Listing details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
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
                                                <Textarea rows={5} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="price_per_night"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nightly rate</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={10} {...field} />
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
                                                    <Input placeholder="luxury, remote, city" {...field} />
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
                                                <FormLabel>Guests</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={1} {...field} />
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

                                <FormField
                                    control={form.control}
                                    name="amenities"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amenities</FormLabel>
                                            <FormDescription>Comma separated list.</FormDescription>
                                            <FormControl>
                                                <Input {...field} />
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
                                                <Input {...field} />
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
                                                <Input placeholder="Romantic, Remote" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-base">Status</CardTitle>
                                    <Badge variant={listing.is_active ? 'default' : 'secondary'}>
                                        {listing.is_active ? 'Active' : 'Hidden'}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="text-sm font-medium">Visible to guests</p>
                                            <p className="text-xs text-muted-foreground">Toggle availability instantly.</p>
                                        </div>
                                        <Switch
                                            checked={form.getValues('is_active')}
                                            onCheckedChange={(checked) => {
                                                form.setValue('is_active', checked, { shouldDirty: true });
                                                handleToggle('is_active', checked);
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="text-sm font-medium">Instant book</p>
                                            <p className="text-xs text-muted-foreground">Skip approval for qualified guests.</p>
                                        </div>
                                        <Switch
                                            checked={form.getValues('instant_book')}
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
                                    <CardTitle>Property</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Home className="h-4 w-4" />
                                        <span>{propertyName}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="mt-0.5 h-4 w-4" />
                                        <span>{propertyAddress}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        <span>{listing.price_per_night.toLocaleString()} per night</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    <ImageManager
                        images={listing.images}
                        onUpdate={(nextImages) => updateMutation.mutateAsync({ images: nextImages })}
                        isUpdating={updateMutation.isPending}
                    />

                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => navigate('/host/listings')}>
                            Back
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save changes
                        </Button>
                    </div>
                </form>
            </Form>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
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
                            <BreadcrumbPage>{listing?.name ?? 'Details'}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{listing?.name ?? 'Listing'}</h1>
                        <p className="text-muted-foreground">Fine tune photos, pricing, and availability.</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/host/listings')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to listings
                    </Button>
                </div>
            </div>

            {renderContent()}

            <Separator />

            <section className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Bookings</h2>
                        <p className="text-sm text-muted-foreground">Recent reservations tied to this listing.</p>
                    </div>
                </div>
                {isLoadingReservations ? (
                    <div className="flex min-h-[200px] items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                ) : reservations.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            No bookings yet. Share your listing to attract your first guests.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {reservations.map((reservation: ListingReservation) => (
                            <BookingSummaryCard key={reservation.id} reservation={reservation} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default HostListingDetails;
