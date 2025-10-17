import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ImageCarouselPreviewProps {
  images: string[];
  onRemoveImage: (index: number) => void;
  onAddHashtag: (tag: string) => void;
}

const suggestedTags = ['#InstaDaily', '#PhotoDump', '#LifeInTiles', '#CapturedMoments', '#EverydayVibes'];

const ImageCarouselPreview: React.FC<ImageCarouselPreviewProps> = ({ images, onRemoveImage, onAddHashtag }) => {
  if (images.length === 0) return null;

  return (
    <div className="my-2 sm:my-3 lg:my-4 w-full min-w-0">
      <Carousel className="w-full">
        <CarouselContent className="-ml-0.5 sm:-ml-1">
          {images.map((image, index) => (
            <CarouselItem key={index} className="pl-0.5 sm:pl-1 basis-full sm:basis-4/5 md:basis-3/5">
              <div className="relative group">
                <div className="relative aspect-square max-h-48 sm:max-h-64 lg:max-h-80">
                  <img
                    src={image}
                    alt={`Captured ${index + 1}`}
                    className="w-full h-full object-cover rounded-md sm:rounded-lg border"
                    style={{ aspectRatio: 'auto' }}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      const container = img.parentElement;
                      if (container) {
                        const isLandscape = img.naturalWidth > img.naturalHeight;
                        container.style.aspectRatio = isLandscape ? '4/3' : '3/4';
                      }
                    }}
                  />
                  
                  {/* Remove button - Touch-friendly on mobile */}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-destructive/80 border-0"
                    onClick={() => onRemoveImage(index)}
                  >
                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" />
                  </Button>
                  
                  {/* Image counter - Responsive sizing */}
                  <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-black/60 text-white px-1 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs leading-tight">
                    {index + 1} / {images.length}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation arrows - Hide on very small screens */}
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-1 sm:left-2 h-6 w-6 sm:h-8 sm:w-8 hidden xs:flex" />
            <CarouselNext className="right-1 sm:right-2 h-6 w-6 sm:h-8 sm:w-8 hidden xs:flex" />
          </>
        )}
      </Carousel>

      {/* Hashtags - Responsive layout */}
      <div className="mt-2 sm:mt-3 flex flex-wrap gap-0.5 sm:gap-1">
        {suggestedTags.slice(0, 3).map(tag => (
          <Button
            key={tag}
            variant="outline"
            size="sm"
            className="h-5 sm:h-6 text-[9px] sm:text-xs px-1 sm:px-2 leading-tight border-muted"
            onClick={() => onAddHashtag(tag)}
          >
            {tag}
          </Button>
        ))}
        
        {/* Show remaining tags on larger screens */}
        <div className="hidden sm:contents">
          {suggestedTags.slice(3).map(tag => (
            <Button
              key={tag}
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2 leading-tight border-muted"
              onClick={() => onAddHashtag(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
        
        {/* "More" indicator on small screens */}
        {suggestedTags.length > 3 && (
          <Button
            variant="outline"
            size="sm"
            className="h-5 text-[9px] px-1 leading-tight border-muted sm:hidden"
            disabled
          >
            +{suggestedTags.length - 3}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ImageCarouselPreview;