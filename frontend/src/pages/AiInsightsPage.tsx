import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BrainCircuit, Check, X, Edit3, Cpu, AlertTriangle } from 'lucide-react';

export const AiInsightsPage: React.FC = () => {
  const [insights, setInsights] = useState([
    {
      id: 1,
      uuid: 'ins-001',
      astronaut: 'Arya Patel (SPC-03)',
      model: 'BioCardio-Net v3.2',
      type: 'rhythm',
      title: 'Isolated Premature Ventricular Contraction (PVC) in Deep Sleep',
      confidence: 94.6,
      severity: 'medium' as const,
      description:
        'Continuous 500Hz ECG inspection flagged a single monomorphic ectopic beat occurring at MET 41:18:22 during Non-REM Stage 3. Compensatory pause observed. Baseline electrolyte review recommended.',
      recommendation: 'Correlate with serum potassium and magnesium baselines; repeat 12-lead vector ECG in 12 hours.',
      status: 'pending_review' as const,
    },
    {
      id: 2,
      uuid: 'ins-002',
      astronaut: 'Elena Vance (CDR-01)',
      model: 'NeuroCognitive-SANS v1.8',
      type: 'cognitive',
      title: 'Microgravity Cephalad Fluid Shift Compensation',
      confidence: 98.1,
      severity: 'info' as const,
      description:
        'Alpha-band EEG power spectrum shift from 8.4 Hz to 8.7 Hz. Normal autonomic adaptation to microgravity fluid redistribution. No optic disc elevation risk indicated.',
      recommendation: 'Continue routine 2-minute daily bio-scan check-in. No clinical countermeasure indicated.',
      status: 'approved' as const,
    },
    {
      id: 3,
      uuid: 'ins-003',
      astronaut: 'Marcus Chen (PLT-02)',
      model: 'HypoxiaTriage-DL v4.0',
      type: 'hypoxia',
      title: 'Transient SpO2 Dip to 94% During High-Metabolic EVA Simulation',
      confidence: 89.2,
      severity: 'high' as const,
      description:
        'Suit primary loop O2 partial pressure remained at 21.0 kPa, but astronaut SpO2 dipped briefly to 94% during 40-minute manual arm actuator torque cycle.',
      recommendation: 'Recommend Flight Surgeon inspect suit CO2 scrubber canister differential pressure.',
      status: 'pending_review' as const,
    },
  ]);

  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [surgeonNotes, setSurgeonNotes] = useState('');

  const handleDecision = (id: number, decision: 'approved' | 'rejected' | 'modified') => {
    setInsights((prev) =>
      prev.map((ins) => (ins.id === id ? { ...ins, status: decision } : ins))
    );
    setSelectedInsight(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white tracking-wide flex items-center gap-2.5">
            <BrainCircuit className="w-6 h-6 text-cyan-400" />
            AI CLINICAL INSIGHTS & FLIGHT SURGEON REVIEW
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            HUMAN-IN-THE-LOOP (HITL) MEDICAL AI VALIDATION · NASA FLIGHT SURGEON INTERVENTION
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="info">3 MODELS ACTIVE</Badge>
          <Badge status="warning">2 PENDING REVIEWS</Badge>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((ins) => (
          <Card key={ins.id} className="border-[#1E3A5F]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs text-cyan-400 font-bold">{ins.model}</span>
                <span className="text-slate-500">·</span>
                <span className="text-xs font-mono text-white font-semibold">{ins.astronaut}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">
                  Confidence: <span className="text-cyan-300 font-bold">{ins.confidence}%</span>
                </span>
                <Badge
                  status={
                    ins.status === 'approved'
                      ? 'nominal'
                      : ins.status === 'rejected'
                      ? 'critical'
                      : 'warning'
                  }
                >
                  {ins.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div className="py-4 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {ins.severity === 'high' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                {ins.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{ins.description}</p>
              <div className="p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs font-mono text-cyan-300">
                <span className="text-slate-400 font-bold block mb-1">AI CLINICAL RECOMMENDATION:</span>
                {ins.recommendation}
              </div>
            </div>

            {ins.status === 'pending_review' && (
              <div className="pt-3 border-t border-[#1E3A5F] flex flex-wrap items-center justify-end gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedInsight(ins)}
                  className="text-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Modify & Add Surgeon Notes
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDecision(ins.id, 'rejected')}
                  className="text-xs"
                >
                  <X className="w-3.5 h-3.5" /> Reject Finding
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDecision(ins.id, 'approved')}
                  className="text-xs"
                >
                  <Check className="w-3.5 h-3.5" /> Approve & Sign Diagnosis
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Modify Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl border-cyan-500/50 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
            <h3 className="text-lg font-mono font-bold text-white mb-2">
              Flight Surgeon Diagnostic Override & Review
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">{selectedInsight.title}</p>

            <textarea
              value={surgeonNotes}
              onChange={(e) => setSurgeonNotes(e.target.value)}
              placeholder="Enter official flight surgeon notes, diagnostic adjustment, and medication or rest directives..."
              rows={4}
              className="w-full p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono mb-4"
            />

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedInsight(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDecision(selectedInsight.id, 'modified')}
              >
                Save & Sign Modification
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
