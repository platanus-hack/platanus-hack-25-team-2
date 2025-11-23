import React from 'react';

const Hero = () => {
  return (
    <section className="relative bg-black min-h-screen flex items-center justify-center overflow-hidden pt-16 font-mono">
      {/* Technical Grid Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, #333 1px, transparent 1px),
              linear-gradient(to bottom, #333 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        {/* Grid intersection points */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 40px 40px, #666 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Technical System Info Header */}
      <div className="absolute top-20 left-4 text-gray-400 text-xs font-mono z-20">
        <div>SYSTEM.STATUS: ACTIVE</div>
        <div>VERSION: v2.1.7</div>
        <div>LAT: 40.7128° N</div>
        <div>LONG: 74.0060° W</div>
        <div>UPTIME: 99.97%</div>
      </div>

      {/* Technical System Info Footer */}
      <div className="absolute bottom-4 right-4 text-gray-400 text-xs font-mono z-20">
        <div>NETWORK.STATUS: ONLINE</div>
        <div>CONNECTIONS: 1,247,832</div>
        <div>RESPONSE_TIME: 12ms</div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-20">
        {/* ASCII Art Header */}
        <div className="text-center mb-16">
          <div className="text-gray-500 text-xs font-mono mb-8 max-w-4xl mx-auto">
            <pre>{`
    ╔════════════════════════════════════════════════════════════════╗
    ║                         NETWORK_PROTOCOL.exe                   ║
    ╚════════════════════════════════════════════════════════════════╝
            `}</pre>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-mono font-bold text-white mb-2 tracking-wider leading-tight">
            CONECTA.COMO
          </h1>
          <h2 className="text-3xl md:text-5xl font-mono font-bold text-gray-300 mb-8 tracking-wider">
            NUNCA.ANTES
          </h2>
          
          <div className="text-gray-500 text-sm font-mono mb-8">
            <div>┌─────────────────────────────────────────────────────────────┐</div>
            <div>│ PROTOCOL: PROFESSIONAL_NETWORKING_v3.0                     │</div>
            <div>│ ENCRYPTION: AES-256                                         │</div>
            <div>│ LATENCY: LOW                                                │</div>
            <div>└─────────────────────────────────────────────────────────────┘</div>
          </div>

          <p className="text-base md:text-lg text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-mono">
            &gt; LA FORMA MÁS NUEVA Y FÁCIL DE CONECTAR CON PERSONAS QUE IMPORTAN<br />
            &gt; CONSTRUYE RELACIONES SIGNIFICATIVAS CON PROFESIONALES<br />
            &gt; INVESTIGADORES Y ESTUDIANTES DE TODO EL MUNDO
          </p>

          {/* Brutalist Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center mb-16">
            <button className="group relative bg-transparent border border-gray-400 text-gray-400 px-8 py-4 font-mono text-sm tracking-wider hover:border-white hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300 uppercase">
              <span className="relative z-10">[ SABER.MÁS ]</span>
            </button>
          </div>
        </div>

        {/* Technical Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Grid connecting lines */}
          <div className="absolute inset-0 hidden md:block">
            <div className="absolute top-1/2 left-1/3 w-1/3 h-px bg-gray-600"></div>
            <div className="absolute top-1/2 right-1/3 w-1/3 h-px bg-gray-600"></div>
          </div>

          {/* Feature Block 1 */}
          <div className="relative border border-gray-600 bg-black p-8 hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 group">
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="text-gray-400 text-xs font-mono mb-4">MODULE_01.exe</div>
            
            {/* Modern SVG Icon */}
            <div className="flex justify-center mb-6">
              <svg className="w-16 h-16 text-white group-hover:text-gray-300 transition-colors" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="48" cy="16" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="16" cy="48" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="48" cy="48" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                <line x1="22" y1="16" x2="42" y2="16" stroke="currentColor" strokeWidth="2"/>
                <line x1="22" y1="48" x2="42" y2="48" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="22" x2="16" y2="42" stroke="currentColor" strokeWidth="2"/>
                <line x1="48" y1="22" x2="48" y2="42" stroke="currentColor" strokeWidth="2"/>
                <circle cx="16" cy="16" r="2" fill="currentColor"/>
                <circle cx="48" cy="16" r="2" fill="currentColor"/>
                <circle cx="16" cy="48" r="2" fill="currentColor"/>
                <circle cx="48" cy="48" r="2" fill="currentColor"/>
              </svg>
            </div>
            
            <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase tracking-wider">
              CONECTA.INSTANTÁNEAMENTE
            </h3>
            <p className="text-gray-400 text-sm font-mono leading-relaxed uppercase">
              &gt; ENCUENTRA Y CONECTA CON PROFESIONALES<br />
              &gt; EN SEGUNDOS USANDO PROTOCOLOS DE<br />
              &gt; ALGORITMOS DE COINCIDENCIA AVANZADOS
            </p>
            
            <div className="text-gray-600 text-xs font-mono mt-4">
              STATUS: OPERATIONAL
            </div>
          </div>

          {/* Feature Block 2 */}
          <div className="relative border border-gray-600 bg-black p-8 hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 group">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="text-gray-400 text-xs font-mono mb-4">MODULE_02.exe</div>

            {/* Modern SVG Icon */}
            <div className="flex justify-center mb-6">
              <svg className="w-16 h-16 text-white group-hover:text-gray-300 transition-colors" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                <circle cx="16" cy="32" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="32" cy="32" r="6" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                <circle cx="48" cy="32" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="8" cy="52" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="24" cy="52" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="40" cy="52" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="56" cy="52" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <line x1="32" y1="17" x2="32" y2="26" stroke="currentColor" strokeWidth="2"/>
                <line x1="27" y1="30" x2="20" y2="30" stroke="currentColor" strokeWidth="2"/>
                <line x1="37" y1="30" x2="44" y2="30" stroke="currentColor" strokeWidth="2"/>
                <line x1="18" y1="36" x2="10" y2="49" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="20" y1="36" x2="24" y2="49" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="44" y1="36" x2="40" y2="49" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="46" y1="36" x2="54" y2="49" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            
            <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase tracking-wider">
              EXPANDE.TU.RED
            </h3>
            <p className="text-gray-400 text-sm font-mono leading-relaxed uppercase">
              &gt; AMPLÍA TU CÍRCULO PROFESIONAL<br />
              &gt; SIN ESFUERZO Y DESBLOQUEA NUEVAS<br />
              &gt; OPORTUNIDADES DE CARRERA
            </p>
            
            <div className="text-gray-600 text-xs font-mono mt-4">
              STATUS: OPERATIONAL
            </div>
          </div>

          {/* Feature Block 3 */}
          <div className="relative border border-gray-600 bg-black p-8 hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 group">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="text-gray-400 text-xs font-mono mb-4">MODULE_03.exe</div>

            {/* Modern SVG Icon */}
            <div className="flex justify-center mb-6">
              <svg className="w-16 h-16 text-white group-hover:text-gray-300 transition-colors" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 8 L44 20 L44 32 L32 44 L20 32 L20 20 Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="32" cy="26" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M24 32 Q28 38 32 38 Q36 38 40 32" stroke="currentColor" strokeWidth="2" fill="none"/>
                <line x1="26" y1="24" x2="28" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="36" y1="24" x2="38" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="32" cy="26" r="3" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            
            <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase tracking-wider">
              COMPARTE.IDEAS
            </h3>
            <p className="text-gray-400 text-sm font-mono leading-relaxed uppercase">
              &gt; COLABORA E INNOVA CON PERSONAS<br />
              &gt; AFINES EN PROTOCOLOS DEDICADOS<br />
              &gt; A GRUPOS DE INTERÉS
            </p>
            
            <div className="text-gray-600 text-xs font-mono mt-4">
              STATUS: OPERATIONAL
            </div>
          </div>
        </div>

        {/* Technical Footer */}
        <div className="mt-16 text-center">
          <div className="text-gray-500 text-xs font-mono">
            <pre>{`
    ├─────────────────────────────────────────────────────────────────┤
    │ END_OF_TRANSMISSION                             CHECKSUM: OK     │
    └─────────────────────────────────────────────────────────────────┘
            `}</pre>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
