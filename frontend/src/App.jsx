import React, { useEffect, useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const API_BASE = "http://localhost:8000";

const AXIS_PRESETS = [
  {
    id: "strategy_slg",
    name: "戦略SLG/RTS",
    axisIds: [
      "risk_tolerance",
      "aggression",
      "persistence",
      "discipline",
      "control",
      "adaptability",
      "self_reliance",
      "cunning",
      "honor",
      "morality",
    ],
  },
  {
    id: "rpg_fantasy",
    name: "RPG/ファンタジー",
    axisIds: [
      "exploration",
      "curiosity",
      "morality",
      "cooperation",
      "trust",
      "persistence",
      "selfishness",
      "empathy",
      "optimism",
      "risk_tolerance",
    ],
  },
  {
    id: "sports_育成",
    name: "スポーツ/育成",
    axisIds: [
      "aggression",
      "persistence",
      "discipline",
      "emotion",
      "burst",
      "adaptability",
      "cooperation",
      "self_reliance",
      "optimism",
      "risk_tolerance",
    ],
  },
  {
    id: "romance_drama",
    name: "恋愛/ドラマ",
    axisIds: [
      "empathy",
      "emotion",
      "trust",
      "cooperation",
      "optimism",
      "honor",
      "selfishness",
      "deception",
      "self_reliance",
      "control",
    ],
  },
  {
    id: "horror_survival",
    name: "ホラー/サバイバル",
    axisIds: [
      "risk_tolerance",
      "emotion",
      "self_reliance",
      "selfishness",
      "morality",
      "cooperation",
      "persistence",
      "optimism",
      "trust",
      "aggression",
    ],
  },
  {
    id: "crime_noir",
    name: "クライム/ノワール",
    axisIds: [
      "cunning",
      "deception",
      "discipline",
      "trust",
      "selfishness",
      "morality",
      "aggression",
      "self_reliance",
      "emotion",
      "honor",
    ],
  },
];

const TRAIT_PARAPHRASE_OVERRIDES = {
  humble: "控え目・謙虚 / 謙虚 / 低姿勢 / 腰が低い",
  brave: "勇敢 / 大胆 / 雄々しい",
  cautious: "慎重 / 用心深い / 注意深い",
  calm: "温厚 / 穏やか / おおらか",
  responsible: "勤勉 / 努力家 / 真面目 / 職人気質",
  explorer: "好奇心旺盛 / 探究心",
  rational: "理性的 / 論理的 / 合理的 / 客観的",
  logical: "理性的 / 論理的 / 合理的 / 客観的",
  reasonable: "理性的 / 論理的 / 合理的 / 客観的",
  compassionate: "慈悲深い / 博愛 / 親切 / 優しい / 利他的 / 献身的",
  philanthropic: "慈悲深い / 博愛 / 親切 / 優しい / 利他的 / 献身的",
  kind: "慈悲深い / 博愛 / 親切 / 優しい / 利他的 / 献身的",
  patient: "忍耐強い / 我慢強い / 継続力がある / 初志貫徹 / 諦めない",
  sociable: "外向的 / 社交的 / 人懐っこい",
  introverted: "内向的 / 内気 / 引っ込み思案",
  competitive: "気が強い / 勝気 / 負けず嫌い",
  emotional: "感情的 / 気分屋 / 気性が激しい",
  moody: "感情的 / 気分屋 / 気性が激しい",
  short_tempered: "感情的 / 気分屋 / 気性が激しい",
  optimistic: "楽観的 / ポジティブ / 前向き / 楽天的",
  pessimistic: "悲観的 / ネガティブ",
  planned: "計画的 / 計画性がある",
  unplanned: "無計画 / 計画性がない",
  stubborn: "頑固 / こだわりが強い / 固執系",
  rigid: "頑固 / こだわりが強い / 固執系",
  flexible: "柔軟 / 適応系",
  honest: "正直者 / 正直 / 嘘がつけない",
  liar: "嘘つき / 虚言癖",
  self_conscious: "自意識過剰 / 見栄っ張り / 気取ってる / プライドが高い",
  insecure: "自信喪失 / 弱気 / 気が弱い",
};

const COMPOSITION_MODES = {
  balanced: { label: "中庸重視", alpha: 1.0, beta: 1.2 },
  diverse: { label: "多様性重視", alpha: 1.4, beta: 0.8 },
  conflict: { label: "対立強め", alpha: 1.8, beta: 0.45 },
};

const AXIS_PARAPHRASE_LABELS = {
  risk_tolerance: { positive: "大胆", negative: "慎重" },
  cooperation: { positive: "協力的", negative: "単独志向" },
  aggression: { positive: "攻め気質", negative: "穏健" },
  persistence: { positive: "粘り強い", negative: "諦めが早い" },
  adaptability: { positive: "柔軟", negative: "変化に弱い" },
  self_reliance: { positive: "独立心がある", negative: "依存傾向" },
  trust: { positive: "人を信じやすい", negative: "疑い深い" },
  control: { positive: "主導的", negative: "追従的" },
  emotion: { positive: "感情表現が強い", negative: "冷静" },
  exploration: { positive: "探索的", negative: "保守的" },
  morality: { positive: "倫理重視", negative: "目的優先" },
  empathy: { positive: "共感的", negative: "ドライ" },
  optimism: { positive: "楽観的", negative: "悲観的" },
  selfishness: { positive: "自己優先", negative: "利他的" },
  cunning: { positive: "策略的", negative: "愚直" },
  honor: { positive: "名誉を重んじる", negative: "評価に無頓着" },
  burst: { positive: "瞬発型", negative: "安定型" },
  deception: { positive: "虚言傾向", negative: "率直" },
  discipline: { positive: "規律的", negative: "衝動的" },
  curiosity: { positive: "好奇心旺盛", negative: "無関心" },
};

function mapToCanvas(value, minPx, maxPx) {
  const normalized = (value + 1) / 2;
  return minPx + normalized * (maxPx - minPx);
}

function summarizeTrait(trait, axes) {
  if (!trait?.vector || axes.length === 0) {
    return "-";
  }

  const topAxes = axes
    .map((axis) => ({ axis, value: Number(trait.vector[axis.id] ?? 0), abs: Math.abs(Number(trait.vector[axis.id] ?? 0)) }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 3);

  if (topAxes[0]?.abs < 0.28) {
    return "バランス型 / 目立った偏りは少ない";
  }

  const toPhrase = ({ axis, value, abs }) => {
    const degree = abs >= 0.78 ? "かなり" : abs >= 0.5 ? "やや" : "少し";
    const labels = AXIS_PARAPHRASE_LABELS[axis.id];
    const base = labels
      ? value >= 0
        ? labels.positive
        : labels.negative
      : value >= 0
        ? axis.positive
        : axis.negative;
    return `${degree}${base}`;
  };

  const phrase = topAxes.map(toPhrase);

  if (phrase.length === 1) {
    return `${phrase[0]}タイプ`;
  }
  if (phrase.length === 2) {
    return `${phrase[0]}で、${phrase[1]}タイプ`;
  }
  return `${phrase[0]}で、${phrase[1]}。${phrase[2]}タイプ`;
}

export default function App() {
  const [axes, setAxes] = useState([]);
  const [traits, setTraits] = useState([]);
  const [traitAliases, setTraitAliases] = useState({});
  const [activeView, setActiveView] = useState("map");

  const [xAxis, setXAxis] = useState("risk_tolerance");
  const [yAxis, setYAxis] = useState("cooperation");
  const [scatter, setScatter] = useState([]);

  const [traitA, setTraitA] = useState("brave");
  const [traitB, setTraitB] = useState("aggressive");
  const [compareRows, setCompareRows] = useState([]);

  const [traitSearch, setTraitSearch] = useState("");

  const [selectedAxisIds, setSelectedAxisIds] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState("strategy_slg");
  const [axisEditorOpen, setAxisEditorOpen] = useState(false);
  const [compositionSize, setCompositionSize] = useState(12);
  const [compositionMode, setCompositionMode] = useState("balanced");

  useEffect(() => {
    async function loadInitial() {
      const [axesRes, traitsRes, aliasesRes] = await Promise.all([
        fetch(`${API_BASE}/axes`),
        fetch(`${API_BASE}/traits`),
        fetch(`${API_BASE}/trait-aliases`),
      ]);

      const axesData = await axesRes.json();
      const traitsData = await traitsRes.json();
      const aliasesData = aliasesRes.ok ? await aliasesRes.json() : { aliases: {} };

      setAxes(axesData.axes);
      setSelectedAxisIds(axesData.axes.slice(0, 10).map((axis) => axis.id));
      setTraits(traitsData.traits);
      setTraitAliases(aliasesData.aliases || {});
    }

    loadInitial().catch((error) => {
      console.error("Failed to load initial data", error);
    });
  }, []);

  useEffect(() => {
    async function loadScatter() {
      if (!xAxis || !yAxis) {
        setScatter([]);
        return;
      }
      const res = await fetch(`${API_BASE}/scatter?x_axis=${xAxis}&y_axis=${yAxis}`);
      const data = await res.json();
      setScatter(data.points || []);
    }
    loadScatter().catch((error) => console.error("Scatter load failed", error));
  }, [xAxis, yAxis]);

  useEffect(() => {
    async function loadCompare() {
      const res = await fetch(`${API_BASE}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trait_a: traitA, trait_b: traitB }),
      });
      const data = await res.json();
      setCompareRows(data.rows || []);
    }
    loadCompare().catch((error) => console.error("Compare load failed", error));
  }, [traitA, traitB]);

  const selectedAxes = useMemo(
    () => axes.filter((axis) => selectedAxisIds.includes(axis.id)),
    [axes, selectedAxisIds],
  );
  const axisOptions = useMemo(() => selectedAxes.map((axis) => axis.id), [selectedAxes]);
  const selectedAxisSet = useMemo(() => new Set(axisOptions), [axisOptions]);
  const axisLabelMap = useMemo(
    () => Object.fromEntries(axes.map((axis) => [axis.id, `${axis.name_ja} (${axis.id})`])),
    [axes],
  );
  const traitLabelMap = useMemo(
    () => Object.fromEntries(traits.map((trait) => [trait.trait_id, trait.name_ja || trait.name_en])),
    [traits],
  );
  const xAxisInfo = useMemo(() => axes.find((a) => a.id === xAxis) || {}, [axes, xAxis]);
  const yAxisInfo = useMemo(() => axes.find((a) => a.id === yAxis) || {}, [axes, yAxis]);

  useEffect(() => {
    if (axisOptions.length === 0) {
      setXAxis("");
      setYAxis("");
      return;
    }

    if (!axisOptions.includes(xAxis)) {
      setXAxis(axisOptions[0]);
    }

    if (!axisOptions.includes(yAxis)) {
      setYAxis(axisOptions[1] || axisOptions[0]);
    }
  }, [axisOptions, xAxis, yAxis]);

  const filteredTraits = useMemo(() => {
    const query = traitSearch.trim().toLowerCase();
    if (!query) {
      return traits;
    }

    return traits.filter((trait) => {
      const ja = (trait.name_ja || "").toLowerCase();
      const en = (trait.name_en || "").toLowerCase();
      const id = (trait.trait_id || "").toLowerCase();
      const manualAliases =
        traitAliases[trait.name_ja] ||
        traitAliases[trait.trait_id] ||
        traitAliases[trait.name_en] ||
        [];
      const aliasText = Array.isArray(manualAliases)
        ? manualAliases
            .filter((item) => typeof item === "string" && item.trim())
            .join(" ")
            .toLowerCase()
        : "";
      const overrideText = (TRAIT_PARAPHRASE_OVERRIDES[trait.trait_id] || "").toLowerCase();

      return (
        ja.includes(query) ||
        en.includes(query) ||
        id.includes(query) ||
        aliasText.includes(query) ||
        overrideText.includes(query)
      );
    });
  }, [traits, traitSearch, traitAliases]);
  const traitParaphraseMap = useMemo(
    () =>
      Object.fromEntries(
        traits.map((trait) => {
          const manualAliases =
            traitAliases[trait.name_ja] ||
            traitAliases[trait.trait_id] ||
            traitAliases[trait.name_en];
          const manualPhrase =
            Array.isArray(manualAliases) && manualAliases.length > 0
              ? manualAliases.filter((item) => typeof item === "string" && item.trim()).join(" / ")
              : "";

          return [
            trait.trait_id,
            manualPhrase || TRAIT_PARAPHRASE_OVERRIDES[trait.trait_id] || summarizeTrait(trait, selectedAxes),
          ];
        }),
      ),
    [traits, selectedAxes, traitAliases],
  );
  const compareRowsInSelectedAxes = useMemo(
    () => compareRows.filter((row) => selectedAxisSet.has(row.axis)),
    [compareRows, selectedAxisSet],
  );
  const selectedAxisSummary = useMemo(
    () => selectedAxes.map((axis) => axis.name_ja).join(" / "),
    [selectedAxes],
  );
  const compositionPlan = useMemo(() => {
    if (selectedAxes.length === 0 || traits.length === 0) {
      return null;
    }

    const axisIds = selectedAxes.map((axis) => axis.id);
    const axisMap = Object.fromEntries(selectedAxes.map((axis) => [axis.id, axis]));
    const mode = COMPOSITION_MODES[compositionMode] || COMPOSITION_MODES.balanced;
    const pickCount = Math.max(2, Math.min(Number(compositionSize) || 2, traits.length));
    const emptyVector = Array(axisIds.length).fill(0);

    const vectorDistance = (a, b) =>
      Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0) / Math.max(1, a.length));
    const vectorNorm = (vector) =>
      Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0) / Math.max(1, vector.length));

    const candidates = traits.map((trait) => ({
      trait,
      vector: axisIds.map((axisId) => Number(trait.vector?.[axisId] ?? 0)),
    }));

    const selected = [];
    const remaining = [...candidates];
    let meanVector = [...emptyVector];

    while (selected.length < pickCount && remaining.length > 0) {
      let bestIndex = 0;
      let bestScore = Number.NEGATIVE_INFINITY;

      for (let index = 0; index < remaining.length; index += 1) {
        const candidate = remaining[index];
        const diversity =
          selected.length === 0
            ? vectorNorm(candidate.vector)
            : Math.min(...selected.map((item) => vectorDistance(candidate.vector, item.vector)));

        const nextMean = meanVector.map(
          (value, axisIndex) =>
            (value * selected.length + candidate.vector[axisIndex]) / (selected.length + 1),
        );
        const centerPenalty = vectorNorm(nextMean);
        const score = mode.alpha * diversity - mode.beta * centerPenalty;

        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      }

      const picked = remaining.splice(bestIndex, 1)[0];
      selected.push(picked);
      meanVector = meanVector.map(
        (value, axisIndex) => (value * (selected.length - 1) + picked.vector[axisIndex]) / selected.length,
      );
    }

    const minDistances = selected.map((item, index) => {
      const others = selected.filter((_, otherIndex) => otherIndex !== index);
      if (others.length === 0) {
        return 0;
      }
      return Math.min(...others.map((other) => vectorDistance(item.vector, other.vector)));
    });

    const avgMinDistance =
      minDistances.length > 0
        ? minDistances.reduce((sum, value) => sum + value, 0) / minDistances.length
        : 0;
    const centerDeviation = vectorNorm(meanVector);

    const enriched = selected.map((item) => {
      const topAxes = axisIds
        .map((axisId, index) => {
          const axis = axisMap[axisId];
          const value = item.vector[index];
          return {
            axisName: axis?.name_ja || axisId,
            side: value >= 0 ? axis?.positive || "+" : axis?.negative || "-",
            abs: Math.abs(value),
          };
        })
        .sort((a, b) => b.abs - a.abs)
        .slice(0, 2)
        .map((entry) => `${entry.axisName}:${entry.side}`)
        .join(" / ");

      return {
        trait_id: item.trait.trait_id,
        name: item.trait.name_ja || item.trait.name_en || item.trait.trait_id,
        reason: topAxes,
      };
    });

    return {
      count: selected.length,
      modeLabel: mode.label,
      traits: enriched,
      avgMinDistance,
      centerDeviation,
      balanceScore: mode.alpha * avgMinDistance - mode.beta * centerDeviation,
    };
  }, [selectedAxes, traits, compositionSize, compositionMode]);
  const recommendedTraitIds = useMemo(
    () => new Set((compositionPlan?.traits || []).map((item) => item.trait_id)),
    [compositionPlan],
  );
  const visibleScatter = useMemo(
    () => scatter.filter((point) => recommendedTraitIds.has(point.trait_id)),
    [scatter, recommendedTraitIds],
  );

  function toggleAxis(axisId, checked) {
    setSelectedAxisIds((previous) => {
      if (checked) {
        if (previous.includes(axisId) || previous.length >= 10) {
          return previous;
        }
        return [...previous, axisId];
      }
      return previous.filter((id) => id !== axisId);
    });
  }

  const availablePresetMap = useMemo(() => {
    const axisIdSet = new Set(axes.map((axis) => axis.id));
    return Object.fromEntries(
      AXIS_PRESETS.map((preset) => [
        preset.id,
        preset.axisIds.filter((axisId) => axisIdSet.has(axisId)).slice(0, 10),
      ]),
    );
  }, [axes]);

  function applyPreset(presetId) {
    const axisIds = availablePresetMap[presetId] || [];
    if (axisIds.length > 0) {
      setSelectedAxisIds(axisIds);
      setSelectedPresetId(presetId);
    }
  }

  function resetAxisSelection() {
    applyPreset("strategy_slg");
  }

  function clearAxisSelection() {
    setSelectedAxisIds([]);
    setSelectedPresetId("custom");
  }

  return (
    <div className="page">
      <h1>Trait Space & Map</h1>

      <div className="workspaceLayout">
        <aside className="leftPane">
          <section className="card">
            <div className="sectionHeader">
              <h2>表示軸セット（最大10）</h2>
              <div className="sectionHeaderRight">
                <button type="button" className="minorButton" onClick={() => setAxisEditorOpen((open) => !open)}>
                  {axisEditorOpen ? "軸編集を閉じる" : "軸編集を開く"}
                </button>
                <label className="presetPicker">
                  プリセット
                  <select
                    value={selectedPresetId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      if (nextId === "custom") {
                        setSelectedPresetId("custom");
                        return;
                      }
                      applyPreset(nextId);
                    }}
                  >
                    <option value="custom">カスタム（手動選択）</option>
                    {AXIS_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="axisMeta">選択中: {selectedAxisIds.length} / 10</div>
            <p className="helperText">現在の軸: {selectedAxisSummary || "未選択"}</p>

            {axisEditorOpen && (
              <>
                <p className="helperText">チェックで表示軸を選択します。選択した軸だけがMap・Trait Space・性格比較に反映されます。</p>
                <div className="axisActionRow">
                  <button type="button" className="minorButton" onClick={resetAxisSelection}>リセット（戦略シミュ向け10軸）</button>
                  <button type="button" className="minorButton" onClick={clearAxisSelection}>全選択解除</button>
                </div>
                <div className="axisPickerGrid">
                  {axes.map((axis) => {
                    const checked = selectedAxisIds.includes(axis.id);
                    const disableNewCheck = !checked && selectedAxisIds.length >= 10;
                    return (
                      <label key={axis.id} className={`axisPickerItem ${checked ? "selected" : ""}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disableNewCheck}
                          onChange={(event) => toggleAxis(axis.id, event.target.checked)}
                        />
                        <span>{axis.name_ja}</span>
                        <span className="cellSub">{axis.id}</span>
                        <span className="axisDescription">説明: {axis.description_ja || `${axis.negative} - ${axis.positive} の傾向を測る軸`}</span>
                        <span className="axisDescription">想定用途: {axis.use_case_ja || "キャラ設計時の行動差分比較"}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </aside>

        <div className="rightPane">
          <div className="tabSwitcher">
            <button
              type="button"
              className={`tabButton ${activeView === "map" ? "active" : ""}`}
              onClick={() => setActiveView("map")}
            >
              Trait Map
            </button>
            <button
              type="button"
              className={`tabButton ${activeView === "space" ? "active" : ""}`}
              onClick={() => setActiveView("space")}
            >
              Trait Space
            </button>
            <button
              type="button"
              className={`tabButton ${activeView === "compare" ? "active" : ""}`}
              onClick={() => setActiveView("compare")}
            >
              性格比較
            </button>
            <button
              type="button"
              className={`tabButton ${activeView === "guide" ? "active" : ""}`}
              onClick={() => setActiveView("guide")}
            >
              使い方
            </button>
          </div>

          <div className="rightPaneBody">

      {activeView === "map" && (
        <>

      <section className="card">
        <h2>編成提案（バランス選定）</h2>
        <div className="controls">
          <label>
            目標人数
            <input
              type="number"
              min="2"
              max={traits.length || 2}
              value={compositionSize}
              onChange={(e) => setCompositionSize(Number(e.target.value))}
            />
          </label>
          <label>
            方針
            <select value={compositionMode} onChange={(e) => setCompositionMode(e.target.value)}>
              {Object.entries(COMPOSITION_MODES).map(([id, mode]) => (
                <option key={id} value={id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
          {compositionPlan && (
            <label>
              提案結果
              <div className="plainValue">{compositionPlan.count}件 / {compositionPlan.modeLabel}</div>
            </label>
          )}
        </div>

        {compositionPlan ? (
          <>
            <div className="recommendStats">
              <div>重複回避スコア: {compositionPlan.avgMinDistance.toFixed(3)}</div>
              <div>中心偏差: {compositionPlan.centerDeviation.toFixed(3)}</div>
              <div>総合: {compositionPlan.balanceScore.toFixed(3)}</div>
            </div>
            <table className="recommendTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>候補</th>
                  <th>採用理由（強い軸）</th>
                </tr>
              </thead>
              <tbody>
                {compositionPlan.traits.map((item, index) => (
                  <tr key={item.trait_id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{item.name}</strong>
                      <div className="cellSub">{item.trait_id}</div>
                    </td>
                    <td>{item.reason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
          </>
        ) : (
          <p className="helperText">提案に必要なデータが不足しています。</p>
        )}
      </section>

      <section className="card">
        <h2>散布図</h2>
        {axisOptions.length < 2 && <p className="helperText">散布図には2軸以上の選択が必要です。</p>}
        <div className="controls">
          <label>
            X軸
            <select value={xAxis} onChange={(e) => setXAxis(e.target.value)} disabled={axisOptions.length === 0}>
              {axisOptions.map((axis) => (
                <option key={axis} value={axis}>
                  {axisLabelMap[axis] || axis}
                </option>
              ))}
            </select>
          </label>
          <label>
            Y軸
            <select value={yAxis} onChange={(e) => setYAxis(e.target.value)} disabled={axisOptions.length === 0}>
              {axisOptions.map((axis) => (
                <option key={axis} value={axis}>
                  {axisLabelMap[axis] || axis}
                </option>
              ))}
            </select>
          </label>
          <label>
            表示対象
            <div className="plainValue">編成提案 {visibleScatter.length} / 全体 {scatter.length}</div>
          </label>
        </div>

        <svg viewBox="0 -20 700 460" className="plot">
          <rect x="40" y="20" width="560" height="360" fill="#f9fafb" stroke="#d0d7de" />
          <line x1="320" y1="20" x2="320" y2="380" stroke="#9ca3af" strokeDasharray="4 4" />
          <line x1="40" y1="200" x2="600" y2="200" stroke="#9ca3af" strokeDasharray="4 4" />

          {/* 手書きイメージに合わせて、上下左右の外側に軸方向ラベルを置く */}
          <text x="8" y="205" fontSize="12" fill="#374151">{xAxisInfo.negative}</text>
          <text x="642" y="205" fontSize="12" fill="#374151" textAnchor="end">{xAxisInfo.positive}</text>
          <text x="320" y="14" fontSize="12" fill="#374151" textAnchor="middle">{yAxisInfo.positive}</text>
          <text x="320" y="400" fontSize="12" fill="#374151" textAnchor="middle">{yAxisInfo.negative}</text>

          {visibleScatter.map((point) => {
            const cx = mapToCanvas(point.x, 40, 600);
            const cy = mapToCanvas(-point.y, 20, 380);
            const label = traitLabelMap[point.trait_id] || point.name_ja || point.name_en || point.trait_id;
            const isRecommended = recommendedTraitIds.has(point.trait_id);
            return (
              <g key={point.trait_id}>
                <circle cx={cx} cy={cy} r={isRecommended ? "7" : "6"} fill={isRecommended ? "#ea580c" : "#1d4ed8"} />
                <text x={cx + 8} y={cy - 8} fontSize="12" fill="#111827">
                  {isRecommended ? ` ${label}` : label}
                </text>
              </g>
            );
          })}
        </svg>
      </section>

        </>
      )}

      {activeView === "space" && (
        <section className="card">
          <h2>Trait Space 一覧</h2>
          <div className="controls">
            <label>
              性格検索
              <input
                type="text"
                placeholder="例: 勇敢 / brave / 人懐っこい"
                value={traitSearch}
                onChange={(e) => setTraitSearch(e.target.value)}
              />
            </label>
            <label>
              表示件数
              <div className="plainValue">{filteredTraits.length} / {traits.length}</div>
            </label>
          </div>

          <div className="spaceTableWrap">
            <table className="spaceTable">
              <thead>
                <tr>
                  <th>性格</th>
                  <th>言い換え、類義語</th>
                  {selectedAxes.map((axis) => (
                    <th key={axis.id}>{axis.name_ja}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTraits.map((trait) => (
                  <tr key={trait.trait_id}>
                    <td>
                      <strong>{trait.name_ja || trait.name_en}</strong>
                      <div className="cellSub">{trait.trait_id}</div>
                    </td>
                    <td>{traitParaphraseMap[trait.trait_id] || "-"}</td>
                    {selectedAxes.map((axis) => {
                      const value = Number(trait.vector?.[axis.id] ?? 0);
                      const side = value >= 0 ? axis.positive : axis.negative;
                      return (
                        <td key={`${trait.trait_id}-${axis.id}`}>
                          <div>{value.toFixed(2)}</div>
                          <div className="cellSub">{side}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeView === "compare" && (
          <section className="card compareMain">
            <h2>性格比較</h2>
            <div className="controls">
              <label>
                性格A
                <select value={traitA} onChange={(e) => setTraitA(e.target.value)}>
                  {traits.map((trait) => (
                    <option key={trait.trait_id} value={trait.trait_id}>
                      {trait.name_ja || trait.name_en}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                性格B
                <select value={traitB} onChange={(e) => setTraitB(e.target.value)}>
                  {traits.map((trait) => (
                    <option key={trait.trait_id} value={trait.trait_id}>
                      {trait.name_ja || trait.name_en}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {compareRowsInSelectedAxes.length > 0 && (
              <div className="radarWrapper">
                <ResponsiveContainer width="100%" height={360}>
                  <RadarChart
                    data={compareRowsInSelectedAxes.map((row) => ({
                      subject: axisLabelMap[row.axis] || row.axis,
                      A: Math.round((row.a + 1) * 50),
                      B: Math.round((row.b + 1) * 50),
                    }))}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <Radar
                      name={traitLabelMap[traitA] || traitA}
                      dataKey="A"
                      stroke="#4f8ef7"
                      fill="#4f8ef7"
                      fillOpacity={0.25}
                    />
                    <Radar
                      name={traitLabelMap[traitB] || traitB}
                      dataKey="B"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.25}
                    />
                    <Legend />
                    <Tooltip formatter={(v) => `${v} / 100`} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
            <table>
              <thead>
                <tr>
                  <th>軸</th>
                  <th>A</th>
                  <th>B</th>
                  <th>差分</th>
                </tr>
              </thead>
              <tbody>
                {compareRowsInSelectedAxes.map((row) => (
                  <tr key={row.axis}>
                    <td>{axisLabelMap[row.axis] || row.axis}</td>
                    <td>{row.a.toFixed(2)}</td>
                    <td>{row.b.toFixed(2)}</td>
                    <td>{row.diff.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
      )}

      {activeView === "guide" && (
        <section className="card">
          <h2>使い方ガイド</h2>
          <div className="guideBlock">
            <h4>1. 各タブの使い方</h4>
            <p><strong>Trait Map</strong>: 編成提案と散布図で全体バランスを確認。</p>
            <p><strong>Trait Space</strong>: 選択中10軸の全性格値と自動言い換えを一覧確認。</p>
            <p><strong>性格比較</strong>: 2性格をレーダーと差分表で比較して、採用/不採用判断に使う。</p>
          </div>
          <div className="guideBlock">
            <h4>2. プリセット</h4>
            <p>プリセットはジャンル別の推奨10軸セットです。まず近いプリセットを選び、必要に応じて手動で軸を調整します。</p>
          </div>
          <div className="guideBlock">
            <h4>3. 方針（編成提案）</h4>
            <p><strong>中庸重視</strong>: バランス優先で偏りを抑える。</p>
            <p><strong>多様性重視</strong>: 似た性格を避けて幅広く採用する。</p>
            <p><strong>対立強め</strong>: 差の大きい性格も入れて、緊張感やドラマ性を高める。</p>
          </div>
          <div className="guideBlock">
            <h4>4. 指標の意味</h4>
            <p><strong>重複回避スコア</strong>: 候補同士がどれだけ離れているか。高いほど役割が被りにくい。</p>
            <p><strong>中心偏差</strong>: 採用集合の平均が中心(0)からどれだけズレるか。低いほど極端な偏りが少ない。</p>
            <p><strong>総合</strong>: 方針に応じて重複回避と中心偏差を合成した値。</p>
          </div>
          
        </section>
      )}

          </div>

        </div>
      </div>
    </div>
  );
}
