import { forwardRef } from 'react';

interface AstronautRunnerArtProps {
  className?: string;
  showGroundHorizon?: boolean;
}

export const AstronautRunnerArt = forwardRef<
  SVGSVGElement,
  AstronautRunnerArtProps
>(function AstronautRunnerArt({ className = '', showGroundHorizon = false }, ref) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 180 150"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Optional sketchy lunar horizon directly under flat boot soles (y=136) */}
      {showGroundHorizon && (
        <path
          d="M 16 138 Q 90 134, 164 138"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeDasharray="6 6"
          strokeLinecap="round"
          opacity="0.45"
        />
      )}

      {/* Subtle floating step puff behind back boot */}
      <g data-limb="dustTrail" opacity="0.65">
        <path
          d="M 56 133 C 49 133, 47 127, 54 127 C 56 123, 63 124, 63 129 C 66 132, 61 135, 56 133 Z"
          className="fill-[#e5e0d8] dark:fill-[#FF4D00]/25 stroke-[#2d2d2d] dark:stroke-[#FF4D00]"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </g>

      {/* Main articulated astronaut body group — upright, calm posture */}
      <g data-limb="body" style={{ transformOrigin: '90px 80px' }}>
        {/* Back Arm — relaxed downward hang with slight elbow bend */}
        <g data-limb="armBack" style={{ transformOrigin: '83px 66px' }}>
          <path
            d="M 83 66 L 80 79 L 84 91"
            className="stroke-[#2d2d2d] dark:stroke-white"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 83 66 L 80 79 L 84 91"
            className="stroke-[#e5e0d8] dark:stroke-[#1f1f28]"
            strokeWidth="5.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="85"
            cy="92"
            r="4.8"
            className="fill-[#2d5da1] dark:fill-[#FF4D00] stroke-[#2d2d2d] dark:stroke-white"
            strokeWidth="2.2"
          />
        </g>

        {/* Back Leg — hip (86, 95) -> knee (86, 113) -> ankle (85, 129) */}
        <g data-limb="legBack" style={{ transformOrigin: '86px 95px' }}>
          {/* Thigh */}
          <path
            d="M 86 95 L 86 113"
            className="stroke-[#2d2d2d] dark:stroke-white"
            strokeWidth="12.5"
            strokeLinecap="round"
          />
          <path
            d="M 86 95 L 86 113"
            className="stroke-[#e5e0d8] dark:stroke-[#1f1f28]"
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          {/* Back Shin + Boot pivoted at knee (86, 113) */}
          <g data-limb="shinBack" style={{ transformOrigin: '86px 113px' }}>
            <path
              d="M 86 113 L 85 129"
              className="stroke-[#2d2d2d] dark:stroke-white"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 86 113 L 85 129"
              className="stroke-[#e5e0d8] dark:stroke-[#1f1f28]"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* Grounded Moon Boot pointing right */}
            <path
              d="M 79 127 L 91 127 L 98 131 C 100 133, 99 136, 96 136 L 79 136 Z"
              className="fill-[#2d5da1] dark:fill-[#FF4D00] stroke-[#2d2d2d] dark:stroke-white"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* PLSS Life Support Backpack */}
        <g data-limb="pack">
          <rect
            x="65"
            y="57"
            width="16"
            height="34"
            rx="5"
            className="fill-[#fff9c4] dark:fill-[#18110c] stroke-[#2d2d2d] dark:stroke-[#FF4D00]"
            strokeWidth="2.5"
          />
          {/* Antenna */}
          <path
            d="M 71 57 L 69 40"
            className="stroke-[#2d2d2d] dark:stroke-white"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle
            cx="69"
            cy="39"
            r="2.8"
            className="fill-[#ff4d4d] dark:fill-[#FF4D00] stroke-[#2d2d2d] dark:stroke-white"
            strokeWidth="1.8"
          />
          {/* Gentle RCS vent dot */}
          <path
            data-limb="thrusterPuff"
            d="M 62 79 L 55 81"
            className="stroke-[#ff4d4d] dark:stroke-[#FF4D00]"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Torso Suit + AuraMed Chest ECG Badge */}
        <path
          d="M 78 60 C 80 54, 102 54, 104 60 L 101 95 C 99 100, 81 100, 79 95 Z"
          className="fill-white dark:fill-[#0c0c10] stroke-[#2d2d2d] dark:stroke-white"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        {/* Waist belt */}
        <path
          d="M 79 90 Q 90 92, 101 90"
          className="stroke-[#ff4d4d] dark:stroke-[#FF4D00]"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        {/* Chest ECG Module */}
        <rect
          x="87"
          y="65"
          width="15"
          height="12"
          rx="3"
          className="fill-[#2d2d2d] dark:fill-black stroke-[#2d2d2d] dark:stroke-[#FF4D00]"
          strokeWidth="1.8"
        />
        <path
          d="M 89 71 L 92 71 L 93.5 68 L 95.5 74 L 97.5 70 L 100 71"
          className="stroke-[#ff4d4d] dark:stroke-[#FF4D00]"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Front Leg — hip (94, 95) -> knee (94, 113) -> ankle (93, 129) */}
        <g data-limb="legFront" style={{ transformOrigin: '94px 95px' }}>
          {/* Thigh */}
          <path
            d="M 94 95 L 94 113"
            className="stroke-[#2d2d2d] dark:stroke-white"
            strokeWidth="12.5"
            strokeLinecap="round"
          />
          <path
            d="M 94 95 L 94 113"
            className="stroke-white dark:stroke-[#14141c]"
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          {/* Front Shin + Boot pivoted at knee (94, 113) */}
          <g data-limb="shinFront" style={{ transformOrigin: '94px 113px' }}>
            <path
              d="M 94 113 L 93 129"
              className="stroke-[#2d2d2d] dark:stroke-white"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 94 113 L 93 129"
              className="stroke-white dark:stroke-[#14141c]"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* Grounded Front Moon Boot pointing right */}
            <path
              d="M 87 127 L 99 127 L 106 131 C 108 133, 107 136, 104 136 L 87 136 Z"
              className="fill-[#ff4d4d] dark:fill-[#FF4D00] stroke-[#2d2d2d] dark:stroke-white"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* Helmet + Gold/Yellow Reflection Visor */}
        <g data-limb="head" style={{ transformOrigin: '92px 52px' }}>
          <circle
            cx="92"
            cy="39"
            r="17.5"
            className="fill-white dark:fill-[#0c0c10] stroke-[#2d2d2d] dark:stroke-white"
            strokeWidth="2.6"
          />
          <path
            d="M 87 29 C 98 27, 109 31, 109 39 C 109 47, 99 50, 88 49 C 83 47, 83 32, 87 29 Z"
            className="fill-[#fff9c4] dark:fill-[#FF4D00] stroke-[#2d2d2d] dark:stroke-white"
            strokeWidth="2.2"
          />
          <path
            d="M 99 33 Q 104 35, 104 39"
            className="stroke-white dark:stroke-black"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </g>

        {/* Front Arm — relaxed downward hang with slight elbow bend */}
        <g data-limb="armFront" style={{ transformOrigin: '97px 66px' }}>
          <path
            d="M 97 66 L 96 79 L 100 91"
            className="stroke-[#2d2d2d] dark:stroke-white"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 97 66 L 96 79 L 100 91"
            className="stroke-white dark:stroke-[#14141c]"
            strokeWidth="5.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="101"
            cy="92"
            r="4.8"
            className="fill-[#ff4d4d] dark:fill-[#FF4D00] stroke-[#2d2d2d] dark:stroke-white"
            strokeWidth="2.2"
          />
        </g>
      </g>
    </svg>
  );
});
