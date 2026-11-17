import { useState, type FormEvent } from 'react';
import { Download, X } from 'lucide-react';
import {
  createMissionTicketId,
  validateDeploymentRequest,
  type DeploymentValidationErrors,
} from '../data/telemetry';
import { getWobblyBorderStyle } from '../styles/handDrawnTokens';
import { ThumbtackPin } from './HandDrawnDecor';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MISSION_SCOPES = [
  'LEO Habitat Crew Telemetry',
  'EVA Suit Pressure & O2 Loop',
  'Lunar Gateway Dosimetry',
  'Deep Space Transit Flight Surgeon Console',
];

export function DeploymentModal({ isOpen, onClose }: DeploymentModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [missionScope, setMissionScope] = useState(MISSION_SCOPES[0]);
  const [errors, setErrors] = useState<DeploymentValidationErrors>({});
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateDeploymentRequest({
      fullName,
      email,
      organization,
      missionScope,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmittedTicket(createMissionTicketId(email, organization));
  };

  const handleResetAndClose = () => {
    setErrors({});
    setSubmittedTicket(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2d2d2d]/70 dark:bg-black/85 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="briefing-modal-title"
    >
      <div
        style={getWobblyBorderStyle('wobblyMd')}
        className="w-full max-w-xl max-h-[90dvh] overflow-y-auto bg-[#fdfbf7] dark:bg-black text-[#2d2d2d] dark:text-white border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] p-5 sm:p-8 relative sketch-shadow-lg"
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <ThumbtackPin />
        </div>

        <div className="flex items-start justify-between gap-3 sm:gap-4 border-b-2 border-dashed border-[#2d2d2d] dark:border-[#FF4D00] pb-4 mb-5 sm:mb-6 pt-1">
          <div>
            <p className="font-sans text-sm sm:text-base text-[#2d5da1] dark:text-[#FF4D00]">
              AuraMed Flight Operations
            </p>
            <h2
              id="briefing-modal-title"
              className="font-display font-bold text-2xl sm:text-4xl leading-tight"
            >
              Deploy Flight Briefing
            </h2>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close deployment briefing modal"
            style={getWobblyBorderStyle('wobblySm')}
            className="w-11 h-11 shrink-0 bg-white dark:bg-[#0c0c10] text-[#2d2d2d] dark:text-white border-2 border-[#2d2d2d] dark:border-[#FF4D00] flex items-center justify-center cursor-pointer hover:bg-[#ff4d4d] hover:text-white dark:hover:bg-[#FF4D00] dark:hover:text-black sketch-btn"
          >
            <X className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {submittedTicket ? (
          <div
            data-testid="briefing-confirmation"
            style={getWobblyBorderStyle('wobblySm')}
            className="bg-[#fff9c4] dark:bg-[#0c0c10] text-[#2d2d2d] dark:text-white p-6 border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] space-y-4 sketch-shadow"
          >
            <p className="font-sans text-base text-[#ff4d4d] dark:text-[#FF4D00] font-bold">
              Briefing Request Logged
            </p>
            <h3 className="font-display font-bold text-3xl leading-tight">
              Flight Surgeon Packet Queued
            </h3>
            <p className="font-sans text-lg leading-relaxed">
              Mission control engineering has queued your architecture dossier
              for <span className="font-bold underline">{organization}</span>.
            </p>
            <div className="border-t-2 border-dashed border-[#2d2d2d]/40 dark:border-white/25 pt-4 font-sans text-base space-y-1">
              <p>
                Ticket ID:{' '}
                <span className="font-display font-bold text-[#ff4d4d] dark:text-[#FF4D00]">
                  {submittedTicket}
                </span>
              </p>
              <p>Program Lead: {fullName}</p>
              <p>Scope: {missionScope}</p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                style={getWobblyBorderStyle('wobbly')}
                className="h-12 bg-white dark:bg-[#FF4D00] text-[#2d2d2d] dark:text-black font-sans text-lg px-6 border-[3px] border-[#2d2d2d] dark:border-white hover:bg-[#ff4d4d] hover:text-white dark:hover:bg-white sketch-btn cursor-pointer"
              >
                Return to AuraMed
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div
              style={getWobblyBorderStyle('wobblySm')}
              className="bg-[#fff9c4] dark:bg-[#18110c] border-2 border-[#2d2d2d] dark:border-[#FF4D00] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm"
            >
              <div>
                <span className="font-bold text-[#ff4d4d] dark:text-[#FF4D00] block">
                  Looking for the Astronaut App?
                </span>
                <span className="text-[#2d2d2d]/80 dark:text-white/80">
                  Direct Android APK installation package (v1.0, 111 MB).
                </span>
              </div>
              <a
                href="/AuraMed.apk"
                download="AuraMed.apk"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2d5da1] dark:bg-[#FF4D00] text-white dark:text-black font-bold rounded hover:bg-[#ff4d4d] transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download APK</span>
              </a>
            </div>
            <div>
              <label
                htmlFor="briefing-name"
                className="block font-sans text-base font-bold mb-1"
              >
                Flight Surgeon / Program Lead
              </label>
              <input
                id="briefing-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Elena Vance"
                aria-invalid={Boolean(errors.fullName)}
                style={getWobblyBorderStyle('wobblySm')}
                className="w-full bg-white dark:bg-[#0c0c10] text-[#2d2d2d] dark:text-white placeholder:text-[#2d2d2d]/40 dark:placeholder:text-white/40 border-2 border-[#2d2d2d] dark:border-white/35 px-4 py-2.5 font-sans text-base focus:outline-none focus:border-[#2d5da1] dark:focus:border-[#FF4D00] focus:ring-2 focus:ring-[#2d5da1]/20 dark:focus:ring-[#FF4D00]/25"
              />
              {errors.fullName && (
                <p
                  role="alert"
                  style={getWobblyBorderStyle('wobblyTag')}
                  className="mt-1.5 font-sans text-sm bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black px-3 py-1 inline-block"
                >
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="briefing-email"
                className="block font-sans text-base font-bold mb-1"
              >
                Operations Email
              </label>
              <input
                id="briefing-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="flight.surgeon@orbital.org"
                aria-invalid={Boolean(errors.email)}
                style={getWobblyBorderStyle('wobblySm')}
                className="w-full bg-white dark:bg-[#0c0c10] text-[#2d2d2d] dark:text-white placeholder:text-[#2d2d2d]/40 dark:placeholder:text-white/40 border-2 border-[#2d2d2d] dark:border-white/35 px-4 py-2.5 font-sans text-base focus:outline-none focus:border-[#2d5da1] dark:focus:border-[#FF4D00] focus:ring-2 focus:ring-[#2d5da1]/20 dark:focus:ring-[#FF4D00]/25"
              />
              {errors.email && (
                <p
                  role="alert"
                  style={getWobblyBorderStyle('wobblyTag')}
                  className="mt-1.5 font-sans text-sm bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black px-3 py-1 inline-block"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="briefing-org"
                className="block font-sans text-base font-bold mb-1"
              >
                Agency / Spacecraft Program
              </label>
              <input
                id="briefing-org"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Orbital Flight Directorate"
                aria-invalid={Boolean(errors.organization)}
                style={getWobblyBorderStyle('wobblySm')}
                className="w-full bg-white dark:bg-[#0c0c10] text-[#2d2d2d] dark:text-white placeholder:text-[#2d2d2d]/40 dark:placeholder:text-white/40 border-2 border-[#2d2d2d] dark:border-white/35 px-4 py-2.5 font-sans text-base focus:outline-none focus:border-[#2d5da1] dark:focus:border-[#FF4D00] focus:ring-2 focus:ring-[#2d5da1]/20 dark:focus:ring-[#FF4D00]/25"
              />
              {errors.organization && (
                <p
                  role="alert"
                  style={getWobblyBorderStyle('wobblyTag')}
                  className="mt-1.5 font-sans text-sm bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black px-3 py-1 inline-block"
                >
                  {errors.organization}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="briefing-scope"
                className="block font-sans text-base font-bold mb-1"
              >
                Primary Telemetry Scope
              </label>
              <select
                id="briefing-scope"
                value={missionScope}
                onChange={(e) => setMissionScope(e.target.value)}
                style={getWobblyBorderStyle('wobblySm')}
                className="w-full bg-white dark:bg-[#0c0c10] text-[#2d2d2d] dark:text-white border-2 border-[#2d2d2d] dark:border-white/35 px-4 py-2.5 font-sans text-base focus:outline-none focus:border-[#2d5da1] dark:focus:border-[#FF4D00] focus:ring-2 focus:ring-[#2d5da1]/20 dark:focus:ring-[#FF4D00]/25"
              >
                {MISSION_SCOPES.map((scope) => (
                  <option key={scope} value={scope}>
                    {scope}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                style={getWobblyBorderStyle('wobblySm')}
                className="h-12 font-sans text-base px-5 border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] bg-[#e5e0d8] dark:bg-black text-[#2d2d2d] dark:text-white hover:bg-[#2d5da1] hover:text-white dark:hover:bg-[#FF4D00] dark:hover:text-black sketch-btn cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={getWobblyBorderStyle('wobbly')}
                className="h-12 font-sans text-lg font-bold px-6 bg-white dark:bg-[#FF4D00] text-[#2d2d2d] dark:text-black border-[3px] border-[#2d2d2d] dark:border-white hover:bg-[#ff4d4d] hover:text-white dark:hover:bg-white sketch-btn cursor-pointer whitespace-nowrap"
              >
                Submit Request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
