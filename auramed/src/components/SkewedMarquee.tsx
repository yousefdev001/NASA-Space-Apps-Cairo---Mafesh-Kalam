export function SkewedMarquee() {
  const rowOneText =
    'Orbital Biometrics • EVA Suit Telemetry • Zero-G Cardiac • ';
  const rowTwoText =
    'Hypoxia Early Warning • Radiation Dosimetry • Circadian Sync • ';

  return (
    <section
      aria-label="AuraMed system capabilities ticker"
      className="w-full overflow-x-clip py-4 sm:py-6"
    >
      <div className="w-full bg-[#fff9c4] dark:bg-black -rotate-1 py-4 sm:py-7 border-y-[3px] border-dashed border-[#2d2d2d] dark:border-[#FF4D00] overflow-hidden sketch-shadow-card">
        {/* Row 1 */}
        <div className="flex w-max animate-marquee-left">
          <span className="font-display font-bold text-3xl sm:text-5xl md:text-6xl leading-none text-[#2d2d2d] dark:text-[#FF4D00] whitespace-nowrap pr-6">
            {rowOneText}
            {rowOneText}
          </span>
          <span
            aria-hidden="true"
            className="font-display font-bold text-3xl sm:text-5xl md:text-6xl leading-none text-[#2d2d2d] dark:text-[#FF4D00] whitespace-nowrap pr-6"
          >
            {rowOneText}
            {rowOneText}
          </span>
        </div>

        {/* Row 2 */}
        <div className="flex w-max animate-marquee-right mt-2 sm:mt-3">
          <span className="font-sans text-xl sm:text-3xl md:text-4xl leading-none text-[#2d5da1] dark:text-white/85 whitespace-nowrap pr-6">
            {rowTwoText}
            {rowTwoText}
          </span>
          <span
            aria-hidden="true"
            className="font-sans text-xl sm:text-3xl md:text-4xl leading-none text-[#2d5da1] dark:text-white/85 whitespace-nowrap pr-6"
          >
            {rowTwoText}
            {rowTwoText}
          </span>
        </div>
      </div>
    </section>
  );
}
