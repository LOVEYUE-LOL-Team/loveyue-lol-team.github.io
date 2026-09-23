"use client";

import { useMemo, useState } from "react";
import {
  Activity, BarChart3, CalendarDays, ChevronDown, ChevronRight, Download,
  Gauge, LockKeyhole, Search, Shield, Sparkles, Swords, Users,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line,
  PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Scatter,
  ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

type Member = {
  name: string; short: string; games: number; wins: number; losses: number; wr: number;
  kda: number; k: number; d: number; a: number; mvp: number; svp: number; dmg: number; kp: number;
};
type PlayerGame = { side: number; result: string; pos: string; k: number; d: number; a: number; badge: string; damage: number; kill_participation: number; cs_per_min: number };
type Game = { ts: string; duration_sec: number; players: Record<string, PlayerGame>; squad_size: number; all_ten_names: string[] };
type SizeStat = { games: number; wins: number; wr: number };
type MemberSize = Record<string, { n: number; attend: number; w: number; wr: number }>;
type Pair = { a: string; b: string; n: number; w: number; wr: number };
type Presence = { in_wr: number; in_n: number; out_wr: number; out_n: number; lift: number };
type Month = { m: string; w: number; l: number; wr: number };
export type TeamData = {
  meta: { source: string; region: string; queue: string; total_unique_games: number; span: string; note: string };
  members_summary: Record<string, Member>;
  sizes: Record<string, SizeStat>;
  member_size: Record<string, MemberSize>;
  pairs: Pair[];
  presence: Record<string, Presence>;
  monthly: Month[];
  games: Game[];
};

const COLORS = { blue: "#315ed4", cyan: "#159a73", red: "#df5968", gold: "#c88a12", purple: "#7557d6", grid: "#e2e8f2", muted: "#6c7b91" };
const chartTooltip = { background: "#ffffff", border: "1px solid #d7e0ed", borderRadius: 12, color: "#17243b", boxShadow: "0 12px 32px rgba(28,45,78,.12)" };
const axisTick = { fill: COLORS.muted, fontSize: 12 };

function Stat({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: typeof Activity }) {
  return <section className="stat-card"><div className="stat-icon"><Icon aria-hidden="true" /></div><div><p>{label}</p><strong>{value}</strong><span>{hint}</span></div></section>;
}
function Badge({ result }: { result: string }) {
  return <span className={`result-badge ${result === "胜利" ? "is-win" : result === "失败" ? "is-loss" : "is-remake"}`}>{result}</span>;
}
function formatDuration(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
function shortMonth(month: string) { return month.replace("-", "/"); }
function compactName(name: string) { return name.match(/（(.+)）/)?.[1] ?? name.replace(/（.*?）/, ""); }
function gameWon(game: Game) { return Object.values(game.players)[0]?.result === "胜利"; }
function gameStat(games: Game[]) {
  const wins = games.filter(gameWon).length;
  return { games: games.length, wins, wr: games.length ? Number((wins / games.length * 100).toFixed(1)) : 0 };
}

function Overview({ data }: { data: TeamData }) {
  const sizeData = Object.entries(data.sizes).map(([size, stat]) => ({ size: `${size}人`, ...stat }));
  const bestMonth = [...data.monthly].sort((a, b) => b.wr - a.wr || b.w + b.l - (a.w + a.l))[0];
  const bestPair = [...data.pairs].filter((p) => p.n >= 15).sort((a, b) => b.wr - a.wr)[0];
  const bestLiftKey = Object.keys(data.presence).sort((a, b) => data.presence[b].lift - data.presence[a].lift)[0];
  const bestSize = sizeData.sort((a, b) => b.wr - a.wr)[0];
  return <div className="tab-grid overview-grid">
    <section className="panel trend-panel wide-panel">
      <div className="panel-heading"><div><p className="eyebrow">MONTHLY FORM</p><h3>月度胜负走势</h3><p className="panel-sub">柱体看场次，折线看胜率。</p></div><div className="legend"><span><i className="win" />胜场</span><span><i className="loss" />负场</span><span><i className="rate" />胜率</span></div></div>
      <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.monthly} barGap={3}><CartesianGrid stroke={COLORS.grid} vertical={false}/><XAxis dataKey="m" tickFormatter={(v) => v.slice(5)} tick={axisTick} axisLine={false} tickLine={false}/><YAxis yAxisId="games" tick={axisTick} axisLine={false} tickLine={false}/><YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={axisTick} axisLine={false} tickLine={false}/><Tooltip contentStyle={chartTooltip} cursor={{ fill: "rgba(255,255,255,.03)" }} labelFormatter={shortMonth}/><Bar yAxisId="games" dataKey="w" name="胜场" fill={COLORS.cyan} radius={[4,4,0,0]}/><Bar yAxisId="games" dataKey="l" name="负场" fill={COLORS.red} radius={[4,4,0,0]}/><Line yAxisId="rate" type="monotone" dataKey="wr" name="胜率" stroke={COLORS.gold} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.gold }}/></ComposedChart></ResponsiveContainer></div>
    </section>
    <section className="panel size-panel">
      <div className="panel-heading"><div><p className="eyebrow">SQUAD SIZE</p><h3>组队人数效应</h3><p className="panel-sub">仅统计已决出胜负的 356 场。</p></div></div>
      <div className="small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={sizeData} layout="vertical"><CartesianGrid stroke={COLORS.grid} horizontal={false}/><XAxis type="number" domain={[0,100]} tickFormatter={(v)=>`${v}%`} tick={axisTick} axisLine={false} tickLine={false}/><YAxis dataKey="size" type="category" tick={axisTick} axisLine={false} tickLine={false}/><Tooltip contentStyle={chartTooltip} formatter={(value) => [`${value}%`, "胜率"]}/><Bar dataKey="wr" radius={[0,6,6,0]}>{sizeData.map((entry)=><Cell key={entry.size} fill={entry.wr >= 50 ? COLORS.cyan : COLORS.red}/>)}</Bar></BarChart></ResponsiveContainer></div>
      <div className="size-foot">{sizeData.map((s)=><span key={s.size}><b>{s.size}</b>{s.games}场</span>)}</div>
    </section>
    <section className="insight-grid wide-panel" aria-label="关键发现">
      <article className="insight-card"><CalendarDays/><p>最高月胜率</p><strong>{bestMonth.wr}%</strong><span>{shortMonth(bestMonth.m)} · {bestMonth.w + bestMonth.l} 场</span></article>
      <article className="insight-card"><Swords/><p>高胜率搭档（≥15场）</p><strong>{bestPair.wr}%</strong><span>{bestPair.a} × {bestPair.b} · {bestPair.n} 场</span></article>
      <article className="insight-card"><Sparkles/><p>最高在场提升</p><strong>+{data.presence[bestLiftKey].lift}%</strong><span>{data.members_summary[bestLiftKey].short}</span></article>
      <article className="insight-card"><Users/><p>最佳组队规模</p><strong>{bestSize.wr}%</strong><span>{bestSize.size} · {bestSize.games} 场</span></article>
    </section>
  </div>;
}

function Members({ data }: { data: TeamData }) {
  const keys = Object.keys(data.members_summary);
  const [selected, setSelected] = useState(keys[0]);
  const member = data.members_summary[selected];
  const values = Object.values(data.members_summary);
  const max = (key: keyof Member) => Math.max(...values.map((m) => Number(m[key])));
  const radar = [
    { metric: "胜率", score: member.wr }, { metric: "KDA", score: member.kda / max("kda") * 100 },
    { metric: "击杀", score: member.k / max("k") * 100 }, { metric: "助攻", score: member.a / max("a") * 100 },
    { metric: "伤害", score: member.dmg / max("dmg") * 100 }, { metric: "参团", score: member.kp },
  ];
  const sizeData = Object.entries(data.member_size[selected]).map(([size, stat]) => ({ size: `${size}人`, ...stat }));
  return <div className="members-layout">
    <section className="panel member-list-panel"><div className="panel-heading"><div><p className="eyebrow">ROSTER</p><h3>成员总览</h3></div></div><div className="table-scroll"><Table><TableHeader><TableRow><TableHead>成员</TableHead><TableHead>场次</TableHead><TableHead>胜率</TableHead><TableHead>KDA</TableHead><TableHead>击杀</TableHead><TableHead>死亡</TableHead><TableHead>助攻</TableHead><TableHead>MVP</TableHead><TableHead>SVP</TableHead><TableHead>场均伤害</TableHead><TableHead>参团率</TableHead><TableHead>在场影响</TableHead></TableRow></TableHeader><TableBody>{keys.map((key)=>{const m=data.members_summary[key];const p=data.presence[key];return <TableRow key={key} onClick={()=>setSelected(key)} data-selected={selected===key} className="click-row"><TableCell><b>{m.short}</b><span className="sub-name">{m.name}</span></TableCell><TableCell>{m.games}</TableCell><TableCell><span className={m.wr>=50?"positive":"negative"}>{m.wr}%</span></TableCell><TableCell>{m.kda}</TableCell><TableCell>{m.k}</TableCell><TableCell>{m.d}</TableCell><TableCell>{m.a}</TableCell><TableCell>{m.mvp}</TableCell><TableCell>{m.svp}</TableCell><TableCell>{m.dmg.toLocaleString()}</TableCell><TableCell>{m.kp}%</TableCell><TableCell><span className={p.lift>=0?"positive":"negative"}>{p.lift>0?"+":""}{p.lift}%</span></TableCell></TableRow>})}</TableBody></Table></div></section>
    <section className="panel member-profile"><div className="member-select-row"><div><p className="eyebrow">PLAYER PROFILE</p><h3>{member.short}</h3><p>{member.games} 场 · {member.wins} 胜 {member.losses} 负</p></div><Select value={selected} onValueChange={setSelected}><SelectTrigger aria-label="选择成员"><SelectValue/></SelectTrigger><SelectContent>{keys.map((key)=><SelectItem value={key} key={key}>{data.members_summary[key].short}</SelectItem>)}</SelectContent></Select></div><div className="radar-wrap"><ResponsiveContainer width="100%" height="100%"><RadarChart data={radar}><PolarGrid stroke={COLORS.grid}/><PolarAngleAxis dataKey="metric" tick={{fill:COLORS.muted,fontSize:12}}/><Radar dataKey="score" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={.32}/><Tooltip contentStyle={chartTooltip} formatter={(v)=>Number(v).toFixed(1)}/></RadarChart></ResponsiveContainer></div><div className="profile-stats"><span><b>{member.wr}%</b>胜率</span><span><b>{member.kda}</b>KDA</span><span><b>{member.k}/{member.d}/{member.a}</b>场均 K/D/A</span><span><b>{member.dmg.toLocaleString()}</b>场均伤害</span></div></section>
    <section className="panel member-size-panel"><div className="panel-heading"><div><p className="eyebrow">GROUP SPLIT</p><h3>{member.short} · 人数拆分</h3></div></div><div className="member-size-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={sizeData}><CartesianGrid stroke={COLORS.grid} vertical={false}/><XAxis dataKey="size" tick={axisTick} axisLine={false} tickLine={false}/><YAxis domain={[0,100]} tickFormatter={(v)=>`${v}%`} tick={axisTick} axisLine={false} tickLine={false}/><Tooltip contentStyle={chartTooltip} formatter={(v,n)=>[n==="wr"?`${v}%`:v,n==="wr"?"胜率":"样本"]}/><Bar dataKey="wr" name="胜率" fill={COLORS.cyan} radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div><div className="size-foot">{sizeData.map(s=><span key={s.size}><b>{s.size}</b>{s.n}场 · {s.wr}%</span>)}</div></section>
  </div>;
}

function Synergy({ data }: { data: TeamData }) {
  const names = Object.values(data.members_summary).map((m)=>m.short);
  const pairMap = new Map(data.pairs.map((p)=>[[p.a,p.b].sort().join("|"),p]));
  const scatter = data.pairs.map((p)=>({x:p.n,y:p.wr,z:p.n,a:p.a,b:p.b}));
  return <div className="synergy-layout">
    <section className="panel synergy-chart"><div className="panel-heading"><div><p className="eyebrow">DUO SAMPLE × WIN RATE</p><h3>搭档样本与胜率</h3><p className="panel-sub">越靠右代表共同出场越多，越靠上代表胜率越高。</p></div></div><div className="scatter-wrap"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{top:15,right:15,bottom:10,left:0}}><CartesianGrid stroke={COLORS.grid}/><XAxis type="number" dataKey="x" name="共同场次" tick={axisTick} axisLine={false} tickLine={false}/><YAxis type="number" dataKey="y" name="胜率" unit="%" domain={[25,95]} tick={axisTick} axisLine={false} tickLine={false}/><ZAxis type="number" dataKey="z" range={[70,460]}/><Tooltip cursor={{strokeDasharray:"3 3"}} contentStyle={chartTooltip} formatter={(v,n)=>[n==="胜率"?`${v}%`:v,n]}/><Scatter data={scatter} fill={COLORS.blue}/></ScatterChart></ResponsiveContainer></div></section>
    <section className="panel top-pairs"><div className="panel-heading"><div><p className="eyebrow">PAIR LEADERBOARD</p><h3>搭档榜</h3></div></div><div className="pair-list">{[...data.pairs].sort((a,b)=>b.n-a.n).slice(0,10).map((p,i)=><article key={`${p.a}-${p.b}`}><em>{String(i+1).padStart(2,"0")}</em><div><b>{p.a} × {p.b}</b><span>{p.n} 场 · {p.w} 胜</span></div><strong className={p.wr>=50?"positive":"negative"}>{p.wr}%</strong></article>)}</div></section>
    <section className="panel matrix-panel"><div className="panel-heading"><div><p className="eyebrow">SYNERGY MATRIX</p><h3>成员搭档矩阵</h3><p className="panel-sub">颜色表示共同胜率，数字下方为共同场次。</p></div></div><div className="matrix-scroll"><div className="synergy-matrix" style={{gridTemplateColumns:`150px repeat(${names.length}, minmax(82px, 1fr))`}}><div/><>{names.map((n)=><div className="matrix-label top" key={`h-${n}`}>{n}</div>)}</>{names.map((row,ri)=><div className="matrix-row" key={row} style={{display:"contents"}}><div className="matrix-label">{row}</div>{names.map((col,ci)=>{const pair=pairMap.get([row,col].sort().join("|"));const self=ri===ci;const color=self?"rgba(92,141,255,.12)":!pair?"rgba(255,255,255,.02)":pair.wr>=55?"rgba(84,225,180,.24)":pair.wr<45?"rgba(255,107,122,.24)":"rgba(92,141,255,.16)";return <div className="matrix-cell" key={`${row}-${col}`} style={{background:color}}>{self?<span>—</span>:pair?<><b>{pair.wr}%</b><span>{pair.n} 场</span></>:<span>无样本</span>}</div>})}</div>)}</div></div></section>
  </div>;
}

function CombinationExplorer({ data }: { data: TeamData }) {
  const memberKeys = Object.keys(data.members_summary);
  const [selected, setSelected] = useState<string[]>(() => ["huanling", "adc"].filter((key) => memberKeys.includes(key)));
  const [mode, setMode] = useState("contains");
  const [excludeShort, setExcludeShort] = useState(true);

  const analysis = useMemo(() => {
    const decided = data.games.filter((g) => ["胜利", "失败"].includes(Object.values(g.players)[0]?.result));
    const games = excludeShort ? decided.filter((g) => g.duration_sec >= 600) : decided;
    const hasMember = (game: Game, key: string) => Object.keys(game.players).some((name) => name.startsWith(data.members_summary[key].name));
    const hasAll = (game: Game) => selected.every((key) => hasMember(game, key));
    const comboGames = games.filter((game) => hasAll(game) && (mode === "contains" || game.squad_size === selected.length));
    const baselineGames = selected.length === 1
      ? games.filter((game) => !hasMember(game, selected[0]))
      : games.filter((game) => selected.some((key) => hasMember(game, key)) && !hasAll(game));
    const combo = gameStat(comboGames), baseline = gameStat(baselineGames);
    const avgDuration = comboGames.length ? comboGames.reduce((sum, game) => sum + game.duration_sec, 0) / comboGames.length : 0;
    const monthData = data.monthly.map(({ m }) => {
      const rows = comboGames.filter((game) => game.ts.startsWith(m));
      const stat = gameStat(rows);
      return { m, w: stat.wins, l: stat.games - stat.wins, wr: stat.wr, games: stat.games };
    }).filter((row) => row.games > 0);
    const sizeData = [1, 2, 3, 4, 5].map((size) => ({ size: `${size}人`, ...gameStat(comboGames.filter((game) => game.squad_size === size)) })).filter((row) => row.games > 0);
    const timeBands = [
      { label: "上午", start: 6, end: 12 }, { label: "下午", start: 12, end: 18 },
      { label: "晚间", start: 18, end: 22 }, { label: "深夜", start: 22, end: 30 },
    ];
    const timeData = timeBands.map((band) => {
      const rows = comboGames.filter((game) => { const raw = Number(game.ts.slice(11, 13)); const hour = raw < 6 ? raw + 24 : raw; return hour >= band.start && hour < band.end; });
      return { time: band.label, ...gameStat(rows) };
    }).filter((row) => row.games > 0);
    const bestTime = [...timeData].filter((row) => row.games >= 3).sort((a, b) => b.wr - a.wr || b.games - a.games)[0];

    const memberRows = selected.map((key) => {
      const rows = comboGames.map((game) => {
        const entry = Object.entries(game.players).find(([name]) => name.startsWith(data.members_summary[key].name));
        return entry ? { game, player: entry[1] } : null;
      }).filter((row): row is { game: Game; player: PlayerGame } => Boolean(row));
      const average = (pick: (p: PlayerGame) => number) => rows.length ? rows.reduce((sum, row) => sum + pick(row.player), 0) / rows.length : 0;
      const roleCounts = rows.reduce<Record<string, number>>((acc, row) => { acc[row.player.pos] = (acc[row.player.pos] ?? 0) + 1; return acc; }, {});
      const role = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      return {
        key, member: data.members_summary[key].short, role,
        k: average((p) => p.k), d: average((p) => p.d), a: average((p) => p.a),
        kda: average((p) => (p.k + p.a) / Math.max(1, p.d)), damage: average((p) => p.damage), kp: average((p) => p.kill_participation),
      };
    });
    const recent = [...comboGames].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 8);
    const lift = combo.games && baseline.games ? Number((combo.wr - baseline.wr).toFixed(1)) : null;
    return { comboGames, combo, baseline, lift, avgDuration, monthData, sizeData, timeData, bestTime, memberRows, recent };
  }, [data, selected, mode, excludeShort]);

  const presets = [
    ["huanling", "adc"], ["niluo", "liqing"], ["adc", "liqing"], ["nunu", "huanling"],
  ].filter((keys) => keys.every((key) => memberKeys.includes(key)));
  const selectedNames = selected.map((key) => compactName(data.members_summary[key].short)).join(" × ");
  const toggleMember = (key: string, checked: boolean) => {
    if (checked && selected.length < 5) setSelected((current) => [...current, key]);
    if (!checked && selected.length > 1) setSelected((current) => current.filter((item) => item !== key));
  };
  const roundedDuration = Math.round(analysis.avgDuration);

  return <div className="combo-shell">
    <section className="panel combo-control-panel">
      <div className="combo-control-head"><div><p className="eyebrow">COMBINATION WORKBENCH</p><h3>组合分析台</h3><p>选择 1–5 名成员，页面会从逐局记录重新计算所有图表。</p></div><div className="combo-settings"><Select value={mode} onValueChange={setMode}><SelectTrigger aria-label="组合匹配方式"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="contains">至少包含所选成员</SelectItem><SelectItem value="exact">精确固定成员阵容</SelectItem></SelectContent></Select><label><span>排除极短对局</span><Switch checked={excludeShort} onCheckedChange={setExcludeShort} aria-label="排除不足十分钟对局"/></label></div></div>
      <div className="member-picker" aria-label="选择分析成员">{memberKeys.map((key) => { const member = data.members_summary[key]; const checked = selected.includes(key); const disabled = (!checked && selected.length >= 5) || (checked && selected.length === 1); return <label key={key} data-selected={checked} data-disabled={disabled}><Checkbox checked={checked} disabled={disabled} onCheckedChange={(value) => toggleMember(key, value === true)} aria-label={`选择${member.short}`}/><span><b>{member.short}</b><small>{member.wr}% · {member.games}局</small></span></label>; })}</div>
      <div className="preset-row"><span>快速组合</span>{presets.map((keys) => <button type="button" key={keys.join("-")} onClick={() => setSelected(keys)}>{keys.map((key) => compactName(data.members_summary[key].short)).join(" × ")}</button>)}</div>
    </section>

    {analysis.combo.games === 0 ? <Empty className="panel combo-empty"><EmptyHeader><EmptyMedia variant="icon"><Users/></EmptyMedia><EmptyTitle>当前组合没有匹配对局</EmptyTitle><EmptyDescription>尝试改为“至少包含所选成员”，或减少一名成员。</EmptyDescription></EmptyHeader></Empty> : <>
      <section className="combo-summary-grid" aria-label="组合分析摘要">
        <article className="combo-primary"><span>当前组合</span><h3>{selectedNames}</h3><p>{mode === "contains" ? "至少同时出现" : "精确阵容"} · {analysis.combo.games} 局</p></article>
        <article><span>组合胜率</span><strong>{analysis.combo.wr}%</strong><p>{analysis.combo.wins} 胜 {analysis.combo.games - analysis.combo.wins} 负</p></article>
        <article><span>相对基线</span><strong className={analysis.lift !== null && analysis.lift >= 0 ? "positive" : "negative"}>{analysis.lift === null ? "—" : `${analysis.lift > 0 ? "+" : ""}${analysis.lift}%`}</strong><p>{analysis.baseline.games ? `成员分开时 ${analysis.baseline.wr}%` : "暂无可比样本"}</p></article>
        <article><span>平均时长</span><strong>{Math.floor(roundedDuration / 60)}:{String(roundedDuration % 60).padStart(2,"0")}</strong><p>{analysis.bestTime ? `最佳时段：${analysis.bestTime.time} ${analysis.bestTime.wr}%` : "时段样本不足"}</p></article>
      </section>

      <section className="panel combo-month-panel">
        <div className="panel-heading"><div><p className="eyebrow">COMBINATION FORM</p><h3>组合月度走势</h3><p className="panel-sub">只显示该组合实际出现过的月份。</p></div><div className="legend"><span><i className="win"/>胜场</span><span><i className="loss"/>负场</span><span><i className="rate"/>胜率</span></div></div>
        <div className="combo-month-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={analysis.monthData}><CartesianGrid stroke={COLORS.grid} vertical={false}/><XAxis dataKey="m" tickFormatter={(value) => value.slice(5)} tick={axisTick} axisLine={false} tickLine={false}/><YAxis yAxisId="games" tick={axisTick} axisLine={false} tickLine={false}/><YAxis yAxisId="rate" orientation="right" domain={[0,100]} tickFormatter={(value)=>`${value}%`} tick={axisTick} axisLine={false} tickLine={false}/><Tooltip contentStyle={chartTooltip} labelFormatter={shortMonth}/><Bar yAxisId="games" dataKey="w" name="胜场" fill={COLORS.cyan} radius={[5,5,0,0]}/><Bar yAxisId="games" dataKey="l" name="负场" fill={COLORS.red} radius={[5,5,0,0]}/><Line yAxisId="rate" dataKey="wr" name="胜率" stroke={COLORS.gold} strokeWidth={3} dot={{r:4,fill:COLORS.gold}}/></ComposedChart></ResponsiveContainer></div>
      </section>

      <div className="combo-analysis-grid">
        <section className="panel combo-context-panel"><div className="panel-heading"><div><p className="eyebrow">SQUAD CONTEXT</p><h3>组队人数分布</h3></div></div><div className="combo-small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={analysis.sizeData}><CartesianGrid stroke={COLORS.grid} vertical={false}/><XAxis dataKey="size" tick={axisTick} axisLine={false} tickLine={false}/><YAxis domain={[0,100]} tickFormatter={(value)=>`${value}%`} tick={axisTick} axisLine={false} tickLine={false}/><Tooltip contentStyle={chartTooltip} formatter={(value)=>[`${value}%`,"胜率"]}/><Bar dataKey="wr" fill={COLORS.blue} radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div><div className="context-counts">{analysis.sizeData.map((row)=><span key={row.size}><b>{row.size}</b>{row.games}局</span>)}</div></section>
        <section className="panel combo-context-panel"><div className="panel-heading"><div><p className="eyebrow">TIME WINDOW</p><h3>开黑时段</h3></div></div><div className="combo-small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={analysis.timeData}><CartesianGrid stroke={COLORS.grid} vertical={false}/><XAxis dataKey="time" tick={axisTick} axisLine={false} tickLine={false}/><YAxis domain={[0,100]} tickFormatter={(value)=>`${value}%`} tick={axisTick} axisLine={false} tickLine={false}/><Tooltip contentStyle={chartTooltip} formatter={(value)=>[`${value}%`,"胜率"]}/><Bar dataKey="wr" fill={COLORS.purple} radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div><div className="context-counts">{analysis.timeData.map((row)=><span key={row.time}><b>{row.time}</b>{row.games}局</span>)}</div></section>
        <section className="panel combo-member-panel"><div className="panel-heading"><div><p className="eyebrow">MEMBER OUTPUT</p><h3>组合内成员表现</h3><p className="panel-sub">数值仅统计该组合匹配到的对局。</p></div></div><div className="table-scroll"><Table><TableHeader><TableRow><TableHead>成员</TableHead><TableHead>常用位置</TableHead><TableHead>KDA</TableHead><TableHead>场均 K/D/A</TableHead><TableHead>场均伤害</TableHead><TableHead>参团率</TableHead></TableRow></TableHeader><TableBody>{analysis.memberRows.map((row)=><TableRow key={row.key}><TableCell><b>{row.member}</b></TableCell><TableCell>{row.role}</TableCell><TableCell>{row.kda.toFixed(2)}</TableCell><TableCell>{row.k.toFixed(1)} / {row.d.toFixed(1)} / {row.a.toFixed(1)}</TableCell><TableCell>{Math.round(row.damage).toLocaleString()}</TableCell><TableCell>{row.kp.toFixed(1)}%</TableCell></TableRow>)}</TableBody></Table></div></section>
      </div>

      <section className="panel combo-recent-panel"><div className="panel-heading"><div><p className="eyebrow">MATCH SAMPLE</p><h3>最近匹配对局</h3><p className="panel-sub">用于快速核对组合表现由哪些比赛构成。</p></div></div><div className="combo-recent-list">{analysis.recent.map((game)=>{const result=Object.values(game.players)[0].result;return <article key={`${game.ts}-${game.duration_sec}`}><time>{game.ts.slice(0,16)}</time><Badge result={result}/><span>{game.squad_size}人组队</span><span>{formatDuration(game.duration_sec)}</span><div>{selected.map((key)=>{const entry=Object.entries(game.players).find(([name])=>name.startsWith(data.members_summary[key].name));return entry?<b key={key}>{compactName(data.members_summary[key].short)} {entry[1].k}/{entry[1].d}/{entry[1].a}</b>:null})}</div></article>})}</div></section>
    </>}
  </div>;
}

function InsightLab({ data }: { data: TeamData }) {
  const [excludeShort, setExcludeShort] = useState(true);
  const analysis = useMemo(() => {
    const decided = data.games.filter((g) => ["胜利", "失败"].includes(Object.values(g.players)[0]?.result));
    const games = excludeShort ? decided.filter((g) => g.duration_sec >= 600) : decided;
    const playerKeys = Array.from(new Set(data.games.flatMap((g) => Object.keys(g.players))));
    const members = Object.values(data.members_summary);
    const labels = new Map(playerKeys.map((key) => [key, members.find((m) => key.startsWith(m.name))?.short ?? key]));

    const pairRows: Array<{ pair: string; fullPair: string; n: number; wins: number; wr: number; baseline: number; lift: number; exactN: number; exactWr: number; largerN: number; largerWr: number; confidence: string }> = [];
    for (let i = 0; i < playerKeys.length; i++) for (let j = i + 1; j < playerKeys.length; j++) {
      const a = playerKeys[i], b = playerKeys[j];
      const together = games.filter((g) => g.players[a] && g.players[b]);
      if (!together.length) continue;
      let weightedBase = 0, covered = 0;
      for (const size of [2, 3, 4, 5]) {
        const sameSize = together.filter((g) => g.squad_size === size);
        const controls = games.filter((g) => g.squad_size === size && Boolean(g.players[a]) !== Boolean(g.players[b]));
        if (sameSize.length && controls.length) {
          weightedBase += gameStat(controls).wr * sameSize.length;
          covered += sameSize.length;
        }
      }
      if (!covered) continue;
      const total = gameStat(together);
      const exact = gameStat(together.filter((g) => g.squad_size === 2));
      const larger = gameStat(together.filter((g) => g.squad_size >= 3));
      const labelA = labels.get(a) ?? a, labelB = labels.get(b) ?? b;
      const baseline = weightedBase / covered;
      pairRows.push({
        pair: `${compactName(labelA)} × ${compactName(labelB)}`,
        fullPair: `${labelA} × ${labelB}`,
        n: total.games, wins: total.wins, wr: total.wr,
        baseline: Number(baseline.toFixed(1)), lift: Number((total.wr - baseline).toFixed(1)),
        exactN: exact.games, exactWr: exact.wr, largerN: larger.games, largerWr: larger.wr,
        confidence: total.games >= 24 ? "较稳" : total.games >= 12 ? "观察中" : "小样本",
      });
    }
    const pairSignals = pairRows.filter((p) => p.n >= 8).sort((a, b) => b.lift - a.lift).slice(0, 5);
    const contextFlips = pairRows
      .filter((p) => p.exactN >= 3 && p.largerN >= 5)
      .map((p) => ({ ...p, flip: Number((p.exactWr - p.largerWr).toFixed(1)) }))
      .sort((a, b) => Math.abs(b.flip) - Math.abs(a.flip)).slice(0, 4);

    const sizeData = [1, 2, 3, 4, 5].map((size) => ({ size: `${size}人`, ...gameStat(games.filter((g) => g.squad_size === size)) }));
    const middle = gameStat(games.filter((g) => [3, 4].includes(g.squad_size)));
    const outside = gameStat(games.filter((g) => ![3, 4].includes(g.squad_size)));

    const roleRows: Array<{ member: string; role: string; n: number; wr: number; primaryRole: string; primaryWr: number; delta: number }> = [];
    for (const key of playerKeys) {
      const appearances = games.filter((g) => g.players[key]);
      const roles = Array.from(new Set(appearances.map((g) => g.players[key].pos))).map((role) => ({ role, ...gameStat(appearances.filter((g) => g.players[key].pos === role)) }));
      const primary = [...roles].sort((a, b) => b.games - a.games)[0];
      roles.filter((role) => role.role !== primary.role && role.games >= 10).forEach((role) => roleRows.push({
        member: labels.get(key) ?? key, role: role.role, n: role.games, wr: role.wr,
        primaryRole: primary.role, primaryWr: primary.wr, delta: Number((role.wr - primary.wr).toFixed(1)),
      }));
    }
    roleRows.sort((a, b) => b.delta - a.delta);

    const sessionRows = playerKeys.map((key) => {
      const appearances = games.filter((g) => g.players[key]).sort((a, b) => a.ts.localeCompare(b.ts));
      const first: Game[] = [], later: Game[] = [], deep: Game[] = [];
      let index = 0;
      appearances.forEach((game, i) => {
        const previous = appearances[i - 1];
        const gap = previous ? (new Date(game.ts.replace(" ", "T")).getTime() - new Date(previous.ts.replace(" ", "T")).getTime()) / 60000 : Infinity;
        if (gap > 90) { index = 1; first.push(game); } else { index += 1; later.push(game); }
        if (index >= 4) deep.push(game);
      });
      const firstStat = gameStat(first), laterStat = gameStat(later), deepStat = gameStat(deep);
      return { member: labels.get(key) ?? key, first: firstStat, later: laterStat, deep: deepStat, fatigue: Number((firstStat.wr - laterStat.wr).toFixed(1)) };
    }).sort((a, b) => b.fatigue - a.fatigue);

    const playerRows = games.flatMap((g) => Object.entries(g.players).map(([key, p]) => ({ game: g, member: labels.get(key) ?? key, player: p, kda: (p.k + p.a) / Math.max(1, p.d) })));
    const maxDamage = [...playerRows].sort((a, b) => b.player.damage - a.player.damage)[0];
    const maxKills = [...playerRows].sort((a, b) => b.player.k - a.player.k)[0];
    const maxAssists = [...playerRows].sort((a, b) => b.player.a - a.player.a)[0];
    const heroicLoss = [...playerRows].filter((r) => r.player.result === "失败").sort((a, b) => b.kda - a.kda)[0];
    const doubleCarry = games.map((game) => {
      const top = Object.entries(game.players).sort((a, b) => b[1].damage - a[1].damage).slice(0, 2);
      return { game, top, damage: top.reduce((sum, [, p]) => sum + p.damage, 0) };
    }).filter((row) => row.top.length > 1).sort((a, b) => b.damage - a.damage)[0];
    const records = [
      { label: "单局最高伤害", value: maxDamage.player.damage.toLocaleString(), detail: `${maxDamage.member} · ${maxDamage.player.k}/${maxDamage.player.d}/${maxDamage.player.a}`, date: maxDamage.game.ts.slice(0, 10) },
      { label: "单局最高击杀", value: `${maxKills.player.k} 杀`, detail: `${maxKills.member} · ${maxKills.player.damage.toLocaleString()} 伤害`, date: maxKills.game.ts.slice(0, 10) },
      { label: "单局最高助攻", value: `${maxAssists.player.a} 助攻`, detail: `${maxAssists.member} · ${maxAssists.player.kill_participation}% 参团`, date: maxAssists.game.ts.slice(0, 10) },
      { label: "最高 KDA 败局", value: heroicLoss.kda.toFixed(1), detail: `${heroicLoss.member} · ${heroicLoss.player.k}/${heroicLoss.player.d}/${heroicLoss.player.a}`, date: heroicLoss.game.ts.slice(0, 10) },
      { label: "双核合计伤害", value: doubleCarry.damage.toLocaleString(), detail: doubleCarry.top.map(([key, p]) => `${compactName(labels.get(key) ?? key)} ${p.damage.toLocaleString()}`).join(" + "), date: doubleCarry.game.ts.slice(0, 10) },
    ];

    const shortGames = decided.filter((g) => g.duration_sec < 600).length;
    return { pairSignals, contextFlips, sizeData, middle, outside, roleRows: roleRows.slice(0, 5), sessionRows: sessionRows.slice(0, 5), records, shortGames, games: games.length };
  }, [data, excludeShort]);

  const topSignal = analysis.pairSignals[0];
  const middleGap = Number((analysis.middle.wr - analysis.outside.wr).toFixed(1));
  return <div className="lab-shell">
    <section className="panel lab-intro">
      <div><p className="eyebrow">INSIGHT LAB</p><h3>洞察实验室</h3><p>把原始胜率拆成组合、人数和情境信号。结果用于发现值得继续观察的模式，不作因果结论。</p></div>
      <label className="lab-toggle"><span><b>稳健模式</b><small>排除不足 10 分钟的 {analysis.shortGames} 局异常胜局</small></span><Switch checked={excludeShort} onCheckedChange={setExcludeShort} aria-label="排除不足十分钟的异常对局" /></label>
    </section>

    <section className="lab-kpis" aria-label="洞察摘要">
      <article><span>最强组合信号</span><strong>{topSignal.wr}%</strong><p>{topSignal.pair} · {topSignal.wins}胜{topSignal.n - topSignal.wins}负</p></article>
      <article><span>同规模提升</span><strong className="positive">+{topSignal.lift}%</strong><p>相对 {topSignal.baseline}% 基线</p></article>
      <article><span>三、四排低谷</span><strong className="negative">{middleGap}%</strong><p>{analysis.middle.wr}% 对 {analysis.outside.wr}%</p></article>
      <article><span>分析样本</span><strong>{analysis.games}</strong><p>已决出胜负的正常对局</p></article>
    </section>

    <div className="lab-two-col lab-top-row">
      <section className="panel lab-panel signal-panel">
        <div className="panel-heading"><div><p className="eyebrow">SIZE-ADJUSTED CHEMISTRY</p><h3>同规模修正后的组合信号</h3><p className="panel-sub">绿色为组合同场胜率，灰蓝为相同组队人数下的对照基线。</p></div></div>
        <div className="signal-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={analysis.pairSignals} layout="vertical" margin={{ left: 14, right: 20 }}><CartesianGrid stroke={COLORS.grid} horizontal={false}/><XAxis type="number" domain={[0,100]} tickFormatter={(v)=>`${v}%`} tick={axisTick} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="pair" width={118} tick={{...axisTick,fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={chartTooltip} formatter={(value,name)=>[`${value}%`,name]}/><Bar dataKey="baseline" name="同规模基线" fill="#31445f" radius={[0,5,5,0]}/><Bar dataKey="wr" name="组合胜率" fill={COLORS.cyan} radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></div>
      </section>
      <section className="panel lab-panel signal-list-panel">
        <div className="panel-heading"><div><p className="eyebrow">SIGNAL BOARD</p><h3>值得追踪的搭档</h3></div></div>
        <div className="signal-list">{analysis.pairSignals.slice(0,4).map((pair, index)=><article key={pair.fullPair}><em>{String(index+1).padStart(2,"0")}</em><div><b>{pair.fullPair}</b><span>{pair.wins}胜{pair.n-pair.wins}负 · 基线 {pair.baseline}%</span></div><div className="signal-score"><strong>+{pair.lift}%</strong><small data-confidence={pair.confidence}>{pair.confidence} · {pair.n}局</small></div></article>)}</div>
      </section>
    </div>

    <div className="lab-two-col">
      <section className="panel lab-panel squad-valley">
        <div className="panel-heading"><div><p className="eyebrow">SQUAD-SIZE VALLEY</p><h3>三、四排人数陷阱</h3><p className="panel-sub">双排和五排都回到 53% 以上，中间规模却明显下探。</p></div></div>
        <div className="valley-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={analysis.sizeData}><defs><linearGradient id="labArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.purple} stopOpacity={.45}/><stop offset="100%" stopColor={COLORS.purple} stopOpacity={.03}/></linearGradient></defs><CartesianGrid stroke={COLORS.grid} vertical={false}/><XAxis dataKey="size" tick={axisTick} axisLine={false} tickLine={false}/><YAxis domain={[35,60]} tickFormatter={(v)=>`${v}%`} tick={axisTick} axisLine={false} tickLine={false}/><Tooltip contentStyle={chartTooltip} formatter={(value)=>[`${value}%`,"胜率"]}/><Area type="monotone" dataKey="wr" stroke={COLORS.purple} strokeWidth={3} fill="url(#labArea)" dot={{r:5,fill:COLORS.purple,stroke:"#0c182a",strokeWidth:2}}/></AreaChart></ResponsiveContainer></div>
        <div className="lab-note"><b>{analysis.middle.wins}胜{analysis.middle.games-analysis.middle.wins}负</b><span>三、四排合计 {analysis.middle.wr}%，比其他规模低 {Math.abs(middleGap)} 个百分点。</span></div>
      </section>
      <section className="panel lab-panel context-panel">
        <div className="panel-heading"><div><p className="eyebrow">CONTEXT SWITCH</p><h3>加人以后，化学反应会变吗？</h3><p className="panel-sub">同一搭档在纯双排与三排以上的表现对照。</p></div></div>
        <div className="context-list">{analysis.contextFlips.map((pair)=><article key={pair.fullPair}><div className="context-title"><b>{pair.fullPair}</b><span className={pair.flip>=0?"positive":"negative"}>{pair.flip>=0?"双排更强":"多人更强"} {Math.abs(pair.flip)}%</span></div><div className="duel-line"><span>纯双排 · {pair.exactN}局</span><div><i style={{width:`${pair.exactWr}%`}}/></div><b>{pair.exactWr}%</b></div><div className="duel-line"><span>三排以上 · {pair.largerN}局</span><div><i className="is-larger" style={{width:`${pair.largerWr}%`}}/></div><b>{pair.largerWr}%</b></div></article>)}</div>
      </section>
    </div>

    <div className="lab-two-col">
      <section className="panel lab-panel lab-table-panel">
        <div className="panel-heading"><div><p className="eyebrow">OFF-META ROLES</p><h3>隐藏位置</h3><p className="panel-sub">至少 10 局的非常用位置，与该成员主位置比较。</p></div></div>
        <div className="lab-table"><div className="lab-table-head"><span>成员</span><span>位置</span><span>战绩</span><span>对主位置</span></div>{analysis.roleRows.map((row)=><div className="lab-table-row" key={`${row.member}-${row.role}`}><b>{row.member}</b><span>{row.role}</span><span>{row.wr}% · {row.n}局</span><strong className={row.delta>=0?"positive":"negative"}>{row.delta>0?"+":""}{row.delta}%</strong></div>)}</div>
      </section>
      <section className="panel lab-panel lab-table-panel">
        <div className="panel-heading"><div><p className="eyebrow">SESSION ENDURANCE</p><h3>连续作战曲线</h3><p className="panel-sub">间隔不超过 90 分钟视为同一次连续作战。</p></div></div>
        <div className="lab-table"><div className="lab-table-head session"><span>成员</span><span>首局</span><span>后续</span><span>首局差</span></div>{analysis.sessionRows.map((row)=><div className="lab-table-row session" key={row.member}><b>{row.member}</b><span>{row.first.wr}% · {row.first.games}局</span><span>{row.later.wr}% · {row.later.games}局</span><strong className={row.fatigue>=0?"positive":"negative"}>{row.fatigue>0?"+":""}{row.fatigue}%</strong></div>)}</div>
      </section>
    </div>

    <section className="panel lab-panel record-panel">
      <div className="panel-heading"><div><p className="eyebrow">RECORD BOOK</p><h3>车队名场面</h3><p className="panel-sub">从逐局数据自动提取的极值记录。</p></div></div>
      <div className="record-grid">{analysis.records.map((record)=><article key={record.label}><span>{record.label}</span><strong>{record.value}</strong><p>{record.detail}</p><time>{record.date}</time></article>)}</div>
    </section>
    <p className="analysis-disclaimer">探索说明：组合修正只控制组队人数，尚未控制月份、位置与完整阵容；同时比较多组搭档容易产生偶然高值。页面将“小样本”作为发现线索，而不是确定结论。</p>
  </div>;
}

function Matches({ data }: { data: TeamData }) {
  const memberKeys = Object.keys(data.members_summary);
  const positions = Array.from(new Set(data.games.flatMap((g)=>Object.values(g.players).map((p)=>p.pos)))).sort();
  const [member, setMember] = useState("all"); const [result,setResult]=useState("all"); const [size,setSize]=useState("all"); const [position,setPosition]=useState("all"); const [query,setQuery]=useState(""); const [page,setPage]=useState(1); const [expanded,setExpanded]=useState<string|null>(null);
  const filtered = useMemo(()=>data.games.filter((g)=>{const entries=Object.entries(g.players);const hasMember=member==="all"||entries.some(([name])=>name.startsWith(data.members_summary[member].name));const hasResult=result==="all"||entries.some(([,p])=>p.result===result);const hasSize=size==="all"||g.squad_size===Number(size);const hasPos=position==="all"||entries.some(([,p])=>p.pos===position);const q=query.trim().toLowerCase();const hasQuery=!q||g.ts.includes(q)||g.all_ten_names.some((name)=>name.toLowerCase().includes(q))||entries.some(([name])=>name.toLowerCase().includes(q));return hasMember&&hasResult&&hasSize&&hasPos&&hasQuery;}),[data,member,result,size,position,query]);
  const perPage=15,totalPages=Math.max(1,Math.ceil(filtered.length/perPage)),safePage=Math.min(page,totalPages),visible=filtered.slice((safePage-1)*perPage,safePage*perPage);
  const resetPage=(fn:(v:string)=>void)=>(v:string)=>{fn(v);setPage(1)};
  function exportCsv(){const rows=[["开局时间","时长","人数","成员","胜负","位置","击杀","死亡","助攻","伤害","参团率","分均补刀"],...filtered.flatMap(g=>Object.entries(g.players).map(([name,p])=>[g.ts,formatDuration(g.duration_sec),g.squad_size,name,p.result,p.pos,p.k,p.d,p.a,p.damage,p.kill_participation,p.cs_per_min]))];const csv="\ufeff"+rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="车队战绩_筛选结果.csv";a.click();URL.revokeObjectURL(a.href);}
  return <section className="panel matches-panel"><div className="matches-head"><div><p className="eyebrow">MATCH EXPLORER</p><h3>逐局检索</h3><p className="panel-sub">{filtered.length} / {data.games.length} 场匹配</p></div><Button variant="outline" onClick={exportCsv}><Download/>导出筛选结果</Button></div><div className="filter-bar"><div className="search-box"><Search/><Input value={query} onChange={(e)=>{setQuery(e.target.value);setPage(1)}} placeholder="搜索日期或任意召唤师名" aria-label="搜索对局"/></div><Select value={member} onValueChange={resetPage(setMember)}><SelectTrigger aria-label="成员筛选"><SelectValue placeholder="全部成员"/></SelectTrigger><SelectContent><SelectItem value="all">全部成员</SelectItem>{memberKeys.map(k=><SelectItem key={k} value={k}>{data.members_summary[k].short}</SelectItem>)}</SelectContent></Select><Select value={result} onValueChange={resetPage(setResult)}><SelectTrigger aria-label="胜负筛选"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">全部结果</SelectItem><SelectItem value="胜利">胜利</SelectItem><SelectItem value="失败">失败</SelectItem><SelectItem value="重开">重开</SelectItem></SelectContent></Select><Select value={size} onValueChange={resetPage(setSize)}><SelectTrigger aria-label="人数筛选"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">全部人数</SelectItem>{[1,2,3,4,5].map(n=><SelectItem key={n} value={String(n)}>{n} 人组队</SelectItem>)}</SelectContent></Select><Select value={position} onValueChange={resetPage(setPosition)}><SelectTrigger aria-label="位置筛选"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">全部位置</SelectItem>{positions.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div><div className="table-scroll"><Table><TableHeader><TableRow><TableHead/><TableHead>开局时间</TableHead><TableHead>时长</TableHead><TableHead>车队人数</TableHead><TableHead>结果</TableHead><TableHead>成员摘要</TableHead><TableHead>荣誉</TableHead></TableRow></TableHeader><TableBody>{visible.map((g)=>{const id=`${g.ts}-${g.duration_sec}`;const players=Object.entries(g.players);const r=players[0][1].result;return <MatchRows key={id} game={g} id={id} players={players} result={r} open={expanded===id} toggle={()=>setExpanded(expanded===id?null:id)}/>})}</TableBody></Table></div><Pagination className="match-pagination"><PaginationContent><PaginationItem><PaginationPrevious href="#" aria-disabled={safePage===1} onClick={(e)=>{e.preventDefault();if(safePage>1)setPage(safePage-1)}}>上一页</PaginationPrevious></PaginationItem>{Array.from({length:Math.min(5,totalPages)},(_,i)=>{const start=Math.max(1,Math.min(safePage-2,totalPages-4));const n=start+i;return <PaginationItem key={n}><PaginationLink href="#" isActive={n===safePage} onClick={(e)=>{e.preventDefault();setPage(n)}}>{n}</PaginationLink></PaginationItem>})}<PaginationItem><PaginationNext href="#" aria-disabled={safePage===totalPages} onClick={(e)=>{e.preventDefault();if(safePage<totalPages)setPage(safePage+1)}}>下一页</PaginationNext></PaginationItem></PaginationContent></Pagination></section>;
}

function MatchRows({game,id,players,result,open,toggle}:{game:Game;id:string;players:[string,PlayerGame][];result:string;open:boolean;toggle:()=>void}){
  return <><TableRow className="click-row" onClick={toggle} aria-expanded={open}><TableCell>{open?<ChevronDown/>:<ChevronRight/>}</TableCell><TableCell><b>{game.ts.slice(0,10)}</b><span className="sub-name">{game.ts.slice(11,16)}</span></TableCell><TableCell>{formatDuration(game.duration_sec)}</TableCell><TableCell>{game.squad_size} 人</TableCell><TableCell><Badge result={result}/></TableCell><TableCell><div className="player-chips">{players.map(([name,p])=><span key={name}>{name.replace(/（.*?）/,"")} · {p.k}/{p.d}/{p.a}</span>)}</div></TableCell><TableCell>{players.map(([name,p])=>p.badge&&<span className="honor" key={name}>{p.badge}</span>)}</TableCell></TableRow>{open&&<TableRow className="detail-row"><TableCell colSpan={7}><div className="match-detail"><div className="tracked-players">{players.map(([name,p])=><article key={name}><div><b>{name}</b><span>{p.pos} · {p.side===0?"A队":"B队"}</span></div><strong>{p.k}/{p.d}/{p.a}</strong><dl><div><dt>伤害</dt><dd>{p.damage.toLocaleString()}</dd></div><div><dt>参团</dt><dd>{p.kill_participation}%</dd></div><div><dt>分均补刀</dt><dd>{p.cs_per_min}</dd></div></dl></article>)}</div><div className="ten-names"><p>本局全部 10 名玩家</p><div>{game.all_ten_names.map((n,i)=><span key={`${n}-${i}`}>{i+1}. {n}</span>)}</div></div></div></TableCell></TableRow>}</>;
}

function Methodology({data}:{data:TeamData}){
  const remakes=data.games.filter(g=>Object.values(g.players)[0]?.result==="重开").length;
  return <div className="method-grid"><section className="panel method-card"><p className="eyebrow">DATA SCOPE</p><h3>数据口径</h3><dl><div><dt>来源</dt><dd>{data.meta.source}</dd></div><div><dt>大区</dt><dd>{data.meta.region}</dd></div><div><dt>队列</dt><dd>{data.meta.queue}</dd></div><div><dt>时间范围</dt><dd>{data.meta.span}</dd></div><div><dt>唯一对局</dt><dd>{data.meta.total_unique_games} 场</dd></div><div><dt>有效胜负</dt><dd>{data.meta.total_unique_games-remakes} 场</dd></div><div><dt>重开</dt><dd>{remakes} 场</dd></div></dl></section><section className="panel method-card"><p className="eyebrow">PROCESSING</p><h3>处理说明</h3><p>{data.meta.note}</p><ul><li>同一对局以“开局时间 + 时长”合并去重。</li><li>成员均值按该成员被收录的个人对局计算。</li><li>搭档胜率只反映共同出现样本，不等同于因果贡献。</li><li>“在场影响”比较成员在场与不在场时的队伍胜率，易受阵容和样本量影响。</li><li>逐局页保留十名玩家昵称，因此整站保持私密访问。</li></ul></section><section className="panel method-card"><p className="eyebrow">FIELD GUIDE</p><h3>指标释义</h3><dl><div><dt>KDA</dt><dd>（击杀 + 助攻）÷ 死亡；数据源已处理零死亡。</dd></div><div><dt>参团率</dt><dd>该成员参与击杀占本队总击杀的比例。</dd></div><div><dt>分均补刀</dt><dd>每分钟获得的补刀数。</dd></div><div><dt>组队人数</dt><dd>一场比赛中同侧出现的固定成员数量。</dd></div><div><dt>搭档场次</dt><dd>两名固定成员同局同侧出现的次数。</dd></div></dl></section></div>;
}

export function Dashboard({ data }: { data: TeamData }) {
  const appearances=Object.values(data.members_summary).reduce((s,m)=>s+m.games,0);const wins=data.monthly.reduce((s,m)=>s+m.w,0);const losses=data.monthly.reduce((s,m)=>s+m.l,0);const remakes=data.games.filter(g=>Object.values(g.players)[0]?.result==="重开").length;const wr=(wins/(wins+losses)*100).toFixed(1);
  return <main className="dashboard-shell"><header className="topbar"><div className="brand-mark"><Shield/></div><div><p className="eyebrow">FLEX QUEUE · PRIVATE ARCHIVE</p><h1>车队战绩数据舱</h1></div><div className="privacy-pill"><LockKeyhole/>共享密码访问</div></header><section className="intro-strip"><div><p className="kicker">联盟二区 · 灵活排位</p><h2>{data.meta.total_unique_games} 场对局，一眼看清车队状态。</h2></div><p>数据覆盖 {data.meta.span.replace(" ~ "," 至 ")}，已按开局时间与时长去重。</p></section><section className="stat-grid"><Stat icon={Activity} label="去重对局" value={String(data.meta.total_unique_games)} hint={`${remakes} 场重开`} /><Stat icon={Users} label="成员出场" value={appearances.toLocaleString("zh-CN")} hint={`${Object.keys(data.members_summary).length} 名固定成员`} /><Stat icon={Gauge} label="有效胜率" value={`${wr}%`} hint={`${wins} 胜 · ${losses} 负`} /><Stat icon={CalendarDays} label="统计月份" value={String(data.monthly.length)} hint="跨 2025—2026 赛季" /></section><Tabs defaultValue="combo" className="main-tabs"><TabsList variant="line" className="tab-list"><TabsTrigger value="overview"><BarChart3/>总览</TabsTrigger><TabsTrigger value="combo"><Gauge/>组合分析</TabsTrigger><TabsTrigger value="members"><Users/>成员</TabsTrigger><TabsTrigger value="synergy"><Swords/>搭档</TabsTrigger><TabsTrigger value="insights"><Sparkles/>洞察实验室</TabsTrigger><TabsTrigger value="matches"><Search/>逐局</TabsTrigger><TabsTrigger value="method"><Shield/>口径</TabsTrigger></TabsList><TabsContent value="overview"><Overview data={data}/></TabsContent><TabsContent value="combo"><CombinationExplorer data={data}/></TabsContent><TabsContent value="members"><Members data={data}/></TabsContent><TabsContent value="synergy"><Synergy data={data}/></TabsContent><TabsContent value="insights"><InsightLab data={data}/></TabsContent><TabsContent value="matches"><Matches data={data}/></TabsContent><TabsContent value="method"><Methodology data={data}/></TabsContent></Tabs><footer><span>数据生成于本地 · 私密存档</span><span>{data.meta.source}</span></footer></main>;
}
