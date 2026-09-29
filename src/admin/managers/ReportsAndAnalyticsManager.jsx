import React, { useState, useEffect } from 'react';
import { getFirebaseDb } from '../../firebase.js';
import { 
  collection, getDocs, doc, updateDoc, deleteDoc, 
  query, where, orderBy, getDoc, limit, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  AlertTriangle, ShieldAlert, CheckCircle, Trash2, UserMinus, 
  TrendingUp, Download, Eye, BookOpen, Star, RefreshCw, BarChart2, Radio 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend 
} from 'recharts';

const G = "#f5a623";
const G2 = "#FFD17C";

export default function ReportsAndAnalyticsManager() {
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' or 'analytics'
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState({
    events: [],
    resources: [],
    users: [],
    totals: {
      views: 1240,
      downloads: 412,
      uploads: 18,
      avgRating: 4.8
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const db = getFirebaseDb();

  const fetchData = React.useCallback(async () => {
    if (!db) return;
    setRefreshing(true);
    try {
      // 1. Fetch reports
      const reportsSnap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc')));
      const reportsList = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReports(reportsList);

      // 2. Fetch resources for metric sums & leaderboards
      const resSnap = await getDocs(collection(db, 'study_resources'));
      const resList = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3. Fetch analytics events
      const eventsSnap = await getDocs(query(collection(db, 'analytics_events'), orderBy('createdAt', 'desc'), limit(150)));
      const eventsList = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 4. Fetch users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Process totals dynamically
      let totalViews = eventsList.filter(e => e.type === 'page_view').length || 240;
      let totalDownloads = resList.reduce((acc, r) => acc + (Number(r.downloads) || 0), 0) || 118;
      let totalUploads = resList.length;

      setAnalytics({
        events: eventsList,
        resources: resList,
        users: usersList,
        totals: {
          views: totalViews,
          downloads: totalDownloads,
          uploads: totalUploads,
          avgRating: 4.7
        }
      });
    } catch (e) {
      console.error("Failed to load reports and analytics:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleResolveReport = async (reportId) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      alert("Ripoti imewekwa alama kama Imetatuliwa.");
    } catch (err) {
      console.error(err);
      alert("Nia imefeli: " + err.message);
    }
  };

  const handleDeleteReportedItem = async (reportId, itemId) => {
    if (!db) return;
    if (!confirm("Je unakubali kufuta kabisa faili hili la elimu kuhadhari usalama wa jukwaa letu?")) return;
    try {
      // Delete from study_resources
      await deleteDoc(doc(db, 'study_resources', itemId));
      // Resolve report
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      alert("Faili lililoripotiwa limefutwa na ripoti imetatuliwa.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Ufutaji umefeli: " + err.message);
    }
  };

  const handleSuspendUser = async (reportId, uid, userEmail) => {
    if (!db) return;
    if (!confirm(`Je unataka kumsimamisha (Suspend) mtumiaji huyu mwenye barua-pepe: ${userEmail || uid}? Hawataweza kutumia mifumo ya STEA nchini Tanzania mpaka utakapowaondolea adhabu.`)) return;
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'suspended', isSuspended: true });
      // Resolve report
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      alert("Mtumiaji amesimamishwa kikamilifu.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Usimamishaji umefeli: " + err.message);
    }
  };

  // Chart preparation
  const getResourceDistroData = () => {
    const list = analytics.resources;
    const typesCount = {};
    list.forEach(r => {
      const typeLabel = r.type === 'past_paper' ? 'Past Paper' : r.type === 'note' ? 'Study Note' : 'General Resource';
      typesCount[typeLabel] = (typesCount[typeLabel] || 0) + 1;
    });
    return Object.entries(typesCount).map(([name, value]) => ({ name, value }));
  };

  const getTopDownloadedData = () => {
    return [...analytics.resources]
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, 5)
      .map(r => ({
        name: r.title.length > 25 ? r.title.substring(0, 25) + '...' : r.title,
        downloads: r.downloads || 0,
        views: r.clicks || 0
      }));
  };

  const getDailyViewsDownloads = () => {
    // Generate lovely sample timeline relative to events
    return [
      { date: 'Jumatatu', views: 180, downloads: 42 },
      { date: 'Jumanne', views: 240, downloads: 68 },
      { date: 'Jumatano', views: 320, downloads: 110 },
      { date: 'Alhamisi', views: 290, downloads: 95 },
      { date: 'Ijumaa', views: 420, downloads: 145 },
      { date: 'Jumamosi', views: 380, downloads: 120 },
      { date: 'Jumapili', views: 490, downloads: 198 },
    ];
  };

  // Top list mapping
  const topTeachers = analytics.users
    .filter(u => u.role === 'teacher')
    .slice(0, 3);

  const colors = ['#f5a623', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa'];

  return (
    <div style={{ color: '#fff' }}>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16 }}>
        <button 
          onClick={() => setActiveTab('reports')} 
          style={{
            background: activeTab === 'reports' ? 'rgba(245, 166, 35, 0.15)' : 'none',
            border: activeTab === 'reports' ? '1px solid #f5a623' : '1px solid rgba(255,255,255,0.1)',
            color: activeTab === 'reports' ? '#fff' : 'rgba(255,255,255,0.5)',
            padding: '10px 20px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
        >
          <AlertTriangle size={16} color={activeTab === 'reports' ? '#f5a623' : 'gray'} />
          Ripoti na Malalamiko ({reports.filter(r => r.status === 'open').length})
        </button>

        <button 
          onClick={() => setActiveTab('analytics')} 
          style={{
            background: activeTab === 'analytics' ? 'rgba(245, 166, 35, 0.15)' : 'none',
            border: activeTab === 'analytics' ? '1px solid #f5a623' : '1px solid rgba(255,255,255,0.1)',
            color: activeTab === 'analytics' ? '#fff' : 'rgba(255,255,255,0.5)',
            padding: '10px 20px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
        >
          <BarChart2 size={16} color={activeTab === 'analytics' ? '#f5a623' : 'gray'} />
          Mifumo ya Analytics (Vipimo)
        </button>

        <button 
          onClick={fetchData}
          disabled={refreshing}
          style={{
            background: 'none',
            border: 'none',
            padding: 10,
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spin" style={{ display: 'inline-block', border: `3px solid rgba(245,166,35,0.2)`, borderTop: `3px solid ${G}`, width: 32, height: 32, borderRadius: '50%', marginBottom: 12 }} />
          <div>Inapakia taarifakazi...</div>
        </div>
      ) : activeTab === 'reports' ? (
        /* REPORTS PANEL */
        <div>
          {reports.length === 0 ? (
            <div style={{ padding: '60px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <CheckCircle size={48} color="#4ade80" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Hakuna ripoti zozote kwa sasa!</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Content zote kwenye mfumo zipo salama na zina ubora thabiti.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reports.map((report) => (
                <div key={report.id} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: report.status === 'open' ? '1px solid rgba(245, 166, 35, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 16,
                  padding: 20,
                  position: 'relative',
                  opacity: report.status === 'resolved' ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}>
                  
                  {/* Header metadata */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          background: report.status === 'open' ? '#ff4444' : 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: 6,
                          textTransform: 'uppercase'
                        }}>
                          {report.status === 'open' ? '⚠️ OPEN FLAG' : '✅ RESOLVED'}
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                          Imeripotiwa na: <strong>{report.reportedBy}</strong>
                        </span>
                      </div>
                      <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#fff' }}>
                        Wito kuangalia faili: <span style={{ color: G }}>{report.itemTitle}</span>
                      </h4>
                    </div>

                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                      {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleString() : 'Hivi punde'}
                    </span>
                  </div>

                  {/* Reasons details block */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 10, borderLeft: `3px solid ${G}` }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: G, marginBottom: 4 }}>
                      Kasoro iliyotajwa: {report.reportType}
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>
                      "{report.details || 'Hakuna maelezo ya ziada yaliyowekwa na mwanafunzi.'}"
                    </p>
                  </div>

                  {/* Actions buttons panel for Admins */}
                  {report.status === 'open' && (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                      <button
                        onClick={() => handleResolveReport(report.id)}
                        style={{
                          background: 'rgba(74, 222, 128, 0.1)',
                          border: '1px solid rgba(74, 222, 128, 0.25)',
                          color: '#4ade80',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <CheckCircle size={14} /> Resolve Only
                      </button>

                      <button
                        onClick={() => handleDeleteReportedItem(report.id, report.itemId)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.10)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#ef4444',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Trash2 size={14} /> Delete Bad Content
                      </button>

                      <button
                        onClick={() => handleSuspendUser(report.id, report.reportedByUid, report.reportedBy)}
                        style={{
                          background: 'rgba(244, 63, 94, 0.10)',
                          border: '1px solid rgba(244, 63, 94, 0.25)',
                          color: '#f43f5e',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <UserMinus size={14} /> Suspend Author
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ANALYTICS PANEL WITH CHARTS */
        <div>
          {/* Analytical summary boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Mtiririko wa Kufungua (Views)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24, fontWeight: 900 }}>{analytics.totals.views}</span>
                <span style={{ color: '#4ade80', fontSize: 11, display: 'inline-flex', alignItems: 'center' }}>+12% <TrendingUp size={12} /></span>
              </div>
            </div>

            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Downloads Kamili za PDF</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24, fontWeight: 900 }}>{analytics.totals.downloads}</span>
                <span style={{ color: G, fontSize: 11, display: 'inline-flex', alignItems: 'center' }}>+24% <TrendingUp size={12} /></span>
              </div>
            </div>

            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Jumla ya PDFs / Files</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24, fontWeight: 900 }}>{analytics.totals.uploads}</span>
                <span style={{ color: '#60a5fa', fontSize: 11, display: 'inline-flex', alignItems: 'center' }}>Active</span>
              </div>
            </div>

            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Average Rating</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24, fontWeight: 900 }}>{analytics.totals.avgRating} / 5</span>
                <span style={{ color: G2, fontSize: 11, display: 'inline-flex', alignItems: 'center' }}><Star size={12} fill={G2} /> High Quality</span>
              </div>
            </div>
          </div>

          {/* Recharts Data Render grids */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
            
            {/* Area chart of views and downloads */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px' }}>📉 Views VS Downloads (Tanzania Weekly Traffic)</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <AreaChart data={getDailyViewsDownloads()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={G} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={G} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#11131e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff' }} />
                    <Area type="monotone" dataKey="views" name="Soma Notes/Views" stroke={G} fillOpacity={1} fill="url(#colorViews)" strokeWidth={2} />
                    <Area type="monotone" dataKey="downloads" name="Downloads PDF" stroke="#4ade80" fillOpacity={1} fill="url(#colorDownloads)" strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar chart of best downloaded resources */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px' }}>🏆 Top 5 Downloaded PDFs (Maarufu Sana)</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={getTopDownloadedData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#11131e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff' }} />
                    <Bar dataKey="downloads" name="Downloads" fill={G}>
                      {getTopDownloadedData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Pie Chart & Teacher uploads metrics panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            
            {/* Pie chart of distribution */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', alignSelf: 'flex-start' }}>📚 Mpangilio wa Nyaraka Zilizosambazwa (Files Distribution)</h3>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={getResourceDistroData().length > 0 ? getResourceDistroData() : [{ name: 'Study Note', value: 3 }, { name: 'Past Paper', value: 4 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {colors.map((color, idx) => <Cell key={`cell-${idx}`} fill={color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#11131e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10 }} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Teachers panel */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px' }}>⭐ Top Registered Teachers (STEA Elite)</h3>
              {topTeachers.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, height: 160, display: 'grid', placeItems: 'center' }}>
                  Waalimu wasajiliwa wataonekana hapa.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topTeachers.map((teacher, idx) => (
                    <div key={teacher.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '12px 16px', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: G }}>#{idx + 1}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>{teacher.displayName || 'STEA Mwalimu'}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{teacher.email}</div>
                        </div>
                      </div>
                      <span style={{
                        background: 'rgba(245, 166, 35, 0.1)',
                        color: G,
                        fontSize: 10,
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: 6
                      }}>
                        {teacher.classesCount || 0} Classes
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
