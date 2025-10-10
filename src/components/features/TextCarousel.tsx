import React, { useState, useEffect } from 'react';

interface TextCarouselProps {
    texts: string[];
    className?: string;
    interval?: number; // Duration in milliseconds for each text
    transitionDuration?: number; // Duration of fade transition
}

export const TextCarousel: React.FC<TextCarouselProps> = ({
    texts,
    className = '',
    interval = 3000,
    transitionDuration = 500,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (texts.length <= 1) return;

        const timer = setInterval(() => {
            // Start fade out
            setIsVisible(false);

            // After fade out completes, change text and fade in
            setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
                setIsVisible(true);
            }, transitionDuration);
        }, interval);

        return () => clearInterval(timer);
    }, [texts.length, interval, transitionDuration]);

    if (!texts || texts.length === 0) {
        return null;
    }

    return (
        <>
            <div
                className={`transition-opacity duration-${transitionDuration} ${isVisible ? 'opacity-100' : 'opacity-0'
                    } ${className}`}
                style={{
                    transitionDuration: `${transitionDuration}ms`,
                }}
                >
                    <div className= 'text-center'>
                        {texts[currentIndex]}
                    </div>
            </div>
            <div className="flex justify-center mt-3 space-x-2">
                {texts.map((_, index) => (
                <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                />
                ))}
            </div>
        </>
    );
};