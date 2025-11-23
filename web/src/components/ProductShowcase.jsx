import React, { Suspense } from 'react';
import SplatViewer from './SplatViewer';

const ProductShowcase = () => {
    return (
        <section className="py-24 bg-black relative overflow-hidden font-mono">
            {/* Technical Grid Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div 
                    className="w-full h-full"
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, #333 1px, transparent 1px),
                            linear-gradient(to bottom, #333 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            {/* Technical System Info */}
            <div className="absolute top-8 left-8 text-gray-400 text-xs font-mono z-20">
                <div>3D_RENDERER.exe</div>
                <div>VERSION: v3.2.1</div>
                <div>ENGINE: SPLAT_VIEWER</div>
                <div>STATUS: RENDERING</div>
            </div>

            <div className="absolute top-8 right-8 text-gray-400 text-xs font-mono z-20">
                <div>RESOLUTION: 4K</div>
                <div>FPS: 60</div>
                <div>QUALITY: HIGH</div>
            </div>

            <div className="max-w-7xl mx-auto px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="text-gray-500 text-xs font-mono mb-8">
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 uppercase tracking-wider">
                        EXPERIMENTA.EL.FUTURO
                    </h2>

                    <div className="text-gray-500 text-sm font-mono mb-8">
                        <div>════════════════════════════════════════════════════════════════════</div>
                    </div>

                    <p className="text-lg text-gray-300 max-w-4xl mx-auto uppercase tracking-wide leading-relaxed">
                        &gt; NUESTRAS GAFAS INTELIGENTES SE INTEGRAN PERFECTAMENTE CON TU<br />
                        &gt; VIDA DIGITAL, AYUDÁNDOTE A CONECTAR CON EL MUNDO<br />
                        &gt; QUE TE RODEA. INTERACTÚA CON EL MODELO 3D PARA EXPLORAR.
                    </p>
                </div>

                <div className="relative">
                    {/* 3D Viewer Container - Technical Frame */}
                    <div className="w-full max-w-5xl mx-auto aspect-[4/3] border border-gray-600 bg-black relative z-10 overflow-hidden">
                        {/* Corner markers */}
                        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-white z-20"></div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-white z-20"></div>
                        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-white z-20"></div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-white z-20"></div>
                        
                        {/* Technical Labels */}
                        <div className="absolute top-4 left-4 text-gray-400 text-xs font-mono z-20">
                            <div>[3D_MODEL]</div>
                            <div>LOADING...</div>
                        </div>
                        
                        <div className="absolute top-4 right-4 text-gray-400 text-xs font-mono z-20">
                            <div>INTERACTIVE: YES</div>
                            <div>POLYGONS: 247K</div>
                        </div>
                        
                        <Suspense fallback={
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                <div className="text-center">
                                    <div className="border-2 border-white w-12 h-12 border-t-transparent animate-spin mx-auto mb-4"></div>
                                    <div className="text-xs font-mono uppercase">CARGANDO_MODELO_3D...</div>
                                    <div className="text-xs font-mono text-gray-400 mt-2">POR_FAVOR_ESPERE</div>
                                </div>
                            </div>
                        }>
                            <SplatViewer />
                        </Suspense>

                        {/* Controls Info */}
                        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-10">
                            <div className="bg-black/80 border border-gray-600 inline-block px-6 py-2 font-mono text-xs text-gray-400 uppercase">
                                [ ARRASTRA_PARA_ROTAR ] | [ DESLIZA_PARA_ZOOM ]
                            </div>
                        </div>
                        
                        {/* Coordinate Grid Overlay */}
                        <div className="absolute bottom-4 left-4 text-gray-600 text-xs font-mono z-20">
                            <div>X: 0.00</div>
                            <div>Y: 0.00</div>
                            <div>Z: 0.00</div>
                        </div>
                    </div>
                    
                    {/* Technical Specs */}
                    <div className="mt-8 text-center text-gray-500 text-xs font-mono">
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductShowcase;
