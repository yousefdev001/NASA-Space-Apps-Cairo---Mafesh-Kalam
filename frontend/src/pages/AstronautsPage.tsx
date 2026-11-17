import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Users, Search, ShieldCheck } from 'lucide-react';
import apiClient from '../api/client';

interface AstronautItem {
  id: number;
  uuid: string;
  callsign: string;
  name: string;
  nationality: string;
  rank: string;
  specialization: string;
  bloodType: string;
  totalEvaHours: number;
  totalSpaceDays: number;
  evaCertified: boolean;
  status: 'nominal' | 'warning' | 'critical';
  mission: string;
}

const DEFAULT_ASTRONAUTS: AstronautItem[] = [
  {
    id: 1,
    uuid: 'ast-001',
    callsign: 'CDR-01',
    name: 'Elena Vance',
    nationality: 'United States (NASA)',
    rank: 'Commander / Flight Surgeon',
    specialization: 'Cardiothoracic Surgery & Bio-Astronautics',
    bloodType: 'O+',
    totalEvaHours: 28.5,
    totalSpaceDays: 194,
    evaCertified: true,
    status: 'nominal',
    mission: 'Artemis IV Lunar Gateway',
  },
  {
    id: 2,
    uuid: 'ast-002',
    callsign: 'PLT-02',
    name: 'Marcus Chen',
    nationality: 'Canada (CSA)',
    rank: 'Orbital Pilot / Systems Commander',
    specialization: 'Propulsion, Robotics & Orbital Navigation',
    bloodType: 'A+',
    totalEvaHours: 14.0,
    totalSpaceDays: 112,
    evaCertified: true,
    status: 'nominal',
    mission: 'Artemis IV Lunar Gateway',
  },
  {
    id: 3,
    uuid: 'ast-003',
    callsign: 'SPC-03',
    name: 'Arya Patel',
    nationality: 'ESA / Germany',
    rank: 'Biomedical Payload Specialist',
    specialization: 'Molecular Biology, Microgravity Genomics',
    bloodType: 'B+',
    totalEvaHours: 6.2,
    totalSpaceDays: 85,
    evaCertified: true,
    status: 'warning',
    mission: 'Artemis IV Lunar Gateway',
  },
  {
    id: 4,
    uuid: 'ast-004',
    callsign: 'ENG-04',
    name: 'Alexei Ivanov',
    nationality: 'ESA / France',
    rank: 'Lead Life Support Systems Engineer',
    specialization: 'ECLSS Closed-Loop Systems & Thermodynamics',
    bloodType: 'AB-',
    totalEvaHours: 32.0,
    totalSpaceDays: 240,
    evaCertified: true,
    status: 'nominal',
    mission: 'ISS Expedition 74',
  },
];

export const AstronautsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [crewList, setCrewList] = useState<AstronautItem[]>(DEFAULT_ASTRONAUTS);

  useEffect(() => {
    const loadAstronauts = async () => {
      try {
        const res = await apiClient.get('/astronauts');
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const mapped: AstronautItem[] = res.data.data.map((item: any) => ({
            id: item.id,
            uuid: item.uuid || `ast-${item.id}`,
            callsign: item.callsign,
            name: item.full_name,
            nationality: item.nationality || 'International Partner',
            rank: item.rank || 'Mission Specialist',
            specialization: item.specialization || 'Bio-Astronautics',
            bloodType: item.blood_type || 'O+',
            totalEvaHours: Number(item.total_eva_hours) || 0,
            totalSpaceDays: Number(item.total_space_days) || 0,
            evaCertified: Boolean(item.eva_certified),
            status: (item.status as any) || 'nominal',
            mission: item.mission_name || 'Artemis Program',
          }));
          setCrewList(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch astronauts from API, using cached registry', err);
      }
    };
    // oxlint-disable-next-line react/set-state-in-effect
    void loadAstronauts();
  }, []);

  const filtered = crewList.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.callsign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white tracking-wide flex items-center gap-2.5">
            <Users className="w-6 h-6 text-cyan-400" />
            NASA ASTRONAUT CREW ROSTER
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            CREW BIOMEDICAL DOSSIERS, EVA CERTIFICATIONS & BASELINE PHYSIOLOGY
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by callsign, name, specialty..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0B132B] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((astronaut) => (
          <Card key={astronaut.id} className="border-[#1E3A5F] hover:border-cyan-500/40 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#050B14] border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-sm text-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.2)]">
                  {astronaut.callsign}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{astronaut.name}</h3>
                  <p className="text-xs text-cyan-400 font-mono">{astronaut.rank}</p>
                  <p className="text-[11px] text-slate-400">{astronaut.nationality}</p>
                </div>
              </div>
              <Badge status={astronaut.status}>{astronaut.status}</Badge>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1E3A5F] space-y-2 text-xs font-mono">
              <div className="text-slate-300">
                <span className="text-slate-500">SPECIALIZATION: </span>
                <span>{astronaut.specialization}</span>
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">ASSIGNED MISSION: </span>
                <span className="text-cyan-300">{astronaut.mission}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px]">
                <div className="p-2 rounded bg-[#050B14] border border-[#1E3A5F]/60">
                  <span className="text-slate-400 block text-[10px]">TOTAL EVA</span>
                  <span className="text-cyan-400 font-bold">{astronaut.totalEvaHours} hrs</span>
                </div>
                <div className="p-2 rounded bg-[#050B14] border border-[#1E3A5F]/60">
                  <span className="text-slate-400 block text-[10px]">SPACE TIME</span>
                  <span className="text-cyan-400 font-bold">{astronaut.totalSpaceDays} days</span>
                </div>
                <div className="p-2 rounded bg-[#050B14] border border-[#1E3A5F]/60">
                  <span className="text-slate-400 block text-[10px]">BLOOD TYPE</span>
                  <span className="text-emerald-400 font-bold">{astronaut.bloodType}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1E3A5F] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>EVA SUIT CERTIFIED</span>
              </div>
              <Button variant="secondary" size="sm" className="text-xs">
                Inspect Baseline Records
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
