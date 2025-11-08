import React, { useState, useEffect, useRef } from 'react';
import { Facebook, Twitter, Instagram, Home, MapPin, Building, Check, Mail, Phone, MessageSquare, MessageCircle } from 'lucide-react';
import '../styles/CommingSoonPage.css';

const ComingSoonPage = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showEmailInput, setShowEmailInput] = useState(false);

    const largeGearRef = useRef(null);
    const mediumGearRef = useRef(null);
    const smallGearRef = useRef(null);

    useEffect(() => {
        const largeGear = largeGearRef.current;
        const mediumGear = mediumGearRef.current;
        const smallGear = smallGearRef.current;

        let rotation = 0;
        let animationFrameId;

        const animateGears = () => {
            rotation += 1;

            if (largeGear) largeGear.style.transform = `rotate(${rotation}deg)`;
            if (mediumGear) mediumGear.style.transform = `rotate(${-rotation * 1.3}deg)`;
            if (smallGear) smallGear.style.transform = `rotate(${rotation * 0.8}deg)`;

            animationFrameId = requestAnimationFrame(animateGears);
        };

        animateGears();

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
        }, 1500);
    };

    const handleSubscribeClick = () => {
        setShowEmailInput(true);
    };

    return (
        <div className="coming-soon-container">
            {/* Background with subtle animation */}
            <div className="background-animation">
                <div className="floating-shape shape-1"></div>
                <div className="floating-shape shape-2"></div>
                <div className="floating-shape shape-3"></div>
            </div>

            {/* Header with wordmark */}
            <header className="header">
                <div className="wordmark">
                    <span className="wordmark-cava">Cava</span>
                    <span className="wordmark-yo">Yo</span>
                </div>
                <div className="coming-soon-hint">Coming Soon</div>
            </header>

            {/* Main pill card */}
            <div className="pill-card">
                {/* Animated construction gear */}
                <div className="construction-section">
                    <div className="gear-container">
                        <svg ref={largeGearRef} className="large-gear" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                            <g transform="translate(0,500) scale(0.1,-0.1)" stroke="none">
                                <path d="M2361 3474 c-16 -21 -21 -41 -21 -90 0 -83 -17 -102 -145 -154 -123
                                    -51 -147 -49 -216 15 -70 66 -85 63 -186 -38 -102 -102 -104 -114 -33 -192 34
                                    -38 50 -64 50 -83 0 -15 -19 -74 -42 -131 -51 -123 -71 -141 -159 -141 -42 0
                                    -63 -5 -83 -21 -25 -20 -26 -23 -26 -134 0 -147 6 -155 112 -164 53 -4 82 -12
                                    96 -25 11 -10 39 -65 62 -122 51 -125 49 -146 -15 -215 -66 -70 -63 -85 39
                                    -187 79 -79 87 -84 117 -78 18 3 53 26 80 51 35 33 56 45 79 45 47 0 211 -68
                                    243 -101 24 -26 27 -37 27 -95 0 -56 3 -68 25 -89 23 -24 31 -25 133 -25 143
                                    0 153 6 161 113 8 96 18 107 143 158 126 52 144 51 214 -12 73 -66 94 -63 182
                                    24 107 105 111 128 36 209 -56 60 -56 83 -5 206 51 125 62 135 158 143 107 8
                                    113 18 113 161 0 102 -1 110 -25 133 -21 21 -33 25 -88 25 -87 0 -104 15 -156
                                    139 -52 126 -52 149 -2 204 81 88 78 107 -29 211 -95 93 -110 95 -179 31 -69
                                    -64 -90 -66 -215 -15 -57 23 -112 51 -122 62 -13 14 -21 43 -25 96 -9 106 -17
                                    112 -164 112 -111 0 -114 -1 -134 -26z m311 -602 c210 -103 296 -353 191 -560
                                    -37 -74 -136 -164 -210 -192 -209 -79 -431 9 -527 210 -29 60 -31 73 -31 170
                                    0 97 2 110 32 172 51 108 140 185 258 225 25 8 75 12 131 10 79 -2 100 -7 156
                                    -35z"/>
                            </g>
                        </svg>

                        <div className="small-gears">
                            <svg ref={mediumGearRef} className="medium-gear" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                                <g transform="translate(0,500) scale(0.1,-0.1)" stroke="none">
                                    <path d="M2361 3474 c-16 -21 -21 -41 -21 -90 0 -83 -17 -102 -145 -154 -123
                                        -51 -147 -49 -216 15 -70 66 -85 63 -186 -38 -102 -102 -104 -114 -33 -192 34
                                        -38 50 -64 50 -83 0 -15 -19 -74 -42 -131 -51 -123 -71 -141 -159 -141 -42 0
                                        -63 -5 -83 -21 -25 -20 -26 -23 -26 -134 0 -147 6 -155 112 -164 53 -4 82 -12
                                        96 -25 11 -10 39 -65 62 -122 51 -125 49 -146 -15 -215 -66 -70 -63 -85 39
                                        -187 79 -79 87 -84 117 -78 18 3 53 26 80 51 35 33 56 45 79 45 47 0 211 -68
                                        243 -101 24 -26 27 -37 27 -95 0 -56 3 -68 25 -89 23 -24 31 -25 133 -25 143
                                        0 153 6 161 113 8 96 18 107 143 158 126 52 144 51 214 -12 73 -66 94 -63 182
                                        24 107 105 111 128 36 209 -56 60 -56 83 -5 206 51 125 62 135 158 143 107 8
                                        113 18 113 161 0 102 -1 110 -25 133 -21 21 -33 25 -88 25 -87 0 -104 15 -156
                                        139 -52 126 -52 149 -2 204 81 88 78 107 -29 211 -95 93 -110 95 -179 31 -69
                                        -64 -90 -66 -215 -15 -57 23 -112 51 -122 62 -13 14 -21 43 -25 96 -9 106 -17
                                        112 -164 112 -111 0 -114 -1 -134 -26z m311 -602 c210 -103 296 -353 191 -560
                                        -37 -74 -136 -164 -210 -192 -209 -79 -431 9 -527 210 -29 60 -31 73 -31 170
                                        0 97 2 110 32 172 51 108 140 185 258 225 25 8 75 12 131 10 79 -2 100 -7 156
                                        -35z"/>
                                </g>
                            </svg>

                            <svg ref={smallGearRef} className="small-gear" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                                <g transform="translate(0,500) scale(0.1,-0.1)" stroke="none">
                                    <path d="M2361 3474 c-16 -21 -21 -41 -21 -90 0 -83 -17 -102 -145 -154 -123
                                        -51 -147 -49 -216 15 -70 66 -85 63 -186 -38 -102 -102 -104 -114 -33 -192 34
                                        -38 50 -64 50 -83 0 -15 -19 -74 -42 -131 -51 -123 -71 -141 -159 -141 -42 0
                                        -63 -5 -83 -21 -25 -20 -26 -23 -26 -134 0 -147 6 -155 112 -164 53 -4 82 -12
                                        96 -25 11 -10 39 -65 62 -122 51 -125 49 -146 -15 -215 -66 -70 -63 -85 39
                                        -187 79 -79 87 -84 117 -78 18 3 53 26 80 51 35 33 56 45 79 45 47 0 211 -68
                                        243 -101 24 -26 27 -37 27 -95 0 -56 3 -68 25 -89 23 -24 31 -25 133 -25 143
                                        0 153 6 161 113 8 96 18 107 143 158 126 52 144 51 214 -12 73 -66 94 -63 182
                                        24 107 105 111 128 36 209 -56 60 -56 83 -5 206 51 125 62 135 158 143 107 8
                                        113 18 113 161 0 102 -1 110 -25 133 -21 21 -33 25 -88 25 -87 0 -104 15 -156
                                        139 -52 126 -52 149 -2 204 81 88 78 107 -29 211 -95 93 -110 95 -179 31 -69
                                        -64 -90 -66 -215 -15 -57 23 -112 51 -122 62 -13 14 -21 43 -25 96 -9 106 -17
                                        112 -164 112 -111 0 -114 -1 -134 -26z m311 -602 c210 -103 296 -353 191 -560
                                        -37 -74 -136 -164 -210 -192 -209 -79 -431 9 -527 210 -29 60 -31 73 -31 170
                                        0 97 2 110 32 172 51 108 140 185 258 225 25 8 75 12 131 10 79 -2 100 -7 156
                                        -35z"/>
                                </g>
                            </svg>
                        </div>
                    </div>
                    <div className="construction-text">
                        <p>Stay tuned, we are working hard to bring you something special!</p>
                    </div>
                </div>

                {/* Content section */}
                <div className="card-content">
                    <h2 className="tagline">
                        Your spot is your <span className="cava-highlight">Cava</span>.
                    </h2>

                    <p className="description">
                        Discover premium short-term rentals and exclusive residences across all regions in Uganda.
                    </p>

                    {/* Subscription form */}
                    {!submitted ? (
                        <div className="subscription-section">
                            {!showEmailInput ? (
                                <button
                                    className="subscribe-trigger"
                                    onClick={handleSubscribeClick}
                                >
                                    Get Notified at Launch
                                    <span className="elegant-arrow">››</span>
                                </button>
                            ) : (
                                <form className="cta-form" onSubmit={handleSubmit}>
                                    <div className="input-container">
                                        <input
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="email-input"
                                        />
                                        <button
                                            type="submit"
                                            className={`submit-btn ${loading ? 'loading' : ''}`}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <div className="spinner"></div>
                                            ) : (
                                                'Notify Me'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div className="success-message">
                            <div className="success-icon">
                                <Check size={24} />
                            </div>
                            <h3>Thank you for subscribing!</h3>
                            <p>We'll notify you as soon as we launch.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Features section outside the pill card */}
            <div className="features-section">
                <div className="features-container">
                    <div className="feature-item">
                        <div className="feature-icon">
                            <Home size={32} />
                        </div>
                        <span>Premium Rentals</span>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">
                            <MapPin size={32} />
                        </div>
                        <span>Prime Locations</span>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M19.4 15C19.2662 15.9248 18.9628 16.8163 18.5061 17.6267C18.0494 18.4371 17.4482 19.1503 16.736 19.7267C16.0239 20.303 15.2146 20.7315 14.3536 20.9894C13.4926 21.2473 12.5971 21.3299 11.7119 21.233C10.8267 21.1361 9.96933 20.8617 9.18991 20.4251C8.41049 19.9885 7.72487 19.3984 7.17253 18.6899C6.62019 17.9814 6.21217 17.169 5.97299 16.3005C5.73381 15.432 5.66841 14.5251 5.78061 13.6321C5.89282 12.7391 6.18026 11.8786 6.62564 11.1019C7.07102 10.3252 7.66505 9.64847 8.36999 9.11333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 4.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span>Exclusive Residences</span>
                    </div>
                </div>
            </div>

            {/* Rich footer */}
            <footer className="footer">
                <div className="footer-content">
                    {/* Brand Section */}
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <span className="footer-cava">Cava</span>
                            <span className="footer-yo">Yo</span>
                        </div>
                        <p className="footer-motto">We reserve you the Most Chill stays.</p>
                    </div>

                    {/* Contact Information */}
                    <div className="footer-contact">
                        <h4 className="contact-heading">Get in Touch</h4>
                        <div className="contact-methods">
                            <a href="mailto:info@yocava.com" className="contact-item">
                                <Mail size={16} />
                                <span>info@yocava.com</span>
                            </a>
                            <div className="contact-item">
                                <Phone size={16} />
                                <div className="phone-numbers">
                                    <span>+256 763 977921</span>
                                    <span>+256 708 964971</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="footer-social">
                        <h4 className="social-heading">Lets Connect</h4>
                        <div className="social-links">
                            <a href="mailto:info@yocava.com" className="social-link" aria-label="Email">
                                <Mail size={18} />
                            </a>
                            <a href="https://wa.me/256763977921?text=Hi%20there%2C%20I'm%20interested%20in%20CavaYo%20launch%20updates"
                                className="social-link"
                                aria-label="WhatsApp">
                                <MessageCircle size={18} />
                            </a>
                            <a href="#" className="social-link" aria-label="Twitter">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="social-link" aria-label="Instagram">
                                <Instagram size={18} />
                            </a>
                        </div>
                        <p className="social-note">Stay updated with our latest news and progress!</p>
                        
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} CavaYo. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default ComingSoonPage;