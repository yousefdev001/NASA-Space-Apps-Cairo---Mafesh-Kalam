# Phase 05 — Telemetry, Vitals & Advanced Data Visualization

## Goal
Build the core telemetry ingestion pipeline, Mission Control display layer, and a comprehensive suite of advanced real-time and historical data visualizations using Apache ECharts.

---

## Chart Library: Apache ECharts
```bash
npm install echarts echarts-for-react
```

### Why ECharts over Recharts?
| Feature | ECharts | Recharts |
|---------|---------|---------|
| ECG/waveform rendering | ✅ Canvas-based, 60fps | ❌ SVG, slow for high Hz |
| Large dataset handling | ✅ 500k+ points via downsampling | ❌ Sluggish above 10k |
| Gradient fills | ✅ Full gradient API | ⚠️ Limited |
| Polar/radar charts | ✅ Built-in | ⚠️ External plugin |
| Custom tooltip | ✅ Rich HTML | ⚠️ Basic |
| Dark theme | ✅ Built-in dark palette | ❌ Manual CSS |

---

## 5.1 Global ECharts Dark Theme Configuration
```ts
// frontend/src/utils/echartsTheme.ts
export const AURAMED_ECHARTS_THEME = {
  backgroundColor: 'transparent',
  textStyle: { color: '#E2E8F0', fontFamily: 'Inter, sans-serif' },
  color: ['#00E5FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
  grid: { borderColor: '#1E3A5F' },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#1E3A5F' } },
    axisTick: { lineStyle: { color: '#1E3A5F' } },
    axisLabel: { color: '#64748B' },
    splitLine: { lineStyle: { color: '#1E3A5F', type: 'dashed' } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#1E3A5F' } },
    axisLabel: { color: '#64748B' },
    splitLine: { lineStyle: { color: '#1E3A5F', type: 'dashed' } },
  },
  tooltip: {
    backgroundColor: 'rgba(11, 19, 43, 0.95)',
    borderColor: '#1E3A5F',
    textStyle: { color: '#E2E8F0' },
  },
};

// Register theme at app root
import * as echarts from 'echarts';
echarts.registerTheme('auramed', AURAMED_ECHARTS_THEME);

// All charts use: theme="auramed"
```

---

## 5.2 Chart Inventory — Mission Control Dashboard

### Chart 1: Real-Time Multi-Metric Vitals Stream (Line Chart — Live)
**Location:** `/mission-control` → Selected astronaut panel  
**Type:** ECharts `line` with streaming data  
**Metrics:** HR, SpO2, CoreTemp, HRV — 4 series on one chart  
**Features:**
- Rolling 5-minute window (auto-shifts left)
- Threshold band overlay (warning/critical zones as `markArea`)
- Gradient area fill per metric
- Animated entry for new data points
- Tooltip: formatted value + status badge + timestamp

```ts
// ECharts option (TypeScript):
const vitalsStreamOption: EChartsOption = {
  animation: false, // disabled for performance on live data
  grid: { top: 40, right: 20, bottom: 40, left: 55 },
  xAxis: {
    type: 'time',
    min: () => Date.now() - 5 * 60 * 1000,
    max: 'dataMax',
    axisLabel: { formatter: (val: number) => format(val, 'HH:mm:ss') },
  },
  yAxis: [
    { name: 'HR (BPM)', min: 40, max: 160, position: 'left' },
    { name: 'SpO2 (%)', min: 85, max: 100, position: 'right' },
  ],
  series: [
    {
      name: 'Heart Rate',
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#EF4444', width: 2 },
      areaStyle: { color: { type: 'linear', colorStops: [
        { offset: 0, color: 'rgba(239,68,68,0.3)' },
        { offset: 1, color: 'rgba(239,68,68,0)' },
      ]}},
      markArea: {  // Warning/critical zones
        data: [[{ yAxis: 100 }, { yAxis: 120 }]],
        itemStyle: { color: 'rgba(245,158,11,0.08)' },
      },
      data: [],  // Updated via setOption data append
    },
    {
      name: 'SpO2',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#00E5FF', width: 2 },
      data: [],
    },
  ],
};
```

---

### Chart 2: ECG Waveform (Canvas — High Performance)
**Location:** `/mission-control` → ECG panel  
**Type:** Native HTML5 Canvas (NOT ECharts — too slow for 500Hz)  
**Features:**
- 500Hz rendering loop using `requestAnimationFrame`
- Scrolling waveform (classic ECG paper style)
- Grid lines (1mm small, 5mm large — standard ECG paper)
- Color: `#00E5FF` on `#050B14` background
- Rhythm annotation strip below

```ts
// frontend/src/components/charts/EcgCanvas.tsx
class EcgRenderer {
  private ctx: CanvasRenderingContext2D;
  private buffer: number[] = [];
  private writeHead = 0;
  
  render(newSamples: number[]): void {
    // Push new samples into circular buffer
    // Draw grid (25mm/s paper speed, 10mm/mV amplitude)
    // Draw waveform line from circular buffer
    // Animate scan line position
    requestAnimationFrame(() => this.render([]));
  }
}
```

---

### Chart 3: Organ Health Radar (Radar Chart)
**Location:** `/mission-control` → Right panel overview  
**Type:** ECharts `radar`  
**Data:** 6 organ health scores (0–100%)  
**Features:**
- Hexagonal radar, 6 axes (Heart, Lungs, Brain, Liver, Kidneys, Whole Body)
- Fill color changes by overall status: emerald(nominal), amber(warning), crimson(critical)
- Animated fill on status change
- Overlay two astronauts' scores for comparison (optional)

```ts
const organRadarOption: EChartsOption = {
  radar: {
    indicator: [
      { name: 'Heart', max: 100 },
      { name: 'Lungs', max: 100 },
      { name: 'Brain', max: 100 },
      { name: 'Liver', max: 100 },
      { name: 'Kidneys', max: 100 },
      { name: 'Whole Body', max: 100 },
    ],
    shape: 'polygon',
    splitNumber: 4,
    axisName: { color: '#64748B', fontSize: 11 },
    splitArea: { areaStyle: { color: ['rgba(30,58,95,0.1)', 'rgba(30,58,95,0.2)'] } },
    splitLine: { lineStyle: { color: '#1E3A5F' } },
  },
  series: [{
    type: 'radar',
    data: [{
      value: [92, 96, 95, 92, 92, 94],
      name: 'CDR-01',
      symbol: 'none',
      lineStyle: { color: '#10B981', width: 2 },
      areaStyle: { color: 'rgba(16,185,129,0.15)' },
    }],
  }],
};
```

---

### Chart 4: Radiation Exposure Gauge (Gauge Chart)
**Location:** `/mission-control` → Radiation panel  
**Type:** ECharts `gauge`  
**Features:**
- Semicircular gauge (180°)
- Color zones: 0–0.1 emerald, 0.1–0.5 amber, 0.5+ crimson
- Current dose rate pointer + cumulative dose inner ring
- NASA/ICRP safe limit annotation

```ts
const radiationGaugeOption: EChartsOption = {
  series: [{
    type: 'gauge',
    startAngle: 180,
    endAngle: 0,
    min: 0,
    max: 1.0,
    radius: '100%',
    axisLine: {
      lineStyle: {
        width: 20,
        color: [[0.1, '#10B981'], [0.5, '#F59E0B'], [1, '#EF4444']],
      },
    },
    pointer: { itemStyle: { color: '#00E5FF' } },
    detail: {
      formatter: '{value} mSv/hr',
      color: '#E2E8F0',
      fontSize: 14,
    },
    data: [{ value: 0.042 }],
  }],
};
```

---

### Chart 5: Crew Status Comparison (Horizontal Bar)
**Location:** `/mission-control` → Crew overview sidebar  
**Type:** ECharts `bar` (horizontal)  
**Data:** Per-astronaut HR, SpO2, CoreTemp bars  
**Features:**
- Color-coded bars by status
- Baseline reference line (vertical `markLine`)
- Sorted by criticality

---

## 5.3 Chart Inventory — Astronaut Detail Page (`/astronauts/:id`)

### Chart 6: Vitals Baseline Trend (Multi-Line Area Chart)
**Location:** Astronaut detail → "Baselines" tab  
**Type:** ECharts `line` with area fill  
**Data:** 6–24 months of baseline measurements  
**Series:** HR, SpO2, CoreTemp, Weight, VO2 Max  
**Features:**
- Zoom slider (brush/dataZoom)
- Toggle series via legend
- Anomaly markers: scatter dots on data points that crossed threshold
- Average reference bands

```ts
dataZoom: [
  { type: 'inside', start: 70, end: 100 },
  { type: 'slider', bottom: 0, start: 70, end: 100 },
],
```

### Chart 7: Mission History Timeline (Custom Scatter/Bar)
**Location:** Astronaut detail → "Missions" tab  
**Type:** ECharts `custom` renderer  
**Data:** Each mission as a horizontal bar (start → end date)  
**Features:**
- Color by mission type (ISS=cyan, Lunar=amber, Mars=crimson)
- Hover shows mission details tooltip
- EVA events marked as diamond dots on the bar

### Chart 8: Medical Record Heatmap (Calendar Heatmap)
**Location:** Astronaut detail → "Medical Records" tab  
**Type:** ECharts `heatmap` with `calendar` coordinate  
**Data:** Daily medical check frequency for past 2 years  
**Features:**
- GitHub-style contribution calendar
- Color intensity = number of records that day
- Click day → show records for that date

---

## 5.4 Chart Inventory — Reports Dashboard (`/reports`)

### Chart 9: Health Score Trend Over Mission (Area Chart with Gradient)
**Location:** RPT-01 Crew Health Summary report  
**Type:** ECharts `line` stacked area  
**Features:**
- Per-astronaut health score trend (0–100%)
- Mission phase markers as `markArea` bands
- Alert events as `markPoint` triangles

### Chart 10: Alert Frequency Distribution (Bar + Line Combo)
**Location:** RPT-06 Alert Summary report  
**Type:** ECharts `bar` + `line` (dual Y-axis combo)  
**Data:** Bar = alert count per day; Line = resolution time (avg hours)  
**Features:**
- Color bars by severity distribution (stacked)
- Rolling 7-day average line overlay

### Chart 11: AI Model Accuracy Funnel (Funnel Chart)
**Location:** RPT-05 AI Validation report  
**Type:** ECharts `funnel`  
**Data:** insights_received → pending_review → reviewed → approved vs rejected  
**Features:**
- Shows bottleneck in clinical review workflow
- Approval rate percentage annotation

### Chart 12: Forensic Event Scatter (Scatter + Timeline)
**Location:** RPT-04 Forensic Timeline report  
**Type:** ECharts `scatter` on time axis  
**Data:** Events plotted by time (X) and severity (Y)  
**Features:**
- Bubble size = event duration
- Color = event type (vital anomaly=cyan, alert=crimson, EVA=amber)
- Click bubble → event detail drawer
- Zoom + pan enabled

---

## 5.5 Chart Inventory — Analytics Dashboards

### Chart 13: Mission Control Overview Sparklines
**Location:** Crew status row cards  
**Type:** ECharts `line` (mini sparkline mode, no axes)  
**Data:** Last 30 vital readings per metric  
**Features:**
- Tiny (100×30px) inline chart inside each crew card
- Trend arrow derived from slope
- Color = current status

### Chart 14: Suit/EVA Telemetry Multi-Gauge
**Location:** EVA monitoring panel  
**Type:** ECharts `gauge` × 4 (pressure, O2, CO2, battery)  
**Features:**
- 4 circular gauges in 2×2 grid
- Animated needle transitions
- Critical threshold red zone

### Chart 15: Radiation Cumulative Dose Progress Bar
**Location:** Mission Control sidebar  
**Type:** ECharts `bar` horizontal (single bar)  
**Data:** cumulative_dose_msv vs NASA career limit (1000 mSv)  
**Features:**
- Shows % of career dose used
- Color: emerald < 20%, amber 20–60%, crimson > 60%
- Tooltip: days at current rate until limit

---

## 5.6 Chart Inventory — Space Academy (`/academy`)

### Chart 16: Personal XP Progress Line Chart
**Location:** `/academy/progress`  
**Type:** ECharts `line` area  
**Data:** Daily XP accumulation over time  
**Features:**
- Rank threshold horizontal lines (100, 300, 600, 1000, 2000 XP)
- Next rank highlighted zone
- Badge earning events marked as icons

### Chart 17: Course Completion Radar (Progress Radar)
**Location:** `/academy/progress`  
**Type:** ECharts `radar`  
**Data:** 8 adult course tracks completion %  
**Features:**
- Shows learning profile shape
- Completed courses filled in emerald
- In-progress in amber, not-started in deep-void

### Chart 18: Academy Leaderboard Bar Chart (Horizontal Ranked Bar)
**Location:** `/academy/leaderboard`  
**Type:** ECharts `bar` (horizontal, ranked)  
**Features:**
- Medal emojis for top 3
- Current user highlighted in cyan
- Animated entry when page loads (bar grows from 0)

---

## 5.7 Shared Chart Components Architecture

```
frontend/src/components/charts/
├── EcgCanvas.tsx              ← Native canvas ECG renderer
├── VitalsStreamChart.tsx      ← Real-time multi-metric line
├── OrganRadarChart.tsx        ← 6-organ radar
├── RadiationGauge.tsx         ← Semicircular gauge
├── BaselineTrendChart.tsx     ← Multi-line area with zoom
├── MissionTimelineChart.tsx   ← Horizontal Gantt-style
├── HealthHeatmap.tsx          ← Calendar contribution heatmap
├── AlertFrequencyChart.tsx    ← Bar+line combo
├── AiFunnelChart.tsx          ← Funnel chart
├── ForensicScatterChart.tsx   ← Scatter on time axis
├── SparklineChart.tsx         ← Mini inline sparklines
├── SuitGauge.tsx              ← EVA multi-gauge
├── XpProgressChart.tsx        ← Academy XP line
├── CourseRadarChart.tsx       ← Academy completion radar
├── LeaderboardChart.tsx       ← Ranked horizontal bar
└── shared/
    ├── ChartWrapper.tsx       ← ECharts wrapper with theme + resize
    └── ChartSkeleton.tsx      ← Loading placeholder (pulse animation)
```

### ChartWrapper (Reusable Base)
```tsx
// All charts use this wrapper to avoid boilerplate
interface ChartWrapperProps {
  option: EChartsOption;
  height?: string;    // default '300px'
  loading?: boolean;
  onEvents?: Record<string, (params: any) => void>;
}

function ChartWrapper({ option, height = '300px', loading, onEvents }: ChartWrapperProps) {
  return (
    <div className="bg-cosmic-navy border border-hud-border rounded-xl overflow-hidden">
      {loading ? (
        <ChartSkeleton height={height} />
      ) : (
        <ReactECharts
          echarts={echarts}
          option={option}
          theme="auramed"
          style={{ height }}
          notMerge={false}
          lazyUpdate={true}
          onEvents={onEvents}
        />
      )}
    </div>
  );
}
```

---

## 5.8 Chart Data API Endpoints

| Endpoint | Returns | Used By |
|----------|---------|---------|
| `GET /api/telemetry/{astronaut}/vitals?from=&to=&metrics[]=` | Time-series vitals data | Charts 1, 6 |
| `GET /api/telemetry/{astronaut}/organs/latest` | 6 organ scores | Chart 3 |
| `GET /api/telemetry/{astronaut}/aggregates?period=daily&from=&to=` | Daily aggregates | Charts 6, 9 |
| `GET /api/telemetry/{astronaut}/ecg/latest` | ECG waveform samples | Chart 2 |
| `GET /api/telemetry/{astronaut}/radiation` | Radiation time-series | Charts 4, 15 |
| `GET /api/telemetry/{astronaut}/suit/latest` | EVA suit telemetry | Chart 14 |
| `GET /api/reports/{id}/chart-data` | Pre-computed chart data for report | Charts 9–12 |
| `GET /api/alerts/chart-data?from=&to=` | Alert frequency per day | Chart 10 |
| `GET /api/ai-insights/chart-data` | AI funnel metrics | Chart 11 |
| `GET /api/academy/my-progress/chart-data` | XP timeline + course completion | Charts 16, 17 |
| `GET /api/academy/leaderboard` | Ranked XP list | Chart 18 |

---

## 5.9 Backend — Telemetry Ingestion (Unchanged)
*(See original plan — bulk insert, chunked at 100, threshold check, dedup)*

## 5.10 Chart Data Query Optimization
```php
// Time-series data for charts — NEVER load all readings
// Use aggregates for ranges > 24 hours
class TelemetryChartService
{
    public function getVitalsTimeSeries(
        int $astronautId,
        Carbon $from,
        Carbon $to,
        array $metrics
    ): Collection {
        $diffHours = $from->diffInHours($to);
        
        if ($diffHours <= 1) {
            // Raw readings (sub-minute resolution)
            return VitalReading::select(array_merge(['measured_at'], $metrics))
                ->where('astronaut_id', $astronautId)
                ->whereBetween('measured_at', [$from, $to])
                ->orderBy('measured_at')
                ->get();
        } elseif ($diffHours <= 24) {
            // 5-minute bucket aggregates (from raw, computed on-the-fly)
            return VitalReading::select([
                DB::raw("DATE_FORMAT(measured_at, '%Y-%m-%d %H:%i') as bucket"),
                ...array_map(fn($m) => DB::raw("AVG($m) as $m"), $metrics),
            ])
            ->where('astronaut_id', $astronautId)
            ->whereBetween('measured_at', [$from, $to])
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get();
        } else {
            // Pre-computed hourly/daily aggregates table
            return TelemetryAggregate::where('astronaut_id', $astronautId)
                ->where('period_type', $diffHours <= 168 ? 'hourly' : 'daily')
                ->whereBetween('period_start', [$from, $to])
                ->whereIn('metric_name', $metrics)
                ->orderBy('period_start')
                ->get();
        }
    }
}
```

---

## 5.11 Mission Control Dashboard Layout (Updated with Charts)
```
┌──────────────────────────────────────────────────────────────────┐
│  🛰️ AURAMED MISSION CONTROL   MET: T+45:12:33    [⚠️ 2 Alerts]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ACTIVE MISSION: ARTEMIS IV   Status: ● NOMINAL                 │
│                                                                  │
├─────────────────────┬────────────────────┬───────────────────────┤
│  CREW STATUS        │  ORGAN RADAR       │  RADIATION GAUGE     │
│  ─────────────────  │  (Hexagonal)       │  (Semicircle)        │
│  [CDR-01] NOMINAL   │  Spiderweb of      │  0.042 mSv/hr       │
│  [PLT-02] WARNING   │  6 organ scores    │  Career: 4.2% used  │
│  [SPC-03] NOMINAL   │                    │                      │
├─────────────────────┴────────────────────┴───────────────────────┤
│  REAL-TIME VITALS STREAM (Selected: CDR-01 — Elena Vance)       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ~~~HR: 62 BPM~~~  ~~~SpO2: 97%~~~  ~~~Temp: 36.7°C~~~    │  │
│  │  [Live 5-min rolling window — 4 series line chart]        │  │
│  └────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ECG WAVEFORM (Canvas — 500Hz)                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ─/\─────/\──────────/\─────/\──── [cyan on dark bg]      │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────┬──────────────────────────────────────┤
│  ORGAN TELEMETRY GRID    │  CABIN ENVIRONMENT                  │
│  (6 cards: mobile-match) │  O2: 21.3% | CO2: 0.4% | P: 101kPa │
│  Heart | Lungs           │  Temp: 22.1°C | Humidity: 48%      │
│  Brain | Liver           │  [Bar gauges for each metric]      │
│  Kidneys | Whole Body    │                                     │
├──────────────────────────┴──────────────────────────────────────┤
│  CREW SPARKLINES (mini charts per astronaut per metric)         │
│  CDR-01: HR ~~~ SpO2 ~~~ Temp ~~~                              │
│  PLT-02: HR ~~⚡~ SpO2 ~~~ Temp ~~~  ← spike visible in spark  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deliverables for Phase 05
- [ ] `POST /api/telemetry/ingest` with batch processing + chunked inserts
- [ ] All telemetry read + chart data endpoints
- [ ] `TelemetryService` with threshold checking + dedup
- [ ] `TelemetryChartService` with smart time-resolution (raw/5min/hourly/daily)
- [ ] `TelemetryAggregatesCommand` scheduled job
- [ ] `GET /api/dashboard/mission-control` with 60s cache
- [ ] ECharts installed + dark theme registered globally
- [ ] `ChartWrapper` + `ChartSkeleton` base components
- [ ] All 18 charts implemented (see inventory above)
- [ ] `EcgCanvas` native canvas renderer (500Hz)
- [ ] `OrganRadarChart` (6 organs)
- [ ] `RadiationGauge` with career limit
- [ ] `VitalsStreamChart` real-time rolling window
- [ ] `BaselineTrendChart` with dataZoom slider
- [ ] Mission Control full layout
- [ ] OrganTelemetryGrid (6 cards matching mobile screenshot)
- [ ] Cabin environment panel
- [ ] Sparklines per crew card
- [ ] 30-second polling via React Query
