import React from 'react';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                {/* Logo matching Navbar */}
                <div className="text-4xl md:text-5xl font-bold text-brand-dark-green mb-4">
                    Connect<span className="text-brand-lime">US</span>
                </div>
                {/* Optional spinner or just the pulsing logo */}
                <div className="w-12 h-12 border-4 border-brand-lime border-t-brand-dark-green rounded-full animate-spin"></div>
            </div>
        </div>
    );
};

export default LoadingScreen;
