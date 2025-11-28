import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Alert, AlertDescription } from '@/components/ui/alert';
import uploadService from '@/services/uploadService';

interface ImageManagerProps {
  images?: string[];
  onUpdate: (nextImages: string[]) => Promise<void> | void;
  isUpdating?: boolean;
  title?: string;
  maxImages?: number;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unexpected error while updating images.';
};

const ImageManager: React.FC<ImageManagerProps> = ({
  images = [],
  onUpdate,
  isUpdating = false,
  title = 'Listing gallery',
  maxImages = 10,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [optimisticImages, setOptimisticImages] = useState<string[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const gallery = useMemo(() => optimisticImages ?? images, [optimisticImages, images]);
  const remainingSlots = Math.max(maxImages - gallery.length, 0);

  useEffect(() => {
    setOptimisticImages(null);
  }, [images]);

  const handleRemoveImage = async (index: number) => {
    const nextImages = gallery.filter((_, idx) => idx !== index);
    setLocalError(null);
    setOptimisticImages(nextImages);
    try {
      await onUpdate(nextImages);
    } catch (error) {
      setLocalError(getErrorMessage(error));
      setOptimisticImages(null);
    }
  };

  const processFiles = async (selectedFiles: File[]) => {
    if (!selectedFiles.length) return;

    if (remainingSlots <= 0) {
      setLocalError(`Maximum of ${maxImages} images reached.`);
      return;
    }

    const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setLocalError('Only PNG, JPG, or WEBP images can be uploaded.');
      return;
    }

    if (imageFiles.length < selectedFiles.length) {
      setLocalError('Some files were skipped because they are not supported.');
    } else {
      setLocalError(null);
    }

    const filesToUpload = imageFiles.slice(0, remainingSlots);
    setIsUploading(true);
    try {
      const uploaded = await uploadService.uploadPropertyImages(filesToUpload);
      const urls = uploaded.map((file) => file.url);
      const nextImages = [...gallery, ...urls].slice(0, maxImages);
      setOptimisticImages(nextImages);
      await onUpdate(nextImages);
    } catch (error) {
      setLocalError(getErrorMessage(error));
      setOptimisticImages(null);
    } finally {
      setIsUploading(false);
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
    if (isUpdating || isUploading) return;
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
    if (isUpdating || isUploading) return;
    setIsDragActive(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    await processFiles(files);
  };

  const triggerFilePicker = () => {
    if (isUpdating || isUploading) return;
    if (remainingSlots <= 0) {
      setLocalError(`Maximum of ${maxImages} images reached.`);
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload, reorder, or remove media to keep your listing fresh.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button size="sm" onClick={triggerFilePicker} disabled={isUpdating || isUploading || remainingSlots <= 0}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Upload images
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {localError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{localError}</AlertDescription>
          </Alert>
        )}
        <div
          className={`mb-4 rounded-lg border border-dashed p-4 text-center text-sm transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
          } ${isUploading ? 'opacity-70' : ''}`}
          onDragEnter={handleDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="presentation"
        >
          <p className="font-medium text-foreground">Drag & drop images here</p>
          <p className="mt-1 text-xs text-muted-foreground">
            or use the button above. {remainingSlots} slot{remainingSlots === 1 ? '' : 's'} remaining (max {maxImages}).
          </p>
          {isUploading && (
            <p className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Uploading photos…
            </p>
          )}
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          {gallery.length}/{maxImages} images used · {remainingSlots} remaining
        </p>
        {gallery.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center text-muted-foreground">
            <ImageIcon className="mb-3 h-8 w-8" />
            <p>No images yet. Add your first photo to showcase the space.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px] pr-4">
            <div className="grid gap-4 md:grid-cols-2">
              {gallery.map((image, index) => (
                <div key={`${image}-${index}`} className="group relative overflow-hidden rounded-lg border">
                  <AspectRatio ratio={16 / 9}>
                    <img
                      src={image}
                      alt="Listing"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </AspectRatio>
                  <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="truncate text-xs font-medium text-white/80">{image}</span>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => handleRemoveImage(index)}
                      disabled={isUpdating || isUploading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageManager;
