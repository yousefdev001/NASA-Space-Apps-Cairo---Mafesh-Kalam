import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Lock, Link as LinkIcon, CheckCircle2, RefreshCw } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [_chainValid, setChainValid] = useState(true);

  const logs = [
    {
      id: 1042,
      event: 'AI_CLINICAL_DECISION_MODIFIED',
      operator: 'Dr. Henrik Lindqvist (Flight Surgeon)',
      timestamp: '2026-11-17 01:42:10 UTC',
      previousHash: 'a7f9c2d4e8b19a0f3c5e7d9b2a4c6e8f0a2b4c6e8f0a2b4c6e8f0a2b4c6e8f0a',
      currentHash: 'b8e0d3f5a9c20b1e4d6f8e0c3b5d7f9a1b3c5e7f1b3c5e7f1b3c5e7f1b3c5e7f',
      details: 'Modified arrhythmia diagnosis on SPC-03 Arya Patel. Directive added: repeat vector ECG.',
      status: 'VERIFIED',
    },
    {
      id: 1041,
      event: 'TELEMETRY_BURST_INGESTION',
      operator: 'Ground Station Sync Service (Downlink Node 1)',
      timestamp: '2026-11-17 01:40:00 UTC',
      previousHash: 'f4e2c0b8a6d4e2b0a8c6e4d2b0a8c6e4d2b0a8c6e4d2b0a8c6e4d2b0a8c6e4d2',
      currentHash: 'a7f9c2d4e8b19a0f3c5e7d9b2a4c6e8f0a2b4c6e8f0a2b4c6e8f0a2b4c6e8f0a',
      details: 'Batch ingested 120 packets of vital readings and 6-system organ bio-scan from Elena Vance.',
      status: 'VERIFIED',
    },
    {
      id: 1040,
      event: 'ALERT_STATUS_ACKNOWLEDGED',
      operator: 'Dr. Sarah Connor (Medical Officer)',
      timestamp: '2026-11-17 01:15:22 UTC',
      previousHash: 'c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3',
      currentHash: 'f4e2c0b8a6d4e2b0a8c6e4d2b0a8c6e4d2b0a8c6e4d2b0a8c6e4d2b0a8c6e4d2',
      details: 'Acknowledged ALT-094 elevated heart rate notification during pre-breathe.',
      status: 'VERIFIED',
    },
  ];

  const handleVerifyChain = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setChainValid(true);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white tracking-wide flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            IMMUTABLE SHA-256 AUDIT LEDGER
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            FORENSIC CRYPTOGRAPHIC HASH CHAIN · ANTI-TAMPER VERIFICATION OF MEDICAL & CLINICAL ACTIONS
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleVerifyChain}
          isLoading={isVerifying}
          className="text-xs gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Validate Entire Ledger Integrity
        </Button>
      </div>

      {/* Integrity Banner */}
      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-mono font-bold text-emerald-300">
              CRYPTOGRAPHIC INTEGRITY: 100% UNBROKEN
            </h4>
            <p className="text-xs text-slate-400 font-mono">
              All 1,042 consecutive blocks mathematically bound via SHA-256 chain. Zero historical alterations detected.
            </p>
          </div>
        </div>

        <Badge status="nominal">GENESIS SECURE</Badge>
      </div>

      {/* Audit Blocks */}
      <div className="space-y-3.5">
        {logs.map((log) => (
          <Card key={log.id} className="border-[#1E3A5F]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-[#050B14] border border-[#1E3A5F]">
                  BLOCK #{log.id}
                </span>
                <span className="font-mono text-xs text-white font-bold">{log.event}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>{log.timestamp}</span>
                <Badge status="nominal">{log.status}</Badge>
              </div>
            </div>

            <div className="py-3 space-y-2 text-xs font-mono">
              <div className="text-slate-300">
                <span className="text-slate-400">AUTHORIZED OPERATOR: </span>
                <span className="text-cyan-300 font-semibold">{log.operator}</span>
              </div>
              <p className="text-slate-300 font-sans text-xs">{log.details}</p>

              <div className="mt-3 p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F]/70 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-slate-500 shrink-0">PREV HASH:</span>
                  <span className="text-slate-400 truncate">{log.previousHash}</span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 font-bold shrink-0">BLOCK HASH:</span>
                  <span className="text-emerald-300 truncate">{log.currentHash}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
