import React, { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-md shadow-lg z-50 border-b border-gray-600 font-mono">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <span className="text-xl font-bold text-white tracking-wider">
              [ CONNECT<span className="text-gray-400">.US</span> ]
            </span>
            <span className="text-gray-600 text-xs ml-4">v2.1.7</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-wider">
              INICIO
            </a>
            <a href="#about" className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-wider">
              NOSOTROS
            </a>
            <a href="#team" className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-wider">
              EQUIPO
            </a>
            <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-wider">
              DATOS
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-gray-400 focus:outline-none font-mono"
            >
              <span className="text-xl">{isOpen ? '[ X ]' : '[ ≡ ]'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 bg-black/95 backdrop-blur-xl border-t border-gray-600 absolute left-0 right-0 px-8 shadow-xl">
            <div className="flex flex-col space-y-3 pt-4">
              <a href="#home" className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-wider py-2 border-b border-gray-700">
                &gt; INICIO
              </a>
              <a href="#about" className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-wider py-2 border-b border-gray-700">
                &gt; NOSOTROS
              </a>
              <a href="#team" className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-wider py-2 border-b border-gray-700">
                &gt; EQUIPO
              </a>
              <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-wider py-2 border-b border-gray-700">
                &gt; DATOS
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
