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
      <h1>Trait Map MVP（日本語表示）</h1>

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
        </div>

        <svg viewBox="0 0 640 420" className="plot">
          <rect x="40" y="20" width="560" height="360" fill="#f9fafb" stroke="#d0d7de" />
          <line x1="320" y1="20" x2="320" y2="380" stroke="#9ca3af" strokeDasharray="4 4" />
          <line x1="40" y1="200" x2="600" y2="200" stroke="#9ca3af" strokeDasharray="4 4" />
          {scatter.map((point) => {
            const cx = mapToCanvas(point.x, 40, 600);
            const cy = mapToCanvas(-point.y, 20, 380);
            return (
              <g key={point.trait_id}>
                <circle cx={cx} cy={cy} r="6" fill="#1d4ed8" />
                <text x={cx + 8} y={cy - 8} fontSize="12" fill="#111827">
                  {traitLabelMap[point.trait_id] || point.name_ja || point.name_en || point.trait_id}
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
