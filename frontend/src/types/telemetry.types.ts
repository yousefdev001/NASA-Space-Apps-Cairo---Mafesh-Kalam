import React from 'react';

export interface OrganSystemData {
  id: string;
  name: string;
  system: string;
  score: number;
  status: 'nominal' | 'warning' | 'critical';
  metricValue: string;
  icon: React.ComponentType<{ className?: string }>;
}

