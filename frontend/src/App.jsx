import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8000";

const AXIS_PRESETS = [
  {
    id: "strategy_sim",
    name: "戦略シミュ向け10軸",
    axisIds: [
      "risk_tolerance",
      "cooperation",
      "aggression",
      "persistence",
      "adaptability",
      "self_reliance",
      "trust",
      "control",
      "emotion",
      "exploration",
    ],
  },
  {
    id: "team_play",
    name: "チーム運用向け",
    axisIds: [
      "cooperation",
      "trust",
      "control",
      "adaptability",
      "persistence",
      "risk_tolerance",
      "aggression",
      "self_reliance",
      "emotion",
      "exploration",
    ],
  },
  {
    id: "conflict_drama",
    name: "対立ドラマ向け",
    axisIds: [
      "aggression",
      "emotion",
      "control",
      "trust",
      "risk_tolerance",
      "cooperation",
      "self_reliance",
      "persistence",
      "adaptability",
      "exploration",
    ],
  },
];

function mapToCanvas(value, minPx, maxPx) {
  const normalized = (value + 1) / 2;
  return minPx + normalized * (maxPx - minPx);
}

function summarizeTrait(trait, axes) {
  if (!trait?.vector || axes.length === 0) {
    return "-";
  }

  const topAxes = axes
    .map((axis) => ({ axis, value: Number(trait.vector[axis.id] ?? 0) }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 3);

  const phrase = topAxes.map(({ axis, value }) => {
    const abs = Math.abs(value);
    const degree = abs >= 0.75 ? "かなり" : abs >= 0.4 ? "やや" : "少し";
    const side = value >= 0 ? axis.positive : axis.negative;
    return `${axis.name_ja}が${degree}${side}`;
  });

  return phrase.join(" / ");
}

export default function App() {
  const [axes, setAxes] = useState([]);
  const [traits, setTraits] = useState([]);
  const [activeView, setActiveView] = useState("map");

  const [xAxis, setXAxis] = useState("risk_tolerance");
  const [yAxis, setYAxis] = useState("cooperation");
  const [scatter, setScatter] = useState([]);

  const [traitA, setTraitA] = useState("brave");
  const [traitB, setTraitB] = useState("aggressive");
  const [compareRows, setCompareRows] = useState([]);

  const [traitSearch, setTraitSearch] = useState("");

  const [labelDist, setLabelDist] = useState(72);
  const [selectedAxisIds, setSelectedAxisIds] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState("strategy_sim");
  const [axisEditorOpen, setAxisEditorOpen] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      const [axesRes, traitsRes] = await Promise.all([
        fetch(`${API_BASE}/axes`),
        fetch(`${API_BASE}/traits`),
      ]);

      const axesData = await axesRes.json();
      const traitsData = await traitsRes.json();

      setAxes(axesData.axes);
      setSelectedAxisIds(axesData.axes.slice(0, 10).map((axis) => axis.id));
      setTraits(traitsData.traits);
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

  // 近すぎるラベルを間引く（ドットは全件表示、ラベルのみフィルタ）
  const visibleLabelIds = useMemo(() => {
    const minDistance = 120 - labelDist;
    const placed = [];
    const visible = new Set();
    for (const point of scatter) {
      const cx = ((point.x + 1) / 2) * 560 + 40;
      const cy = ((-point.y + 1) / 2) * 360 + 20;
      const tooClose = placed.some((p) => Math.hypot(p.cx - cx, p.cy - cy) < minDistance);
      if (!tooClose) {
        placed.push({ cx, cy });
        visible.add(point.trait_id);
      }
    }
    return visible;
  }, [scatter, labelDist]);
  const visibleScatter = useMemo(
    () => scatter.filter((point) => visibleLabelIds.has(point.trait_id)),
    [scatter, visibleLabelIds],
  );
  const filteredTraits = useMemo(() => {
    const query = traitSearch.trim().toLowerCase();
    if (!query) {
      return traits;
    }

    return traits.filter((trait) => {
      const ja = (trait.name_ja || "").toLowerCase();
      const en = (trait.name_en || "").toLowerCase();
      const id = (trait.trait_id || "").toLowerCase();
      return ja.includes(query) || en.includes(query) || id.includes(query);
    });
  }, [traits, traitSearch]);
  const traitParaphraseMap = useMemo(
    () => Object.fromEntries(traits.map((trait) => [trait.trait_id, summarizeTrait(trait, selectedAxes)])),
    [traits, selectedAxes],
  );
  const compareRowsInSelectedAxes = useMemo(
    () => compareRows.filter((row) => selectedAxisSet.has(row.axis)),
    [compareRows, selectedAxisSet],
  );
  const selectedAxisSummary = useMemo(
    () => selectedAxes.map((axis) => axis.name_ja).join(" / "),
    [selectedAxes],
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
    applyPreset("strategy_sim");
  }

  function clearAxisSelection() {
    setSelectedAxisIds([]);
    setSelectedPresetId("custom");
  }

  return (
    <div className="page">
      <h1>Trait Map MVP</h1>

      <div className="workspaceLayout">
        <aside className="leftPane">
          <section className="card">
            <div className="sectionHeader">
              <h2>表示軸セット（最大10）</h2>
              <div className="sectionHeaderRight">
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
                <button type="button" className="minorButton" onClick={() => setAxisEditorOpen((open) => !open)}>
                  {axisEditorOpen ? "軸編集を閉じる" : "軸編集を開く"}
                </button>
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
          </div>

          <div className="rightPaneBody">

      {activeView === "map" && (
        <>

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
            表示数（{visibleScatter.length} / {scatter.length}）
            <input
              type="range"
              min="0"
              max="120"
              value={labelDist}
              onChange={(e) => setLabelDist(Number(e.target.value))}
              style={{ width: "140px" }}
            />
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
            return (
              <g key={point.trait_id}>
                <circle cx={cx} cy={cy} r="6" fill="#1d4ed8" />
                <text x={cx + 8} y={cy - 8} fontSize="12" fill="#111827">
                  {label}
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
                placeholder="例: 勇敢 / brave / brave"
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
                  <th>言い換え（自動）</th>
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
        <section className="card">
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

          </div>
        </div>
      </div>
    </div>
  );
}
