import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, BarChart3, BookOpen, Check, ChevronDown, ClipboardCheck, Download,
  FolderKanban, GraduationCap, LayoutDashboard, LogOut, Menu, Plus, Search,
  Settings, Shield, SlidersHorizontal, Users, UserRound, X, Pencil, Trash2,
  CircleHelp, ArrowUpRight,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, PolarAngleAxis,
  PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip,
  XAxis, YAxis,
} from 'recharts';

const SKILLS = ['Communication', 'Cooperation', 'Participation', 'Responsibility', 'Problem Solving', 'Respect for Others'];
const STAGES = ['Initial', 'Ongoing', 'Final'];
const STRATEGIES = [
  { name: 'Think-Pair-Share', description: 'Students think individually about a prompt, discuss ideas with a partner, then share conclusions with the class.', objectives: 'Active listening, clear expression, confidence', materials: 'Prompt cards, whiteboard', steps: 'Think independently · Pair and discuss · Share with class', skills: ['Communication', 'Participation'], duration: '20–30 min' },
  { name: 'Jigsaw Classroom', description: 'Expert groups learn one topic, then teach it to their home group so everyone builds the full picture.', objectives: 'Peer teaching, shared responsibility, synthesis', materials: 'Topic readings, note sheets', steps: 'Form home groups · Meet as experts · Teach your group', skills: ['Cooperation', 'Responsibility'], duration: '45–60 min' },
  { name: 'Group Problem Solving', description: 'Teams work together to solve an open-ended challenge and explain the reasoning behind their solution.', objectives: 'Reasoning, negotiation, shared decisions', materials: 'Challenge brief, paper or manipulatives', steps: 'Understand the problem · Explore solutions · Agree and present', skills: ['Problem Solving', 'Cooperation'], duration: '30–45 min' },
  { name: 'Peer Teaching', description: 'Students take turns explaining a concept or skill to a peer and check understanding together.', objectives: 'Clear explanations, empathy, feedback', materials: 'Learning materials, question cards', steps: 'Prepare · Teach a partner · Switch and reflect', skills: ['Communication', 'Respect for Others'], duration: '20–30 min' },
  { name: 'Team-Based Projects', description: 'Students create a shared product with clear roles, milestones, and a team reflection.', objectives: 'Planning, accountability, collaboration', materials: 'Project brief, shared supplies', steps: 'Set roles · Plan milestones · Create and reflect', skills: ['Responsibility', 'Cooperation'], duration: '1–3 weeks' },
  { name: 'Round Robin Discussion', description: 'Group members take turns sharing ideas while teammates listen without interruption.', objectives: 'Equitable voice, listening, respectful dialogue', materials: 'Discussion prompt, timer', steps: 'Set a prompt · Take turns · Summarize patterns', skills: ['Participation', 'Respect for Others'], duration: '15–20 min' },
  { name: 'Group Investigation', description: 'Teams develop questions, gather information, and present evidence-based findings.', objectives: 'Inquiry, task sharing, evidence evaluation', materials: 'Research sources, devices, poster paper', steps: 'Choose a question · Investigate · Synthesize and present', skills: ['Problem Solving', 'Responsibility'], duration: '2–4 sessions' },
];
const seedData = () => {
  const rows = [
    ['ST-101', 'Maya Hassan', 'Grade 8', 'Group A', [2,3,3,2,2,3], [4,4,4,4,3,4]], ['ST-102', 'Omar Khaled', 'Grade 8', 'Group A', [3,2,3,3,2,3], [4,4,4,4,4,4]],
    ['ST-103', 'Lina Ahmed', 'Grade 8', 'Group B', [3,3,2,3,3,3], [5,4,4,4,4,5]], ['ST-104', 'Youssef Ali', 'Grade 8', 'Group B', [2,2,3,3,2,2], [4,3,4,4,4,4]],
    ['ST-105', 'Salma Nabil', 'Grade 7', 'Group C', [4,3,4,3,3,4], [5,4,5,4,4,5]], ['ST-106', 'Adam Samir', 'Grade 7', 'Group C', [2,3,2,2,3,3], [4,4,4,3,4,4]],
    ['ST-107', 'Nour Fathy', 'Grade 7', 'Group D', [3,4,3,3,3,4], [4,5,4,4,4,5]], ['ST-108', 'Ziad Mostafa', 'Grade 8', 'Group D', [2,3,2,3,2,3], [4,4,4,4,3,4]],
  ];
  return {
    students: rows.map(([id, name, grade, group, initial, final]) => ({ id, name, grade, group, history: [
      { stage: 'Initial', date: '2026-09-05', scores: initial, notes: 'Baseline assessment before collaborative learning.' },
      { stage: 'Ongoing', date: '2026-10-12', scores: initial.map((v, i) => Math.min(5, v + (final[i] > v ? 1 : 0))), notes: 'Growing confidence during group activities.' },
      { stage: 'Final', date: '2026-11-01', scores: final, notes: 'End of program assessment.' },
    ] })),
    activities: [
      { id: 'AC-01', title: 'Community Garden Challenge', strategy: 'Group Problem Solving', date: '2026-11-01', group: 'Group A', status: 'Completed', notes: 'Teams designed a garden plan.' },
      { id: 'AC-02', title: 'Our Local Ecosystem', strategy: 'Jigsaw Classroom', date: '2026-10-28', group: 'Group B', status: 'Completed', notes: 'Students shared expert topics.' },
      { id: 'AC-03', title: 'Story Circle', strategy: 'Round Robin Discussion', date: '2026-11-06', group: 'Grade 7', status: 'Planned', notes: 'Take turns building a shared story.' },
    ], groups: ['Group A', 'Group B', 'Group C', 'Group D'], customStrategies: [],
  };
};

const navItems = [
  ['Dashboard', LayoutDashboard], ['Students', Users], ['Assessments', ClipboardCheck],
  ['Learning Strategies', BookOpen], ['Activities', Activity], ['Groups', FolderKanban], ['Reports', BarChart3],
];
const average = values => values?.length ? values.reduce((a, b) => a + Number(b || 0), 0) / values.length : 0;
const scoreAvg = scores => average(scores || []);
const format = n => Number(n || 0).toFixed(1);
const initials = name => (name || '?').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
const dateToday = () => new Date().toISOString().slice(0, 10);
const initialAssessment = student => student.history?.find(item => item.stage === 'Initial') || student.history?.[0] || { scores: Array(6).fill(0) };
const latestAssessment = student => student.history?.at(-1) || { scores: Array(6).fill(0), stage: '—', date: '' };
const finalAssessment = student => [...(student.history || [])].reverse().find(item => item.stage === 'Final') || latestAssessment(student);
const improvement = student => scoreAvg(finalAssessment(student).scores) - scoreAvg(initialAssessment(student).scores);
const initialsForId = () => `ST-${String(Date.now()).slice(-5)}`;

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

function Button({ children, variant = 'secondary', icon: Icon, ...props }) {
  return <button className={`btn ${variant}`} {...props}>{Icon && <Icon size={16} />}{children}</button>;
}
function PageHeading({ title, subtitle, action }) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}
function StatCard({ label, value, note, icon: Icon, good = false }) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={18} /></span></div><strong>{value}</strong><small className={good ? 'good' : ''}>{note}</small></article>;
}
function Panel({ title, subtitle, actions, children, className = '' }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{actions}</div>{children}</section>;
}
function Empty({ children }) { return <div className="empty-state">{children}</div>; }

function SignIn({ mode, setMode, onAuth }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try { await onAuth(fields); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="auth-layout"><section className="auth-card">
    <Brand /><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
    <p className="muted">{mode === 'login' ? 'Sign in to your classroom workspace.' : 'Register as a teacher to get started.'}</p>
    {error && <div className="form-error">{error}</div>}
    <form className="stack-form" onSubmit={submit}>
      {mode === 'register' && <Field label="Your name"><input name="name" className="field" minLength="2" required autoComplete="name" /></Field>}
      <Field label="Email address"><input className="field" type="email" name="email" required autoComplete="email" /></Field>
      <Field label="Password"><input className="field" type="password" name="password" minLength="10" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><small>At least 10 characters</small></Field>
      {mode === 'register' && <Field label="Admin setup key (optional)"><input className="field" type="password" name="adminKey" autoComplete="off" /><small>Only needed when creating the first administrator.</small></Field>}
      <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create teacher account'}</Button>
    </form>
    <p className="auth-switch">{mode === 'login' ? 'New to TeamTrack?' : 'Already registered?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
  </section></main>;
}

function Brand() { return <div className="brand"><span className="brand-mark">T</span><span>TeamTrack</span></div>; }
function Field({ label, children, className = '' }) { return <label className={`form-field ${className}`}><span>{label}</span>{children}</label>; }
function Modal({ title, onClose, children, onSubmit, submitLabel = 'Save' }) {
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><form className="modal" onSubmit={onSubmit}><header><h2>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></header><div className="modal-content">{children}</div><footer><Button type="button" onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">{submitLabel}</Button></footer></form></div>;
}
function SkillRatings({ scores, setScores }) {
  return <div className="rating-list">{SKILLS.map((skill, index) => <div className="rating-row" key={skill}><span>{index + 1}. {skill}</span><div role="group" aria-label={skill} className="rating-buttons">{[1,2,3,4,5].map(value => <button type="button" className={scores[index] === value ? 'chosen' : ''} onClick={() => setScores(current => current.map((n, i) => i === index ? value : n))} key={value} aria-pressed={scores[index] === value}>{value}</button>)}</div></div>)}</div>;
}

function AssessmentDialog({ students, student, onClose, onSave }) {
  const [scores, setScores] = useState(Array(6).fill(3));
  const [error, setError] = useState('');
  function submit(e) { e.preventDefault(); const form = new FormData(e.currentTarget); onSave({ studentId: form.get('studentId'), stage: form.get('stage'), date: form.get('date'), notes: form.get('notes'), scores }); }
  return <Modal title="Teamwork assessment" onClose={onClose} onSubmit={submit}>
    <div className="form-grid"><Field label="Student"><select className="field" name="studentId" defaultValue={student?.id || students[0]?.id}>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><Field label="Assessment stage"><select className="field" name="stage" defaultValue="Ongoing">{STAGES.map(s => <option key={s}>{s}</option>)}</select></Field><Field label="Date"><input className="field" name="date" type="date" defaultValue={dateToday()} required /></Field></div>
    <p className="form-intro">Rate each skill from 1 (Poor) to 5 (Excellent).</p><SkillRatings scores={scores} setScores={setScores} />
    <Field label="Teacher observations"><textarea className="field" name="notes" rows="3" placeholder="Record what you noticed during teamwork…" /></Field>{error && <p className="form-error">{error}</p>}
  </Modal>;
}

function StudentDialog({ student, groups, onClose, onSave }) {
  function submit(e) { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); onSave(data); }
  return <Modal title={student ? 'Edit student' : 'Add student'} onClose={onClose} onSubmit={submit}>
    <div className="form-grid"><Field label="Student ID"><input className="field" name="id" required defaultValue={student?.id || initialsForId()} readOnly={!!student} /></Field><Field label="Full name"><input className="field" name="name" required defaultValue={student?.name || ''} /></Field><Field label="Class / Grade"><input className="field" name="grade" required placeholder="Grade 8" defaultValue={student?.grade || ''} /></Field><Field label="Group"><select className="field" name="group" defaultValue={student?.group || ''}><option value="">Unassigned</option>{groups.map(g => <option key={g}>{g}</option>)}</select></Field></div>
  </Modal>;
}

function ActivityDialog({ groups, strategies, activity, onClose, onSave }) {
  function submit(e) { e.preventDefault(); onSave(Object.fromEntries(new FormData(e.currentTarget))); }
  return <Modal title={activity ? 'Edit activity' : 'Create classroom activity'} onClose={onClose} onSubmit={submit}>
    <div className="form-grid"><Field label="Activity title" className="span-two"><input className="field" name="title" required defaultValue={activity?.title || ''} placeholder="e.g. Build a better community" /></Field><Field label="Learning strategy"><select className="field" name="strategy" defaultValue={activity?.strategy || strategies[0]?.name}>{strategies.map(s => <option key={s.name}>{s.name}</option>)}</select></Field><Field label="Assigned group / class"><select className="field" name="group" defaultValue={activity?.group || groups[0] || ''}>{groups.map(g => <option key={g}>{g}</option>)}</select></Field><Field label="Activity date"><input className="field" name="date" type="date" required defaultValue={activity?.date || dateToday()} /></Field><Field label="Status"><select className="field" name="status" defaultValue={activity?.status || 'Planned'}><option>Planned</option><option>Completed</option></select></Field><Field label="Instructions and observations" className="span-two"><textarea className="field" name="notes" rows="3" defaultValue={activity?.notes || ''} placeholder="What will students do? What will you observe?" /></Field><Field label="Expected learning outcomes" className="span-two"><input className="field" name="outcomes" defaultValue={activity?.outcomes || ''} placeholder="Listening, shared decisions…" /></Field></div>
  </Modal>;
}

function StrategyDialog({ onClose, onSave }) {
  function submit(e) { e.preventDefault(); const form = e.currentTarget; const data = Object.fromEntries(new FormData(form)); data.skills = [...form.elements.skills.selectedOptions].map(o => o.value); onSave(data); }
  return <Modal title="Create learning strategy" onClose={onClose} onSubmit={submit}>
    <div className="form-grid"><Field label="Strategy name" className="span-two"><input className="field" name="name" required /></Field><Field label="Description" className="span-two"><textarea className="field" name="description" required rows="3" /></Field><Field label="Learning objectives"><input className="field" name="objectives" /></Field><Field label="Required materials"><input className="field" name="materials" /></Field><Field label="Implementation steps" className="span-two"><textarea className="field" name="steps" rows="3" /></Field><Field label="Teamwork skills"><select className="field" name="skills" multiple size="5">{SKILLS.map(s => <option key={s}>{s}</option>)}</select></Field><Field label="Suggested duration"><input className="field" name="duration" placeholder="30–45 min" /></Field></div>
  </Modal>;
}

function GroupDialog({ students, groups, groupName, onClose, onSave }) {
  function submit(e) { e.preventDefault(); const form = new FormData(e.currentTarget); onSave({ name: form.get('name'), members: form.getAll('members') }); }
  return <Modal title={groupName ? 'Manage group' : 'Create group'} onClose={onClose} onSubmit={submit}>
    <Field label="Group name"><input className="field" name="name" required defaultValue={groupName || ''} /></Field>
    <p className="form-intro">Select the students in this group.</p><div className="member-list">{students.map(s => <label key={s.id}><input type="checkbox" name="members" value={s.id} defaultChecked={s.group === groupName} /><span>{s.name}</span><small>{s.grade}</small></label>)}</div>
    {!groups.length && <p className="muted">Create a group name, then select its students.</p>}
  </Modal>;
}

function StudentTable({ students, onProfile, onAssess, onEdit, onDelete }) {
  return <div className="table-scroll"><table><thead><tr><th>Student</th><th>Class</th><th>Group</th><th>Initial</th><th>Current</th><th>Improvement</th><th>Actions</th></tr></thead><tbody>{students.map(s => <tr key={s.id}><td><button className="student-cell" onClick={() => onProfile(s)}><span className="avatar">{initials(s.name)}</span><span><b>{s.name}</b><small>{s.id}</small></span></button></td><td>{s.grade}</td><td><span className="pill">{s.group || 'Unassigned'}</span></td><td>{format(scoreAvg(initialAssessment(s).scores))}</td><td>{format(scoreAvg(latestAssessment(s).scores))}</td><td className={improvement(s) >= 0 ? 'good-text' : 'bad-text'}>{improvement(s) >= 0 ? '+' : ''}{format(improvement(s))} pts</td><td><div className="row-actions"><button className="icon-button" title="Assess" onClick={() => onAssess(s)}><ClipboardCheck size={16} /></button><button className="icon-button" title="Edit" onClick={() => onEdit(s)}><Pencil size={15} /></button><button className="icon-button danger-icon" title="Delete" onClick={() => onDelete(s)}><Trash2 size={15} /></button></div></td></tr>)}{!students.length && <tr><td colSpan="7"><Empty>No students match this view. Add a student to get started.</Empty></td></tr>}</tbody></table></div>;
}

function Dashboard({ data, user, onNewActivity, onPage }) {
  const comparison = SKILLS.map((skill, i) => ({ skill: ['Comm.','Coop.','Part.','Resp.','Problem','Respect'][i], Initial: average(data.students.map(s => initialAssessment(s).scores[i])), Latest: average(data.students.map(s => latestAssessment(s).scores[i])) }));
  const radar = SKILLS.map((skill, i) => ({ skill, score: average(data.students.map(s => latestAssessment(s).scores[i])), fullMark: 5 }));
  const progress = ['Initial','Ongoing','Final'].map(stage => ({ stage, score: average(data.students.flatMap(s => s.history.filter(h => h.stage === stage).map(h => scoreAvg(h.scores)))) }));
  const meanImprovement = average(data.students.map(improvement));
  return <>
    <PageHeading title={`Good morning, ${user.name.split(' ')[0]}`} subtitle="Here’s an overview of your classroom teamwork progress." action={<Button variant="primary" icon={Plus} onClick={onNewActivity}>New activity</Button>} />
    <div className="stats-grid"><StatCard label="Registered students" value={data.students.length} note="Across your classes" icon={GraduationCap} /><StatCard label="Currently assessed" value={data.students.filter(s => s.history?.length).length} note="Assessment records on file" icon={ClipboardCheck} /><StatCard label="Activities conducted" value={data.activities.filter(a => a.status === 'Completed').length} note="Collaborative sessions completed" icon={Activity} /><StatCard label="Average improvement" value={`${meanImprovement >= 0 ? '+' : ''}${format(meanImprovement)}`} note="Points per teamwork skill" icon={ArrowUpRight} good /></div>
    <div className="dashboard-charts"><Panel title="Assessment comparison" subtitle="Average skill scores before and after the program" actions={<Legend content={() => <div className="chart-legend"><span><i className="legend-dot initial-dot" />Initial</span><span><i className="legend-dot latest-dot" />Latest</span></div>} />}>
      {data.students.length ? <div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparison} margin={{ top: 10, right: 12, bottom: 2, left: -18 }} barGap={4}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="skill" tickLine={false} axisLine={false} /><YAxis domain={[0,5]} ticks={[0,1,2,3,4,5]} tickLine={false} axisLine={false} /><Tooltip /><Bar dataKey="Initial" fill="#b9cafb" radius={[4,4,0,0]} /><Bar dataKey="Latest" fill="#4778e8" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div> : <Empty>Add students and assessments to see scores.</Empty>}
    </Panel><Panel title="Teamwork skills" subtitle="Current classroom averages · out of 5">
      {data.students.length ? <div className="radar-box"><ResponsiveContainer width="100%" height="100%"><RadarChart data={radar} outerRadius="68%"><PolarGrid /><PolarAngleAxis dataKey="skill" tick={{ fill: '#74839a', fontSize: 11 }} /><PolarRadiusAxis domain={[0,5]} tickCount={6} tick={{ fill: '#98a4b5', fontSize: 9 }} /><Radar dataKey="score" stroke="#4778e8" fill="#4778e8" fillOpacity={0.18} strokeWidth={2} /></RadarChart></ResponsiveContainer></div> : <Empty>No student assessments yet.</Empty>}
    </Panel></div>
    <div className="dashboard-bottom"><Panel title="Progress over time" subtitle="Class average at each assessment stage"><div className="chart-box short-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={progress} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="stage" tickLine={false} axisLine={false} /><YAxis domain={[0,5]} ticks={[0,1,2,3,4,5]} tickLine={false} axisLine={false} /><Tooltip /><Line dataKey="score" stroke="#4778e8" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div></Panel>
      <Panel title="Recent activities" subtitle="Latest classroom sessions" actions={<button className="text-button" onClick={() => onPage('Activities')}>View all</button>}><div className="recent-list">{[...data.activities].sort((a,b) => b.date.localeCompare(a.date)).slice(0,4).map(a => <div className="recent-row" key={a.id}><span className="recent-icon"><Activity size={16} /></span><div><b>{a.title}</b><small>{a.strategy} · {a.group}</small></div><time>{a.date}</time></div>)}{!data.activities.length && <Empty>No activities yet.</Empty>}</div></Panel>
    </div>
  </>;
}

function App() {
  const [user, setUser] = useState(null), [authMode, setAuthMode] = useState('login'), [data, setData] = useState(seedData), [ready, setReady] = useState(false);
  const [page, setPage] = useState('Dashboard'), [query, setQuery] = useState(''), [groupFilter, setGroupFilter] = useState('All groups');
  const [dialog, setDialog] = useState(null), [toast, setToast] = useState(''), [mobileOpen, setMobileOpen] = useState(false), [accounts, setAccounts] = useState([]), [reportStudent, setReportStudent] = useState('all');
  const notify = message => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const persist = useCallback(next => { setData(next); api('/api/state', { method: 'PUT', body: JSON.stringify({ state: next }) }).catch(error => notify(`Could not save: ${error.message}`)); }, []);

  useEffect(() => { let mounted = true; (async () => { try { const session = await api('/api/auth/me'); const state = await api('/api/state'); if (!mounted) return; setUser(session.user); if (state.state) setData(state.state); else { const initial = seedData(); setData(initial); await api('/api/state', { method: 'PUT', body: JSON.stringify({ state: initial }) }); } } catch { if (mounted) setUser(null); } finally { if (mounted) setReady(true); } })(); return () => { mounted = false; }; }, []);

  async function authenticate(fields) { const route = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'; const result = await api(route, { method: 'POST', body: JSON.stringify(fields) }); setUser(result.user); const state = await api('/api/state'); if (state.state) setData(state.state); else { const initial = seedData(); setData(initial); await api('/api/state', { method: 'PUT', body: JSON.stringify({ state: initial }) }); } setPage('Dashboard'); }
  async function signOut() { await api('/api/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null); setPage('Dashboard'); }
  const mutate = update => { const next = typeof update === 'function' ? update(data) : update; persist(next); };
  const allGroups = useMemo(() => [...new Set([...(data.groups || []), ...data.students.map(s => s.group).filter(Boolean)])], [data]);
  const strategies = useMemo(() => [...STRATEGIES, ...(data.customStrategies || [])], [data]);
  function changePage(next) { setPage(next); setQuery(''); setMobileOpen(false); if (next === 'Admin') api('/api/admin/users').then(r => setAccounts(r.users)).catch(e => notify(e.message)); }
  function saveStudent(form, existing) {
    if (existing) mutate(current => ({ ...current, students: current.students.map(s => s.id === existing.id ? { ...s, ...form } : s) }));
    else { if (data.students.some(s => s.id === form.id)) return notify('That student ID already exists.'); mutate(current => ({ ...current, students: [...current.students, { ...form, history: [{ stage: 'Initial', date: dateToday(), scores: Array(6).fill(3), notes: 'Baseline score. Update after teacher review.' }] }] })); }
    setDialog(null); notify(existing ? 'Student updated' : 'Student added');
  }
  function saveAssessment(form) { const target = data.students.find(s => s.id === form.studentId); if (!target) return; mutate(current => ({ ...current, students: current.students.map(s => s.id === target.id ? { ...s, history: [...s.history, { stage: form.stage, date: form.date, scores: form.scores, notes: form.notes }] } : s) })); setDialog(null); notify(`${form.stage} assessment saved for ${target.name}`); }
  function saveActivity(form, existing) { if (existing) mutate(current => ({ ...current, activities: current.activities.map(a => a.id === existing.id ? { ...a, ...form } : a) })); else mutate(current => ({ ...current, activities: [...current.activities, { ...form, id: `AC-${Date.now()}` }] })); setDialog(null); notify(existing ? 'Activity updated' : 'Activity created'); }
  function saveGroup({ name, members }, previous = '') { const nextGroups = [...new Set([...(data.groups || []), name.trim()])]; mutate(current => ({ ...current, groups: nextGroups, students: current.students.map(s => members.includes(s.id) ? { ...s, group: name.trim() } : s.group === previous ? { ...s, group: '' } : s) })); setDialog(null); notify('Group saved'); }
  function saveStrategy(strategy) { mutate(current => ({ ...current, customStrategies: [...(current.customStrategies || []), strategy] })); setDialog(null); notify('Strategy added'); }
  function removeStudent(student) { if (window.confirm(`Delete ${student.name} and their assessment history?`)) { mutate(current => ({ ...current, students: current.students.filter(s => s.id !== student.id) })); notify('Student deleted'); } }
  function exportCsv() { const rows = [['Student ID','Student Name','Class','Group','Stage','Date',...SKILLS,'Average','Observation']]; data.students.forEach(s => s.history.forEach(h => rows.push([s.id,s.name,s.grade,s.group,h.stage,h.date,...h.scores,format(scoreAvg(h.scores)),h.notes || '']))); const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"','""')}"`).join(',')).join('\r\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'teamtrack-assessment-report.csv'; link.click(); URL.revokeObjectURL(link.href); }

  if (!ready) return <div className="loading"><span className="brand-mark">T</span><p>Loading TeamTrack…</p></div>;
  if (!user) return <SignIn mode={authMode} setMode={setAuthMode} onAuth={authenticate} />;

  const studentsView = data.students.filter(s => `${s.name} ${s.id} ${s.grade}`.toLowerCase().includes(query.toLowerCase()) && (groupFilter === 'All groups' || s.group === groupFilter));
  const studentHandlers = { onProfile: student => { setDialog({ type: 'profile', student }); setPage('Students'); }, onAssess: student => setDialog({ type: 'assessment', student }), onEdit: student => setDialog({ type: 'student', student }), onDelete: removeStudent };
  const content = (() => {
    if (page === 'Dashboard') return <Dashboard data={data} user={user} onNewActivity={() => setDialog({ type: 'activity' })} onPage={changePage} />;
    if (page === 'Students') return <><PageHeading title="Students" subtitle="Manage your class roster and track each student's growth." action={<Button variant="primary" icon={Plus} onClick={() => setDialog({ type: 'student' })}>Add student</Button>} /><Panel title="Class roster" subtitle={`${studentsView.length} of ${data.students.length} students`}><div className="table-tools"><label className="search-field"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search students…" /></label><select className="field filter-field" value={groupFilter} onChange={e => setGroupFilter(e.target.value)}><option>All groups</option>{allGroups.map(g => <option key={g}>{g}</option>)}</select></div><StudentTable students={studentsView} {...studentHandlers} /></Panel></>;
    if (page === 'Assessments') return <><PageHeading title="Assessments" subtitle="Record initial, ongoing, or final teamwork observations." action={<Button variant="primary" icon={Plus} onClick={() => setDialog({ type: 'assessment', student: data.students[0] })}>New assessment</Button>} /><Panel title="Assessment history" subtitle="Scores are linked to the student and assessment stage."><div className="table-scroll"><table><thead><tr><th>Student</th><th>Stage</th><th>Date</th><th>Average</th><th>Teacher observation</th></tr></thead><tbody>{data.students.flatMap(s => s.history.map((h, index) => ({ s, h, key: `${s.id}-${index}` }))).sort((a,b) => b.h.date.localeCompare(a.h.date)).map(({ s, h, key }) => <tr key={key}><td><button className="text-button" onClick={() => setDialog({ type: 'profile', student: s })}>{s.name}</button></td><td><span className="pill">{h.stage}</span></td><td>{h.date}</td><td><b>{format(scoreAvg(h.scores))} / 5</b></td><td>{h.notes || '—'}</td></tr>)}</tbody></table></div></Panel></>;
    if (page === 'Learning Strategies') return <><PageHeading title="Learning Strategies" subtitle="Explore collaborative approaches and create your own." action={<Button variant="primary" icon={Plus} onClick={() => setDialog({ type: 'strategy' })}>Create strategy</Button>} /><div className="strategy-grid">{strategies.map(strategy => <article className="strategy-card" key={strategy.name}><div className="strategy-icon"><BookOpen size={18} /></div><h2>{strategy.name}</h2><p>{strategy.description}</p><div className="tag-list">{strategy.skills?.map(skill => <span className="tag" key={skill}>{skill}</span>)}</div><dl><dt>Objectives</dt><dd>{strategy.objectives}</dd><dt>Materials</dt><dd>{strategy.materials}</dd><dt>Suggested steps</dt><dd>{strategy.steps}</dd><dt>Duration</dt><dd>{strategy.duration}</dd></dl><Button onClick={() => setDialog({ type: 'activity', strategy: strategy.name })} icon={Plus}>Plan activity</Button></article>)}</div></>;
    if (page === 'Activities') return <><PageHeading title="Activities" subtitle="Plan collaborative sessions, assign groups, and track completion." action={<Button variant="primary" icon={Plus} onClick={() => setDialog({ type: 'activity' })}>New activity</Button>} /><Panel title="Classroom activities" subtitle="Update an activity's status or record assessments for its group."><div className="table-scroll"><table><thead><tr><th>Activity</th><th>Strategy</th><th>Date</th><th>Assigned to</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.activities.map(a => <tr key={a.id}><td><b>{a.title}</b><small className="subcell">{a.notes}</small></td><td>{a.strategy}</td><td>{a.date}</td><td><span className="pill">{a.group}</span></td><td><span className={`pill ${a.status === 'Completed' ? 'status-complete' : ''}`}>{a.status}</span></td><td><div className="row-actions"><button className="icon-button" title="Edit" onClick={() => setDialog({ type: 'activity', activity: a })}><Pencil size={15} /></button><button className="icon-button" title="Toggle completion" onClick={() => mutate(current => ({ ...current, activities: current.activities.map(item => item.id === a.id ? { ...item, status: item.status === 'Completed' ? 'Planned' : 'Completed' } : item) }))}>{a.status === 'Completed' ? <Check size={16} /> : <Activity size={16} />}</button><button className="icon-button danger-icon" title="Delete" onClick={() => window.confirm('Delete this activity?') && mutate(current => ({ ...current, activities: current.activities.filter(item => item.id !== a.id) }))}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table>{!data.activities.length && <Empty>No activities yet. Create a classroom activity to begin.</Empty>}</div></Panel></>;
    if (page === 'Groups') return <><PageHeading title="Groups" subtitle="Organize students and compare teamwork performance." action={<Button variant="primary" icon={Plus} onClick={() => setDialog({ type: 'group' })}>Create group</Button>} /><div className="group-grid">{allGroups.map(g => { const members = data.students.filter(s => s.group === g); return <Panel key={g} title={g} subtitle={`${members.length} students`} actions={<button className="icon-button" onClick={() => setDialog({ type: 'group', groupName: g })}><Pencil size={15} /></button>}><div className="group-stats"><div><small>Latest average</small><b>{format(average(members.map(s => scoreAvg(latestAssessment(s).scores))))} / 5</b></div><div><small>Improvement</small><b className="good-text">+{format(average(members.map(improvement)))}</b></div></div><div className="tag-list">{members.map(s => <span className="tag" key={s.id}>{s.name}</span>)}</div><Button onClick={() => setDialog({ type: 'group', groupName: g })}>Manage members</Button></Panel>; })}</div></>;
    if (page === 'Reports') { const selected = reportStudent === 'all' ? data.students : data.students.filter(s => s.id === reportStudent); const chartRows = SKILLS.map((skill, i) => ({ skill: ['Comm.','Coop.','Part.','Resp.','Problem','Respect'][i], Initial: average(selected.map(s => initialAssessment(s).scores[i])), Latest: average(selected.map(s => latestAssessment(s).scores[i])) })); return <><PageHeading title="Reports & Analytics" subtitle="Understand growth across students, skills, groups, and activities." action={<Button icon={Download} onClick={exportCsv}>Export CSV</Button>} /><Panel title="Classroom improvement" subtitle="Initial assessment compared with the latest score" actions={<select className="field" value={reportStudent} onChange={e => setReportStudent(e.target.value)}><option value="all">All students</option>{data.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}>{selected.length ? <div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartRows} margin={{ top: 12, right: 14, bottom: 2, left: -18 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="skill" tickLine={false} axisLine={false} /><YAxis domain={[0,5]} ticks={[0,1,2,3,4,5]} tickLine={false} axisLine={false} /><Tooltip /><Legend /><Bar dataKey="Initial" fill="#b9cafb" radius={[4,4,0,0]} /><Bar dataKey="Latest" fill="#4778e8" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div> : <Empty>No student records to report.</Empty>}</Panel><div className="dashboard-charts reports-grid"><Panel title="Skill improvement" subtitle="Average points gained from initial to latest">{SKILLS.map((skill, i) => { const value = average(data.students.map(s => finalAssessment(s).scores[i] - initialAssessment(s).scores[i])); return <div className="skill-meter" key={skill}><span>{skill}</span><div className="meter-track"><i style={{ width: `${Math.max(0, value) / 5 * 100}%` }} /></div><b>+{format(value)}</b></div>; })}</Panel><Panel title="Group comparison" subtitle="Current average by group">{allGroups.map(g => { const groupStudents = data.students.filter(s => s.group === g); const value = average(groupStudents.map(s => scoreAvg(latestAssessment(s).scores))); return <div className="skill-meter" key={g}><span>{g}</span><div className="meter-track"><i style={{ width: `${value / 5 * 100}%` }} /></div><b>{format(value)}</b></div>; })}</Panel></div><Panel title="Individual student improvement" subtitle="Initial compared with latest scores"><StudentTable students={selected} {...studentHandlers} /></Panel></>; }
    if (page === 'Admin') return <><PageHeading title="Account administration" subtitle="Manage teacher accounts and administrator access." /><Panel title="Team accounts" subtitle="Grant administrator access only to trusted staff." actions={<Button onClick={() => api('/api/admin/users').then(r => setAccounts(r.users)).catch(e => notify(e.message))}>Refresh</Button>}><div className="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Action</th></tr></thead><tbody>{accounts.map(account => <tr key={account.id}><td><b>{account.name}</b></td><td>{account.email}</td><td><span className="pill">{account.role}</span></td><td>{new Date(account.createdAt).toLocaleDateString()}</td><td>{account.id === user.id ? 'Current account' : <Button onClick={() => api('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ id: account.id, role: account.role === 'admin' ? 'teacher' : 'admin' }) }).then(r => setAccounts(current => current.map(a => a.id === account.id ? r.user : a))).catch(e => notify(e.message))}>Make {account.role === 'admin' ? 'teacher' : 'admin'}</Button>}</td></tr>)}</tbody></table></div></Panel></>;
    return <ProfilePage student={dialog?.student} onBack={() => setDialog(null)} onAssess={() => setDialog({ type: 'assessment', student: dialog.student })} data={data} />;
  })();

  const showAdmin = user.role === 'admin';
  return <div className="app-shell"><aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}><Brand /><p className="nav-label">WORKSPACE</p><nav>{navItems.map(([label, Icon]) => <button className={page === label ? 'active' : ''} key={label} onClick={() => changePage(label)}><Icon size={18} />{label}</button>)}{showAdmin && <button className={page === 'Admin' ? 'active' : ''} onClick={() => changePage('Admin')}><Shield size={18} />Admin</button>}</nav><div className="sidebar-note"><b>Collaborative learning</b><span>Build stronger teams, one activity at a time.</span></div></aside>
    <main className="main-area"><header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileOpen(open => !open)} aria-label="Toggle navigation"><Menu /></button><span>Workspace <b>/ {page}</b></span></div><div className="topbar-right"><span className="role-label">{user.role} account</span><span className="user-avatar">{initials(user.name)}</span><b className="user-name">{user.name}</b><button className="btn signout" onClick={signOut}><LogOut size={15} />Sign out</button></div></header><div className="page-content">{content}</div></main>
    {dialog?.type === 'student' && <StudentDialog student={dialog.student} groups={allGroups} onClose={() => setDialog(null)} onSave={form => saveStudent(form, dialog.student)} />}
    {dialog?.type === 'assessment' && <AssessmentDialog students={data.students} student={dialog.student} onClose={() => setDialog(null)} onSave={saveAssessment} />}
    {dialog?.type === 'activity' && <ActivityDialog groups={[...allGroups, ...new Set(data.students.map(s => s.grade))]} strategies={strategies} activity={dialog.activity} onClose={() => setDialog(null)} onSave={form => saveActivity(form, dialog.activity)} />}
    {dialog?.type === 'strategy' && <StrategyDialog onClose={() => setDialog(null)} onSave={saveStrategy} />}
    {dialog?.type === 'group' && <GroupDialog students={data.students} groups={allGroups} groupName={dialog.groupName} onClose={() => setDialog(null)} onSave={form => saveGroup(form, dialog.groupName)} />}
    {dialog?.type === 'profile' && <ProfileModal student={dialog.student} data={data} onClose={() => setDialog(null)} onAssess={() => setDialog({ type: 'assessment', student: dialog.student })} />}
    {toast && <div className="toast-message">{toast}</div>}
  </div>;
}

function ProfileModal({ student, data, onClose, onAssess }) {
  if (!student) return null;
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="modal profile-modal"><header><h2>Student profile</h2><button className="icon-button" onClick={onClose}><X size={18} /></button></header><div className="modal-content"><ProfileBody student={student} data={data} /><Button variant="primary" icon={ClipboardCheck} onClick={onAssess}>Record assessment</Button></div><footer><Button onClick={onClose}>Close</Button></footer></section></div>;
}
function ProfileBody({ student, data }) {
  return <><div className="profile-heading"><span className="profile-avatar">{initials(student.name)}</span><div><h2>{student.name}</h2><span className="pill">{student.id}</span> <span className="pill">{student.grade}</span> <span className="pill">{student.group || 'Unassigned'}</span></div></div><div className="profile-score-grid"><div><small>Initial score</small><b>{format(scoreAvg(initialAssessment(student).scores))} / 5</b></div><div><small>Latest score</small><b>{format(scoreAvg(latestAssessment(student).scores))} / 5</b></div><div><small>Improvement</small><b className="good-text">+{format(improvement(student))} pts</b></div></div><div className="profile-skills">{SKILLS.map((skill, i) => <div className="skill-meter" key={skill}><span>{skill}</span><div className="meter-track"><i style={{ width: `${latestAssessment(student).scores[i] / 5 * 100}%` }} /></div><b>{latestAssessment(student).scores[i]}</b></div>)}</div><h3>Assessment history</h3><div className="history-list">{[...student.history].reverse().map((h, i) => <div key={`${h.date}-${i}`}><b>{h.stage} assessment · {format(scoreAvg(h.scores))}/5</b><small>{h.date} · {h.notes || 'No observation'}</small></div>)}</div><h3>Group activities</h3>{data.activities.filter(a => a.group === student.group || a.group === student.grade).map(a => <div className="recent-row" key={a.id}><span className="recent-icon"><Activity size={15} /></span><div><b>{a.title}</b><small>{a.strategy} · {a.date}</small></div><span className="pill">{a.status}</span></div>)}</>;
}
function ProfilePage({ student, onBack, onAssess, data }) {
  if (!student) return <Empty>Select a student to view their profile.</Empty>;
  return <><PageHeading title="Student profile" subtitle="Individual teamwork development record." action={<Button onClick={onBack}>← All students</Button>} /><Panel title={student.name} subtitle={`${student.id} · ${student.grade} · ${student.group || 'Unassigned'}`} actions={<Button variant="primary" icon={ClipboardCheck} onClick={onAssess}>Record assessment</Button>}><ProfileBody student={student} data={data} /></Panel></>;
}

export default App;
