import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { MONITORING_SERVICES } from '../data/telemetry';
import { getWobblyBorderStyle } from '../styles/handDrawnTokens';
import { TapeStrip } from './HandDrawnDecor';

export function ServiceList() {
  const [expandedId, setExpandedId] = useState<string | null>(
    MONITORING_SERVICES[0].id
  );

  const toggleService = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="systems"
      aria-labelledby="systems-heading"
      className="scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 text-[#2d2d2d] dark:text-white"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b-[3px] border-dashed border-[#2d2d2d] dark:border-[#FF4D00] mb-8 sm:mb-10">
          <div>
            <p className="font-sans text-sm sm:text-base text-[#2d5da1] dark:text-[#FF4D00] mb-1">
              Sensor Subsystems &amp; Diagnostic Architecture
            </p>
            <h2
              id="systems-heading"
              className="font-display font-bold text-3xl sm:text-4xl md:text-5xl leading-tight"
            >
              Monitoring Stack
            </h2>
          </div>
          <p className="font-sans text-sm sm:text-base text-[#2d2d2d]/75 dark:text-white/75">
            Click any subsystem sketch card to inspect telemetry rules
          </p>
        </div>

        {/* Hand-Drawn Interactive Subsystem Cards */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8">
          {MONITORING_SERVICES.map((service, idx) => {
            const isExpanded = expandedId === service.id;
            const tilt = idx % 2 === 0 ? 'sm:-rotate-1' : 'sm:rotate-1';
            const cardBg = isExpanded
              ? 'bg-[#fff9c4] dark:bg-[#18110c]'
              : 'bg-white dark:bg-[#0c0c10]';

            return (
              <div
                key={service.id}
                data-gsap="service-row"
                style={getWobblyBorderStyle(idx % 2 === 0 ? 'wobblyMd' : 'wobblyAlt')}
                className={`relative border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] ${cardBg} ${tilt} hover:rotate-0 transition-transform duration-100 sketch-shadow`}
              >
                {idx === 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <TapeStrip />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleService(service.id)}
                  aria-expanded={isExpanded}
                  className="group w-full text-left p-4 sm:p-6 md:p-8 flex items-start sm:items-center justify-between gap-3 sm:gap-6 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2d5da1]"
                >
                  <div className="flex flex-row items-start sm:items-center gap-3 sm:gap-5 min-w-0 flex-1">
                    {/* Rough circle around index number */}
                    <span
                      style={getWobblyBorderStyle('wobblyCircle')}
                      className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center font-display font-bold text-lg sm:text-xl bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black border-2 border-[#2d2d2d] dark:border-white mt-0.5 sm:mt-0"
                    >
                      {service.index}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold text-xl sm:text-3xl md:text-4xl text-[#2d2d2d] dark:text-white leading-tight">
                        {service.title}
                      </h3>
                      <p className="mt-1 sm:mt-1.5 font-sans text-sm sm:text-base text-[#2d5da1] dark:text-[#FF4D00]">
                        {service.tags.join('  ·  ')}
                      </p>
                    </div>
                  </div>

                  {/* Sketch arrow rotates 45deg on hover / open */}
                  <span
                    className={`shrink-0 text-[#ff4d4d] dark:text-[#FF4D00] transition-transform duration-150 mt-1 sm:mt-0 ${
                      isExpanded
                        ? 'rotate-90'
                        : 'group-hover:translate-x-1 group-hover:rotate-45'
                    }`}
                    aria-hidden="true"
                  >
                    <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2.5} />
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-6 md:px-8 pb-5 sm:pb-6 md:pb-8 pt-2 border-t-2 border-dashed border-[#2d2d2d]/40 dark:border-[#FF4D00]/40">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                      <p className="lg:col-span-5 font-sans text-base sm:text-lg text-[#2d2d2d] dark:text-white/90 leading-relaxed">
                        {service.summary}
                      </p>
                      <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t-2 sm:border-t-0 sm:border-l-2 border-dashed border-[#2d2d2d]/35 dark:border-white/25 pt-4 sm:pt-0 sm:pl-6">
                        <div>
                          <p className="font-display font-bold text-sm text-[#ff4d4d] dark:text-[#FF4D00] mb-1">
                            Sampling Cadence
                          </p>
                          <p className="font-sans text-sm sm:text-base text-[#2d2d2d] dark:text-white/90">
                            {service.cadence}
                          </p>
                        </div>
                        <div>
                          <p className="font-display font-bold text-sm text-[#2d5da1] dark:text-[#FF4D00] mb-1">
                            Threshold Rule
                          </p>
                          <p className="font-sans text-sm sm:text-base text-[#2d2d2d] dark:text-white/90">
                            {service.thresholdRule}
                          </p>
                        </div>
                        <div>
                          <p className="font-display font-bold text-sm text-[#ff4d4d] dark:text-[#FF4D00] mb-1">
                            Redundancy
                          </p>
                          <p className="font-sans text-sm sm:text-base text-[#2d2d2d] dark:text-white/90">
                            {service.redundancy}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
