import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8000";

function mapToCanvas(value, minPx, maxPx) {
  const normalized = (value + 1) / 2;
  return minPx + normalized * (maxPx - minPx);
}

export default function App() {
  const [axes, setAxes] = useState([]);
  const [traits, setTraits] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const [xAxis, setXAxis] = useState("risk_tolerance");
  const [yAxis, setYAxis] = useState("cooperation");
  const [scatter, setScatter] = useState([]);

  const [traitA, setTraitA] = useState("brave");
  const [traitB, setTraitB] = useState("aggressive");
  const [compareRows, setCompareRows] = useState([]);

  const [profileId, setProfileId] = useState("soccer_support");
  const [recommendRows, setRecommendRows] = useState([]);

  const [labelDist, setLabelDist] = useState(72);

  useEffect(() => {
    async function loadInitial() {
      const [axesRes, traitsRes, profilesRes] = await Promise.all([
        fetch(`${API_BASE}/axes`),
        fetch(`${API_BASE}/traits`),
        fetch(`${API_BASE}/profiles`),
      ]);

      const axesData = await axesRes.json();
      const traitsData = await traitsRes.json();
      const profilesData = await profilesRes.json();

      setAxes(axesData.axes);
      setTraits(traitsData.traits);
      setProfiles(profilesData.profiles);
    }

    loadInitial().catch((error) => {
      console.error("Failed to load initial data", error);
    });
  }, []);

  useEffect(() => {
    async function loadScatter() {
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

  useEffect(() => {
    async function loadRecommend() {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId, top_n: 3 }),
      });
      const data = await res.json();
      setRecommendRows(data.top || []);
    }
    loadRecommend().catch((error) => console.error("Recommend load failed", error));
  }, [profileId]);

  const axisOptions = useMemo(() => axes.map((axis) => axis.id), [axes]);
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
  const profileLabelMap = useMemo(
    () => ({
      soccer_striker: "サッカー: ストライカー",
      soccer_support: "サッカー: サポート",
      strategy_leader: "戦術: リーダー",
    }),
    [],
  );

  return (
    <div className="page">
      <h1>Trait Map MVP</h1>

      <section className="card">
        <h2>散布図</h2>
        <div className="controls">
          <label>
            X軸
            <select value={xAxis} onChange={(e) => setXAxis(e.target.value)}>
              {axisOptions.map((axis) => (
                <option key={axis} value={axis}>
                  {axisLabelMap[axis] || axis}
                </option>
              ))}
            </select>
          </label>
          <label>
            Y軸
            <select value={yAxis} onChange={(e) => setYAxis(e.target.value)}>
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
            {compareRows.map((row) => (
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

      <section className="card">
        <h2>プロファイル推薦</h2>
        <div className="controls">
          <label>
            プロファイル
            <select value={profileId} onChange={(e) => setProfileId(e.target.value)}>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profileLabelMap[profile.id] || profile.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ol>
          {recommendRows.map((row) => (
            <li key={row.trait_id}>
              {(row.name_ja || row.name_en) + ` (${row.score.toFixed(3)})`}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
