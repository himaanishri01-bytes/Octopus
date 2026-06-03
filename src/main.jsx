import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  BellRing,
  BrainCircuit,
  Gauge,
  Play,
  MapPinned,
  RadioTower,
  Satellite,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Sparkles,
  Waves
} from "lucide-react";
import "./styles.css";

const thresholdReference = {
  pH: {
    label: "pH",
    unit: "",
    safe: "6.5-8.5",
    warning: "6.0-6.4",
    high: "5.0-5.9",
    critical: "Below 5.0",
    action: {
      WARNING: "Increase sampling cadence and watch for acidification drift.",
      "HIGH RISK": "Dispatch field verification and isolate upstream inflow.",
      CRITICAL: "Issue immediate contamination alert and begin source tracking."
    },
    classify: (value) => {
      if (value < 5 || value > 10) return "CRITICAL";
      if ((value >= 5 && value < 6) || value > 9) return "HIGH RISK";
      if ((value >= 6 && value < 6.5) || value > 8.5) return "WARNING";
      return "NORMAL";
    }
  },
  dissolvedOxygen: {
    label: "Dissolved Oxygen",
    unit: "mg/L",
    safe: "Above 6",
    warning: "5-6",
    high: "3-5",
    critical: "Below 3",
    action: {
      WARNING: "Monitor oxygen depletion trend and verify aeration conditions.",
      "HIGH RISK": "Notify water authority and investigate organic load.",
      CRITICAL: "Trigger emergency ecological response for hypoxic conditions."
    },
    classify: (value) => {
      if (value < 3) return "CRITICAL";
      if (value < 5) return "HIGH RISK";
      if (value <= 6) return "WARNING";
      return "NORMAL";
    }
  },
  conductivity: {
    label: "Conductivity",
    unit: "uS/cm",
    safe: "50-500",
    warning: "500-1000",
    high: "1000-2000",
    critical: "Above 2000",
    action: {
      WARNING: "Track ionic load and compare against baseline conductivity.",
      "HIGH RISK": "Inspect discharge points for saline or industrial input.",
      CRITICAL: "Escalate to authority and lock vector toward strongest gradient."
    },
    classify: (value) => {
      if (value < 50 || value > 2000) return "CRITICAL";
      if (value > 1000) return "HIGH RISK";
      if (value > 500) return "WARNING";
      return "NORMAL";
    }
  },
  turbidity: {
    label: "Turbidity",
    unit: "NTU",
    safe: "Below 5",
    warning: "5-10",
    high: "10-20",
    critical: "Above 20",
    action: {
      WARNING: "Increase suspended solids monitoring and validate optical sensor.",
      "HIGH RISK": "Investigate runoff plume and sediment disturbance.",
      CRITICAL: "Alert management and trace acute particulate contamination."
    },
    classify: (value) => {
      if (value > 20) return "CRITICAL";
      if (value > 10) return "HIGH RISK";
      if (value >= 5) return "WARNING";
      return "NORMAL";
    }
  },
  ORP: {
    label: "ORP",
    unit: "mV",
    safe: "300-650",
    warning: "250-299",
    high: "150-249",
    critical: "Below 150",
    action: {
      WARNING: "Watch oxidation-reduction drop and correlate with DO readings.",
      "HIGH RISK": "Investigate reducing pollutants or chemical discharge.",
      CRITICAL: "Confirm severe reducing conditions and alert responders."
    },
    classify: (value) => {
      if (value < 150 || value > 750) return "CRITICAL";
      if (value < 250 || value > 650) return "HIGH RISK";
      if (value < 300) return "WARNING";
      return "NORMAL";
    }
  },
  temperature: {
    label: "Water Temperature",
    unit: "C",
    safe: "20-30",
    warning: "30-35",
    high: "35-40",
    critical: "Above 40",
    action: {
      WARNING: "Monitor thermal loading and compare with weather baseline.",
      "HIGH RISK": "Inspect warm-water discharge or stagnant zone formation.",
      CRITICAL: "Alert authority to acute thermal pollution risk."
    },
    classify: (value) => {
      if (value > 40 || value < 5) return "CRITICAL";
      if (value > 35 || value < 15) return "HIGH RISK";
      if (value > 30 || value < 20) return "WARNING";
      return "NORMAL";
    }
  },
  nitrates: {
    label: "Nitrates",
    unit: "mg/L",
    safe: "Below 10",
    warning: "10-20",
    high: "20-40",
    critical: "Above 40",
    action: {
      WARNING: "Flag nutrient rise and continue trend logging.",
      "HIGH RISK": "Investigate agricultural runoff or wastewater intrusion.",
      CRITICAL: "Notify management of acute nitrate contamination."
    },
    classify: (value) => {
      if (value > 40) return "CRITICAL";
      if (value > 20) return "HIGH RISK";
      if (value >= 10) return "WARNING";
      return "NORMAL";
    }
  },
  heavyMetals: {
    label: "Heavy Metals",
    unit: "mg/L",
    safe: "Below 0.01",
    warning: "0.01-0.05",
    high: "0.05-0.1",
    critical: "Above 0.1",
    action: {
      WARNING: "Queue confirmatory sampling and watch persistence.",
      "HIGH RISK": "Alert industrial compliance team and isolate likely source.",
      CRITICAL: "Trigger hazardous contamination protocol immediately."
    },
    classify: (value) => {
      if (value > 0.1) return "CRITICAL";
      if (value > 0.05) return "HIGH RISK";
      if (value >= 0.01) return "WARNING";
      return "NORMAL";
    }
  }
};

const severityMeta = {
  NORMAL: {
    score: 0,
    tone: "green",
    label: "NORMAL",
    decision: "Continue Passive Monitoring",
    interpretation: "Water conditions remain stable. No contamination indicators detected."
  },
  WARNING: {
    score: 25,
    tone: "yellow",
    label: "WARNING",
    decision: "Increase Monitoring Frequency",
    interpretation: "Minor deviation detected in {parameter} levels. Increased observation recommended."
  },
  "HIGH RISK": {
    score: 65,
    tone: "orange",
    label: "HIGH RISK",
    decision: "Activate Hunt Mode",
    interpretation: "Abnormal {parameter} concentration detected. Potential contamination event identified."
  },
  CRITICAL: {
    score: 100,
    tone: "red",
    label: "CRITICAL",
    decision: "Notify Environmental Authorities",
    interpretation: "Severe {parameter} contamination detected. Immediate environmental intervention required."
  }
};

const directionOptions = [
  { label: "North", value: 0 },
  { label: "North East", value: 45 },
  { label: "East", value: 90 },
  { label: "South East", value: 135 },
  { label: "South", value: 180 },
  { label: "South West", value: 225 },
  { label: "West", value: 270 },
  { label: "North West", value: 315 }
];

const pollutantProfiles = {
  industrial: {
    label: "Industrial Spill",
    accent: "Electric cyan",
    weights: { conductivity: 1.35, heavyMetals: 1.55, ORP: 1.2, turbidity: 0.75, pH: 0.9 }
  },
  nutrient: {
    label: "Nutrient Runoff",
    accent: "Algae green",
    weights: { nitrates: 1.65, dissolvedOxygen: 1.25, turbidity: 0.9, temperature: 0.55 }
  },
  sediment: {
    label: "Sediment Plume",
    accent: "Amber glow",
    weights: { turbidity: 1.7, conductivity: 0.75, nitrates: 0.7, heavyMetals: 0.55 }
  },
  thermal: {
    label: "Thermal Discharge",
    accent: "Solar red",
    weights: { temperature: 1.75, dissolvedOxygen: 1.35, ORP: 0.75 }
  },
  acidic: {
    label: "Acidic Leak",
    accent: "Violet pulse",
    weights: { pH: 1.75, ORP: 1.2, heavyMetals: 1.1, conductivity: 0.9 }
  }
};

const defaultScenario = {
  direction: 225,
  distance: 420,
  intensity: 82,
  profile: "industrial",
  favorite: "Neon Coral"
};

const params = Object.keys(thresholdReference);
const tentacleNames = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const contaminationAngles = [0, 45, 90, 135, 180, 225, 270, 315];
const directionalParameters = {
  N: "pH",
  NE: "turbidity",
  E: "conductivity",
  SE: "nitrates",
  S: "dissolvedOxygen",
  SW: "temperature",
  W: "ORP",
  NW: "heavyMetals"
};
const formatName = (name) => thresholdReference[name]?.label ?? name;
const formatDirectionalName = (name) => (name === "temperature" ? "Temperature" : formatName(name));
const formatValue = (param, value) => {
  const unit = thresholdReference[param].unit;
  const decimals = param === "heavyMetals" ? 3 : param === "pH" ? 2 : 1;
  return `${value.toFixed(decimals)}${unit ? ` ${unit}` : ""}`;
};
const formatSafeRange = (param) => `${thresholdReference[param].safe}${thresholdReference[param].unit ? ` ${thresholdReference[param].unit}` : ""}`;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomIn(min, max) {
  return min + Math.random() * (max - min);
}

function angularDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function valueForParam(param, intensity, profileKey = "industrial") {
  const weight = pollutantProfiles[profileKey]?.weights[param] ?? 0.45;
  const stress = clamp((intensity / 100) * weight, 0, 1.8);

  if (param === "pH") return clamp(randomIn(6.8, 8.1) - stress * randomIn(0.2, 2.6), 3.9, 8.4);
  if (param === "turbidity") return randomIn(0.4, 3.8) + stress * randomIn(2, 25);
  if (param === "dissolvedOxygen") return clamp(randomIn(7.2, 11.4) - stress * randomIn(1.2, 7.2), 1.1, 13.5);
  if (param === "conductivity") return randomIn(80, 430) + stress * randomIn(320, 2600);
  if (param === "ORP") return clamp(randomIn(360, 610) - stress * randomIn(70, 360), 80, 690);
  if (param === "nitrates") return randomIn(1.2, 8.8) + stress * randomIn(4, 48);
  if (param === "heavyMetals") return randomIn(0.001, 0.008) + stress * randomIn(0.004, 0.13);
  if (param === "temperature") return randomIn(21, 28) + stress * randomIn(3, 18);
  return 0;
}

function evaluate(values) {
  const analyses = params.map((param) => {
    const severity = thresholdReference[param].classify(values[param]);
    return {
      param,
      value: values[param],
      severity,
      score: severityMeta[severity].score,
      action: thresholdReference[param].action[severity] ?? "Continue monitoring and archive historical logs."
    };
  });
  const worst = analyses.reduce((max, item) => (item.score > max.score ? item : max), analyses[0]);
  const score = Math.round(analyses.reduce((sum, item) => sum + item.score, 0) / analyses.length);
  const breaches = analyses.filter((item) => item.severity !== "NORMAL").length;
  const huntEligible = analyses.some((item) => item.severity === "HIGH RISK" || item.severity === "CRITICAL");

  return {
    analyses,
    breaches,
    score,
    severity: worst.severity,
    worst,
    huntEligible,
    ok: worst.severity === "NORMAL"
  };
}

function generateTick(previous, huntConfirmed, scenario = defaultScenario) {
  const sourceDirection = scenario.direction ?? previous?.sourceDirection ?? randomIn(0, 360);
  const driftedSource = (sourceDirection + randomIn(-2.5, 2.5) + 360) % 360;
  const distanceAttenuation = clamp(1 / (1 + scenario.distance / 850), 0.22, 0.98);
  const profileBoost = huntConfirmed ? 1.08 : 1;
  const sourcePower = clamp(scenario.intensity * distanceAttenuation * profileBoost + randomIn(-3, 7), 8, 100);

  const tentacles = tentacleNames.map((name, index) => {
    const angle = contaminationAngles[index];
    const proximity = 1 - angularDistance(angle, driftedSource) / 180;
    const intensity = clamp(sourcePower * Math.pow(proximity, 1.25) + randomIn(0, 10), 2, 100);
    const values = Object.fromEntries(params.map((param) => [param, valueForParam(param, intensity, scenario.profile)]));
    const status = evaluate(values);
    return { id: index + 1, name, angle, intensity, values, ...status };
  });

  const strongest = tentacles.reduce((max, item) => {
    if (item.score > max.score) return item;
    if (item.score === max.score && item.intensity > max.intensity) return item;
    return max;
  }, tentacles[0]);
  const anomalies = tentacles.filter((item) => !item.ok);
  const confirmed = tentacles.some((item) => item.huntEligible);
  const mode = confirmed ? "HUNT MODE" : "MONITORING";
  const avgIntensity = Math.round(tentacles.reduce((sum, item) => sum + item.intensity, 0) / tentacles.length);
  const log = {
    time: new Date().toLocaleTimeString([], { hour12: false }),
    tentacle: strongest.name,
    severity: strongest.severity,
    parameter: strongest.worst.param,
    value: strongest.worst.value,
    action: strongest.worst.action,
    message:
      strongest.severity === "NORMAL"
        ? "Stable scan archived across 8 tentacles"
        : `${formatName(strongest.worst.param)} ${formatValue(strongest.worst.param, strongest.worst.value)} detected at Tentacle ${strongest.name}`
  };

  return {
    tentacles,
    sourceDirection: driftedSource,
    vector: strongest.angle,
    strongest,
    anomalies,
    mode,
    confirmed,
    avgIntensity,
    log
  };
}

function decisionForSeverity(severity, huntEligible) {
  if (severity === "CRITICAL") return "Initiate Source Vectoring";
  if (severity === "HIGH RISK" && huntEligible) return "Activate Hunt Mode";
  return severityMeta[severity].decision;
}

function createVerdicts(tick, cycle = 0) {
  const timestamp = new Date().toLocaleTimeString([], { hour12: false });

  return tick.tentacles.map((tentacle) => {
    const param = directionalParameters[tentacle.name];
    const analysis = tentacle.analyses.find((item) => item.param === param);
    const parameter = formatDirectionalName(param);
    const severity = analysis.severity;
    const interpretation = severityMeta[severity].interpretation.replace("{parameter}", parameter.toLowerCase());

    return {
      id: `${cycle}-${tentacle.name}-${timestamp}`,
      timestamp,
      source: `${tentacle.name} : ${parameter}`,
      tentacle: tentacle.name,
      param,
      parameter,
      value: analysis.value,
      safeRange: formatSafeRange(param),
      severity,
      interpretation,
      recommendedAction: analysis.action,
      decision: decisionForSeverity(severity, tentacle.huntEligible)
    };
  });
}

function Metric({ label, value, tone = "cyan" }) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Panel({ title, icon: Icon, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-title">
        <Icon size={18} />
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function OctopusCore({ tick }) {
  return (
    <div className="octopus-stage">
      <div className="sonar-ring ring-a" />
      <div className="sonar-ring ring-b" />
      <div className="sonar-ring ring-c" />
      <div className="orbit-line" />
      <div
        className="source-vector"
        style={{ transform: `rotate(${tick.vector}deg)` }}
        aria-label="Estimated contamination direction"
      />
      {tick.tentacles.map((tentacle) => (
        <div
          key={tentacle.id}
          className={`tentacle severity-${severityMeta[tentacle.severity].tone}`}
          style={{
            "--angle": `${tentacle.angle}deg`,
            "--heat": tentacle.intensity / 100,
            "--severity-score": tentacle.score / 100
          }}
        >
          <div className="tentacle-line" />
          <div className="tentacle-node">
            <span>{tentacle.name} : {formatDirectionalName(directionalParameters[tentacle.name])}</span>
            <b>{tentacle.severity}</b>
          </div>
        </div>
      ))}
      <div className={`brain ${tick.confirmed ? "brain-alert" : ""}`}>
        <BrainCircuit size={50} />
        <span>OCTOPUS</span>
        <strong>{tick.mode}</strong>
      </div>
    </div>
  );
}

function SensorCards({ tentacles }) {
  return (
    <div className="sensor-grid">
      {tentacles.map((item) => (
        <article key={item.id} className={`sensor-card severity-${severityMeta[item.severity].tone}`}>
          <header className="sensor-head">
            <span className="sensor-name">Tentacle {item.name}</span>
            <strong>{item.severity}</strong>
          </header>
          <Gauge size={18} />
          <div className="heatbar">
            <i style={{ width: `${Math.max(item.score, item.intensity * 0.55)}%` }} />
          </div>
          <small>
            {formatName(item.worst.param)} {formatValue(item.worst.param, item.worst.value)} | Score {item.score}
          </small>
        </article>
      ))}
    </div>
  );
}

function AIEngine({ tick }) {
  const confidence = clamp(58 + tick.anomalies.length * 8 + tick.strongest.intensity / 4, 64, 99);
  return (
    <Panel title="AI Engine" icon={BrainCircuit}>
      <div className="ai-stack">
        <Metric label="Anomaly Count" value={tick.anomalies.length} tone={tick.confirmed ? "red" : "green"} />
        <Metric label="Vector Confidence" value={`${Math.round(confidence)}%`} />
        <Metric label="Severity Score" value={tick.strongest.score} tone={severityMeta[tick.strongest.severity].tone} />
      </div>
      <div className="decision-box">
        <span>{tick.confirmed ? "Anomaly detection locked" : "Scientific ranges nominal"}</span>
        <strong>
          {tick.confirmed
            ? `${tick.strongest.severity} ${formatName(tick.strongest.worst.param).toLowerCase()} contamination toward ${tick.strongest.name}`
            : "Continue monitoring and archive historical logs"}
        </strong>
      </div>
    </Panel>
  );
}

function ManagementPanel({ tick }) {
  return (
    <Panel title="Management System" icon={ShieldCheck}>
      <div className="management-grid">
        <Metric label="Hunt Trigger" value={tick.confirmed ? "ACTIVE" : "STANDBY"} tone={tick.confirmed ? "red" : "green"} />
        <Metric label="Worst Node" value={tick.strongest.name} tone={severityMeta[tick.strongest.severity].tone} />
      </div>
      <div className={`authority ${tick.confirmed ? "authority-alert" : ""}`}>
        <Satellite size={18} />
        <span>{tick.confirmed ? "Alert confirmed, hunt mode authorized" : "Authority uplink receiving live telemetry"}</span>
      </div>
    </Panel>
  );
}

function SafeRangeReferencePanel() {
  return (
    <Panel title="Safe Range Reference" icon={AlertTriangle}>
      <div className="threshold-table">
        <div className="threshold-head">
          <span>Parameter</span>
          <span>Safe</span>
          <span>Warning</span>
          <span>High Risk</span>
          <span>Critical</span>
        </div>
        {params.map((param) => {
          const item = thresholdReference[param];
          return (
            <div key={param} className="threshold-row">
              <b>{item.label}</b>
              <span className="range-normal">{item.safe}</span>
              <span className="range-warning">{item.warning}</span>
              <span className="range-high">{item.high}</span>
              <span className="range-critical">{item.critical}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ScenarioControlPanel({ scenario, onChange, onRunTest }) {
  const update = (key, value) => onChange((current) => ({ ...current, [key]: value }));

  return (
    <Panel title="Viewer Test Console" icon={SlidersHorizontal}>
      <div className="control-grid">
        <label>
          <span>Source Direction</span>
          <select value={scenario.direction} onChange={(event) => update("direction", Number(event.target.value))}>
            {directionOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Pollution Type</span>
          <select value={scenario.profile} onChange={(event) => update("profile", event.target.value)}>
            {Object.entries(pollutantProfiles).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Distance: {scenario.distance} m</span>
          <input
            type="range"
            min="50"
            max="2000"
            step="25"
            value={scenario.distance}
            onChange={(event) => update("distance", Number(event.target.value))}
          />
        </label>
        <label>
          <span>Source Intensity: {scenario.intensity}%</span>
          <input
            type="range"
            min="10"
            max="100"
            step="1"
            value={scenario.intensity}
            onChange={(event) => update("intensity", Number(event.target.value))}
          />
        </label>
        <label className="favorite-input">
          <span>Viewer Favorite Tag</span>
          <input
            value={scenario.favorite}
            maxLength="18"
            onChange={(event) => update("favorite", event.target.value)}
            placeholder="Neon Coral"
          />
        </label>
      </div>
      <button className="run-test" onClick={onRunTest}>
        <Play size={17} />
        Run Contamination Test
      </button>
    </Panel>
  );
}

function TestResultsPanel({ tick, scenario }) {
  const profile = pollutantProfiles[scenario.profile];
  const estimatedDistance = Math.round(scenario.distance * clamp(1 + (100 - tick.strongest.intensity) / 180, 0.9, 1.45));

  return (
    <Panel title="Test Results Analysis" icon={Sparkles}>
      <div className="result-banner">
        <span>{scenario.favorite || "Viewer"} scenario</span>
        <strong>{profile.label}</strong>
      </div>
      <div className="result-grid">
        <Metric label="Placed Distance" value={`${scenario.distance} m`} />
        <Metric label="Estimated Source" value={`${estimatedDistance} m`} />
        <Metric label="Risk Outcome" value={tick.strongest.severity} tone={severityMeta[tick.strongest.severity].tone} />
      </div>
      <div className={`analysis-strip severity-${severityMeta[tick.strongest.severity].tone}`}>
        <b>{formatName(tick.strongest.worst.param)}</b>
        <span>{formatValue(tick.strongest.worst.param, tick.strongest.worst.value)}</span>
        <small>{tick.strongest.worst.action}</small>
      </div>
    </Panel>
  );
}

function AlertFeed({ logs }) {
  return (
    <Panel title="Alert Feed" icon={BellRing}>
      <div className="feed">
        {logs.map((log, index) => (
          <div
            key={`${log.time}-${index}`}
            className={`feed-item severity-${severityMeta[log.severity].tone}`}
          >
            <span>{log.time}</span>
            <strong>{log.severity}</strong>
            <p>{log.message}</p>
            {log.parameter && log.severity !== "NORMAL" && (
              <small>
                Action: {log.action}
              </small>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AIVerdictPanel({ verdicts }) {
  return (
    <Panel title="AI VERDICT PANEL" icon={BrainCircuit}>
      <div className="verdict-feed">
        {verdicts.map((verdict) => (
          <article
            key={verdict.id}
            className={`verdict-card severity-${severityMeta[verdict.severity].tone}`}
          >
            <header>
              <span>[{verdict.source}]</span>
              <time>{verdict.timestamp}</time>
            </header>
            <div className="verdict-grid">
              <span>Parameter</span>
              <b>{verdict.parameter}</b>
              <span>Live Value</span>
              <b>{formatValue(verdict.param, verdict.value)}</b>
              <span>Safe Range</span>
              <b>{verdict.safeRange}</b>
              <span>Severity</span>
              <b className="verdict-severity">{verdict.severity}</b>
            </div>
            <div className="verdict-copy">
              <span>AI Verdict</span>
              <p>{verdict.interpretation}</p>
              <span>Recommended Action</span>
              <p>{verdict.recommendedAction}</p>
              <span>AI Decision Status</span>
              <strong>{verdict.decision}</strong>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function HeatMatrix({ tentacles }) {
  return (
    <Panel title="Contamination Intensity" icon={Waves}>
      <div className="heat-matrix">
        {tentacles.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`intensity-tile severity-${severityMeta[item.severity].tone}`}
            style={{ "--heat": item.score / 100 }}
            aria-label={`${item.name} ${formatDirectionalName(directionalParameters[item.name])} ${item.severity}`}
          >
            <span>{item.name}</span>
            <b>{formatDirectionalName(directionalParameters[item.name])}</b>
            <small>{item.severity}</small>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function SourceVector({ tick }) {
  return (
    <Panel title="Source Vectoring" icon={MapPinned}>
      <div className="compass">
        <div className="needle" style={{ transform: `rotate(${tick.vector}deg)` }} />
        <span className="north">N</span>
        <span className="east">E</span>
        <span className="south">S</span>
        <span className="west">W</span>
      </div>
      <p className="vector-copy">
        Highest gradient: <b>Tentacle {tick.strongest.name}</b>. Navigation system is{" "}
        {tick.confirmed ? "advancing toward rising contamination intensity." : "holding radial patrol."}
      </p>
    </Panel>
  );
}

function ModeSelector({ mode, onChange }) {
  return (
    <div className="mode-selector" aria-label="Tracking mode selector">
      <button
        type="button"
        className={mode === "tracking" ? "selected" : ""}
        onClick={() => onChange("tracking")}
      >
        Active Tracking
      </button>
      <button
        type="button"
        className={mode === "hunting" ? "selected" : ""}
        onClick={() => onChange("hunting")}
      >
        Hunting Mode
      </button>
    </div>
  );
}

const initialTick = generateTick(null, false, defaultScenario);

function App() {
  const [scenario, setScenario] = useState(defaultScenario);
  const [tick, setTick] = useState(initialTick);
  const [logs, setLogs] = useState([]);
  const [testCount, setTestCount] = useState(1);
  const [verdicts, setVerdicts] = useState(() => createVerdicts(initialTick, 0));
  const [trackingMode, setTrackingMode] = useState("tracking");

  const runTest = () => {
    setTick((current) => {
      const next = generateTick(current, trackingMode === "hunting", scenario);
      setLogs((items) => [
        {
          ...next.log,
          message: `Test ${testCount}: ${next.log.message} from ${scenario.distance} m ${pollutantProfiles[scenario.profile].label.toLowerCase()} in ${trackingMode === "hunting" ? "hunting" : "active tracking"} mode`
        },
        ...items
      ].slice(0, 8));
      setVerdicts((items) => [...createVerdicts(next, testCount), ...items].slice(0, 24));
      return next;
    });
    setTestCount((value) => value + 1);
  };

  const topParam = useMemo(() => {
    return tick.strongest.worst.param;
  }, [tick]);

  return (
    <main className="app-shell">
      <div className="waterfield" />
      <header className="topbar">
        <div>
          <span className="eyebrow">
            <RadioTower size={16} /> Autonomous Water Intelligence
          </span>
          <h1>OCTOPUS LIVE</h1>
        </div>
        <div className="mode-pill">Manual Test Mode</div>
      </header>

      <section className="hero-grid">
        <div className="left-stack">
          <ScenarioControlPanel scenario={scenario} onChange={setScenario} onRunTest={runTest} />
          <HeatMatrix tentacles={tick.tentacles} />
          <Panel title="Live Sensor Cards" icon={Activity}>
            <SensorCards tentacles={tick.tentacles} />
          </Panel>
        </div>

        <div className="center-stage">
          <ModeSelector mode={trackingMode} onChange={setTrackingMode} />
          <div className={`status-strip ${tick.confirmed ? "status-alert" : "status-ok"}`}>
            {tick.confirmed ? <Siren size={18} /> : <ShieldCheck size={18} />}
            <span>{trackingMode === "hunting" ? "Operator-selected source pursuit" : tick.confirmed ? "Alert confirmation complete" : "All systems monitoring"}</span>
            <b>{trackingMode === "hunting" ? "HUNTING MODE" : tick.mode}</b>
          </div>
          <OctopusCore tick={tick} />
          <div className="telemetry-row">
            <Metric label="Central Hub Load" value={`${Math.round(42 + tick.avgIntensity / 2)}%`} />
            <Metric label="Historical Logs" value={logs.length + 1248} tone="green" />
            <Metric label="Primary Breach" value={formatName(topParam)} tone={severityMeta[tick.strongest.severity].tone} />
          </div>
          <TestResultsPanel tick={tick} scenario={scenario} />
        </div>

        <div className="right-stack">
          <AIEngine tick={tick} />
          <AIVerdictPanel verdicts={verdicts} />
          <ManagementPanel tick={tick} />
          <SafeRangeReferencePanel />
          <SourceVector tick={tick} />
          <AlertFeed logs={logs.length ? logs : [tick.log]} />
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
