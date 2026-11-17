import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MetClock } from '../components/ui/MetClock';
import { Compass, Rocket, MapPin, Users } from 'lucide-react';

export const MissionsPage: React.FC = () => {
  const missions = [
    {
      id: 1,
      code: 'ARTEMIS-IV',
      name: 'Artemis IV Lunar Gateway Habitat Assembly',
      type: 'LUNAR',
      status: 'active' as const,
      destination: 'Lunar Distant Retrograde Orbit (DRO)',
      vehicle: 'Orion Spacecraft & SLS Block 1B',
      launchDate: '2026-10-05T06:00:00Z',
      crew: ['Elena Vance (CDR)', 'Marcus Chen (PLT)', 'Arya Patel (SPC)'],
      phases: [
        { name: 'Trans-Lunar Injection', status: 'completed' },
        { name: 'Gateway Docking', status: 'completed' },
        { name: 'Habitat Pressurization', status: 'active' },
        { name: 'Lunar South Pole EVA', status: 'pending' },
      ],
      description:
        'First mission to utilize the I-Hab international habitation module on Gateway, executing autonomous bio-astronautics telemetry recording.',
    },
    {
      id: 2,
      code: 'EXPEDITION-74',
      name: 'ISS Microgravity Long-Duration Cellular Study',
      type: 'ISS',
      status: 'active' as const,
      destination: 'Low Earth Orbit (408 km)',
      vehicle: 'Crew Dragon C212',
      launchDate: '2026-08-14T11:30:00Z',
      crew: ['Alexei Ivanov (ENG)', 'Sarah Jenkins (CMD)'],
      phases: [
        { name: 'Launch & Rendezvous', status: 'completed' },
        { name: 'Science Payload Activation', status: 'active' },
        { name: 'EVA Radiator Inspection', status: 'pending' },
      ],
      description:
        'Continuous cardiovascular baseline collection and circadian rhythm adjustment in the Columbus and Kibo modules.',
    },
    {
      id: 3,
      code: 'ARES-PATHFINDER',
      name: 'Deep-Space Mars Habitat Transit Simulation',
      type: 'MARS',
      status: 'planned' as const,
      destination: 'Deep Space Transit Trajectory',
      vehicle: 'Deep Space Transport Prototype',
      launchDate: '2027-04-12T00:00:00Z',
      crew: ['To be assigned by Flight Surgeon'],
      phases: [
        { name: 'Hab Integration', status: 'pending' },
        { name: 'Comms Latency Simulation', status: 'pending' },
        { name: 'Solar Storm Protocol', status: 'pending' },
      ],
      description:
        'High-fidelity 18-month isolation simulation verifying autonomous offline clinical triage without real-time Houston voice uplink.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white tracking-wide flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-cyan-400" />
            FLIGHT MISSIONS & EVA PROTOCOLS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            CREW ASSIGNMENTS, MISSION ELAPSED TIME (MET) & FLIGHT PHASES
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {missions.map((mission) => (
          <Card key={mission.id} className="border-[#1E3A5F]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1E3A5F]">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
                    {mission.code}
                  </span>
                  <Badge status={mission.status === 'active' ? 'nominal' : 'neutral'}>
                    {mission.status}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">· {mission.type}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{mission.name}</h3>
              </div>

              {mission.status === 'active' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">MET:</span>
                  <MetClock launchDate={mission.launchDate} size="md" />
                </div>
              )}
            </div>

            <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400">DESTINATION:</span>
                  <span className="text-white">{mission.destination}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400">VEHICLE:</span>
                  <span className="text-white">{mission.vehicle}</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 font-sans">{mission.description}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400">CREW COMPLEMENT:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mission.crew.map((c, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-[#050B14] border border-[#1E3A5F] text-[11px] text-cyan-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {/* Phase Stepper */}
                <div className="pt-2">
                  <span className="text-slate-400 block mb-2 text-[11px]">FLIGHT PROGRESSION:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {mission.phases.map((phase, pIdx) => (
                      <div
                        key={pIdx}
                        className={`p-2 rounded border text-[10px] text-center font-mono ${
                          phase.status === 'completed'
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                            : phase.status === 'active'
                            ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 animate-pulse font-bold'
                            : 'bg-[#050B14] border-[#1E3A5F]/40 text-slate-500'
                        }`}
                      >
                        {phase.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
