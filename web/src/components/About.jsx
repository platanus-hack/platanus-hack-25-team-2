import React from 'react';

const About = () => {
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
            backgroundSize: '60px 60px'
          }}
        />
        {/* Grid intersection markers */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 60px 60px, #555 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-20">
          {/* ASCII Header Frame */}
          <div className="text-gray-500 text-xs font-mono mb-8">
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 uppercase tracking-wider">
            SOBRE.RECORD.AI
          </h2>

          <div className="text-gray-500 text-sm font-mono mb-8">
            <div>════════════════════════════════════════════════════════════════════</div>
          </div>

          <p className="text-base md:text-lg text-gray-300 max-w-4xl mx-auto uppercase tracking-wide leading-relaxed">
            &gt; EL CEREBRO HUMANO TIENE LÍMITES. LA MEMORIA ES UNO<br />
            &gt; ESPECIALMENTE MOLESTO. NOSOTROS ROMPEMOS ESOS LÍMITES
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start mb-20">
          {/* Mission Module */}
          <div className="relative">
            {/* Corner markers */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-white"></div>
            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-white"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-white"></div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-white"></div>
            
            <div className="border border-gray-600 bg-black p-8 hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 relative group">
              <div className="text-gray-400 text-xs font-mono mb-4 group-hover:text-gray-300 transition-colors">MISSION_STATEMENT.txt</div>
              
              <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">
                &gt; NUESTRA.MISIÓN
              </h3>

              <div className="text-gray-300 text-sm font-mono leading-relaxed space-y-4 uppercase">
                <p>
                  &gt; ¿A QUIÉN NO LE HA PASADO? ESTÁN EN UN EVENTO,<br />
                  &gt; VEN A ALGUIEN IMPORTANTE Y LA MENTE SE QUEDA<br />
                  &gt; EN BLANCO. OLVIDAMOS SU NOMBRE, SU CARGO<br />
                  &gt; O DE QUÉ SE HABLÓ LA ÚLTIMA VEZ.
                </p>
                <p className="mt-4">
                  &gt; RECORD.AI ES UN SISTEMA QUE PERMITE IDENTIFICAR<br />
                  &gt; Y ANALIZAR PERSONAS EN UN ENTORNO SOCIAL A TRAVÉS<br />
                  &gt; DE SOLAMENTE SU IMAGEN. INGENIERÍA PURA:<br />
                  &gt; VIDEO, EMBEDDINGS FACIALES Y BÚSQUEDA VECTORIAL.
                </p>
              </div>
              
              <div className="text-gray-600 text-xs font-mono mt-6">
                CHECKSUM: A7F3E9D2
              </div>
            </div>
          </div>

          {/* Feature Modules */}
          <div className="space-y-6 lg:space-y-8">
            {/* Purpose-Driven Module */}
            <div className="border border-gray-600 bg-black p-6 hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.08)] transition-all duration-300 relative group">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-start space-x-6">
                {/* Modern SVG Icon */}
                <div className="flex-shrink-0">
                  <svg className="w-14 h-14 text-white group-hover:text-gray-300 transition-colors" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M32 8 L32 32 L48 48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="32" cy="32" r="3" fill="currentColor"/>
                    <line x1="32" y1="12" x2="32" y2="16" stroke="currentColor" strokeWidth="2"/>
                    <line x1="32" y1="48" x2="32" y2="52" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="32" x2="16" y2="32" stroke="currentColor" strokeWidth="2"/>
                    <line x1="48" y1="32" x2="52" y2="32" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>

                <div>
                  <div className="text-gray-400 text-xs font-mono mb-2">FEATURE_01.exe</div>
                  <h4 className="text-lg font-bold text-white mb-3 uppercase tracking-wider">
                    RECONOCIMIENTO.INSTANTÁNEO
                  </h4>
                  <p className="text-gray-400 text-sm font-mono uppercase leading-relaxed">
                    &gt; CAPTURA VIDEO, PROCESA EMBEDDINGS<br />
                    &gt; FACIALES CON MODELOS DE DEEP LEARNING<br />
                    &gt; Y EJECUTA BÚSQUEDA VECTORIAL AL INSTANTE.
                  </p>
                </div>
              </div>
            </div>

            {/* Global Community Module */}
            <div className="border border-gray-600 bg-black p-6 hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.08)] transition-all duration-300 relative group">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-start space-x-6">
                {/* Modern SVG Icon */}
                <div className="flex-shrink-0">
                  <svg className="w-14 h-14 text-white group-hover:text-gray-300 transition-colors" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M8 32 Q16 24 24 32 Q32 40 40 32 Q48 24 56 32" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M32 8 Q24 16 32 24 Q40 32 32 40 Q24 48 32 56" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="28" r="2.5" fill="currentColor"/>
                    <circle cx="32" cy="12" r="2.5" fill="currentColor"/>
                    <circle cx="52" cy="28" r="2.5" fill="currentColor"/>
                    <circle cx="32" cy="52" r="2.5" fill="currentColor"/>
                    <circle cx="20" cy="18" r="2" fill="currentColor"/>
                    <circle cx="44" cy="18" r="2" fill="currentColor"/>
                    <circle cx="20" cy="46" r="2" fill="currentColor"/>
                    <circle cx="44" cy="46" r="2" fill="currentColor"/>
                  </svg>
                </div>

                <div>
                  <div className="text-gray-400 text-xs font-mono mb-2">FEATURE_02.exe</div>
                  <h4 className="text-lg font-bold text-white mb-3 uppercase tracking-wider">
                    OPTIMIZADO.EN.VIVO
                  </h4>
                  <p className="text-gray-400 text-sm font-mono uppercase leading-relaxed">
                    &gt; TODO OPTIMIZADO PARA CORRER EN VIVO.<br />
                    &gt; PROCESAMIENTO EN TIEMPO REAL<br />
                    &gt; CON LATENCIA MÍNIMA.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy First Module */}
            <div className="border border-gray-600 bg-black p-6 hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.08)] transition-all duration-300 relative group">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white opacity-50 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-start space-x-6">
                {/* Modern SVG Icon */}
                <div className="flex-shrink-0">
                  <svg className="w-14 h-14 text-white group-hover:text-gray-300 transition-colors" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M32 8 L48 16 L48 32 C48 44 40 52 32 56 C24 52 16 44 16 32 L16 16 Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <rect x="26" y="26" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M28 26 L28 22 C28 19.79 29.79 18 32 18 C34.21 18 36 19.79 36 22 L36 26" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="32" cy="33" r="2" fill="currentColor"/>
                    <line x1="32" y1="35" x2="32" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>

                <div>
                  <div className="text-gray-400 text-xs font-mono mb-2">FEATURE_03.exe</div>
                  <h4 className="text-lg font-bold text-white mb-3 uppercase tracking-wider">
                    ACCESIBILIDAD.COGNITIVA
                  </h4>
                  <p className="text-gray-400 text-sm font-mono uppercase leading-relaxed">
                    &gt; MÁS ALLÁ DE QUEDAR BIEN EN UNA REUNIÓN.<br />
                    &gt; ENFÓCATE EN LO QUE REALMENTE IMPORTA:<br />
                    &gt; LA PERSONA QUE TIENES ENFRENTE.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="relative">
          <div className="text-gray-500 text-xs font-mono mb-8 text-center">
            <div>┌─────────────────── SYSTEM_METRICS.log ───────────────────┐</div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Active Users */}
            <div className="border border-gray-600 bg-black p-6 hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 text-center relative group">
              <div className="absolute top-2 left-2 text-gray-600 text-xs font-mono group-hover:text-gray-400 transition-colors">[USERS]</div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2 font-mono group-hover:scale-110 transition-transform">10K+</div>
              <div className="text-gray-400 text-xs font-mono uppercase tracking-wider group-hover:text-gray-300 transition-colors">ACTIVE_USERS</div>
              <div className="absolute bottom-1 right-2 text-gray-600 text-xs font-mono group-hover:text-white transition-colors">●</div>
            </div>

            {/* Countries */}
            <div className="border border-gray-600 bg-black p-6 hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 text-center relative group">
              <div className="absolute top-2 left-2 text-gray-600 text-xs font-mono group-hover:text-gray-400 transition-colors">[GEOLOC]</div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2 font-mono group-hover:scale-110 transition-transform">50+</div>
              <div className="text-gray-400 text-xs font-mono uppercase tracking-wider group-hover:text-gray-300 transition-colors">COUNTRIES</div>
              <div className="absolute bottom-1 right-2 text-gray-600 text-xs font-mono group-hover:text-white transition-colors">●</div>
            </div>

            {/* Connections */}
            <div className="border border-gray-600 bg-black p-6 hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 text-center relative group">
              <div className="absolute top-2 left-2 text-gray-600 text-xs font-mono group-hover:text-gray-400 transition-colors">[CONNECT]</div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2 font-mono group-hover:scale-110 transition-transform">100K+</div>
              <div className="text-gray-400 text-xs font-mono uppercase tracking-wider group-hover:text-gray-300 transition-colors">CONNECTIONS</div>
              <div className="absolute bottom-1 right-2 text-gray-600 text-xs font-mono group-hover:text-white transition-colors">●</div>
            </div>

            {/* Satisfaction */}
            <div className="border border-gray-600 bg-black p-6 hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 text-center relative group">
              <div className="absolute top-2 left-2 text-gray-600 text-xs font-mono group-hover:text-gray-400 transition-colors">[RATING]</div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2 font-mono group-hover:scale-110 transition-transform">98%</div>
              <div className="text-gray-400 text-xs font-mono uppercase tracking-wider group-hover:text-gray-300 transition-colors">SATISFACTION</div>
              <div className="absolute bottom-1 right-2 text-gray-600 text-xs font-mono group-hover:text-white transition-colors">●</div>
            </div>
          </div>
          
          <div className="text-gray-500 text-xs font-mono mt-8 text-center">
            <div>└─────────────────── END_OF_METRICS ─────────────────────┘</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
