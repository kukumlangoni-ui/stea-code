import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import {
  MousePointerClick,
  Eye,
  Heart,
  Inbox,
  TrendingUp,
  Globe,
  RefreshCw,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

export default function SitesAdminAnalytics() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [catalogSites, setCatalogSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7days'); // 'today' | '7days' | '30days' | 'all'

  const fetchData = async () => {
    try {
      const { getFirebaseDb, collection, getDocs, query, orderBy, limit } = await import('../../firebase.js');
      const db = getFirebaseDb();
      if (!db) return;

      // 1. Fetch analytics events
      const eventsSnap = await getDocs(
        query(collection(db, "siteAnalyticsEvents"), orderBy("timestamp", "desc"), limit(1200))
      );
      const evList = [];
      eventsSnap.forEach((doc) => evList.push({ id: doc.id, ...doc.data() }));
      setEvents(evList);

      // 2. Fetch submissions for community metrics
      const subsSnap = await getDocs(collection(db, "websiteSubmissions"));
      const subsList = [];
      subsSnap.forEach((doc) => subsList.push({ id: doc.id, ...doc.data() }));
      setSubmissions(subsList);

      // 3. Fetch websites catalog for total count & openCounts
      const sitesSnap = await getDocs(collection(db, "websites"));
      const sitesList = [];
      sitesSnap.forEach((doc) => sitesList.push({ id: doc.id, ...doc.data() }));
      setCatalogSites(sitesList);
    } catch (e) {
      console.error("Failed to fetch analytics data", e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchData().finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Time-filtered events
  const filteredEvents = useMemo(() => {
    if (timeRange === 'all') return events;
    const now = new Date();
    let days = 7;
    if (timeRange === 'today') days = 1;
    else if (timeRange === '30days') days = 30;

    const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return events.filter((e) => {
      if (!e.timestamp) return false;
      const d = e.timestamp.toDate ? e.timestamp.toDate() : new Date(e.timestamp);
      return d > cutoff;
    });
  }, [events, timeRange]);

  // Aggregate event counts
  const websiteOpens = filteredEvents.filter((e) => e.eventName === 'website_open').length;
  const websiteViews = filteredEvents.filter(
    (e) => e.eventName === 'website_view' || e.eventName === 'resource_view'
  ).length;
  const favoritesAdded = filteredEvents.filter((e) => e.eventName === 'favorite_add').length;

  // Submissions breakdown
  const submissionCounts = useMemo(() => {
    const pending = submissions.filter((s) => (s.status || 'pending') === 'pending').length;
    const approved = submissions.filter((s) => s.status === 'approved').length;
    const rejected = submissions.filter((s) => s.status === 'rejected').length;
    return { total: submissions.length, pending, approved, rejected };
  }, [submissions]);

  // Top Clicked Links aggregation
  // Group by destination URL / websiteName from website_open events, combined with catalog openCounts
  const topClickedWebsites = useMemo(() => {
    const countsMap = new Map();

    // 1. Seed with event counts from current filter window
    filteredEvents
      .filter((e) => e.eventName === 'website_open')
      .forEach((e) => {
        const key = (e.destination || e.url || e.websiteName || 'Unknown').trim();
        const existing = countsMap.get(key) || {
          name: e.websiteName || key.replace(/^https?:\/\//i, '').split('/')[0],
          url: e.destination || e.url || '',
          clicks: 0,
          category: e.category || 'General',
        };
        existing.clicks += 1;
        if (!existing.url && e.destination) existing.url = e.destination;
        countsMap.set(key, existing);
      });

    // 2. If events in window are few or 'all' time, also blend catalog sites with visits/openCount
    if (timeRange === 'all' || countsMap.size === 0) {
      catalogSites.forEach((site) => {
        const clicks = Number(site.openCount || site.visits || 0);
        if (clicks > 0) {
          const key = (site.url || site.name || '').trim();
          const existing = countsMap.get(key);
          if (existing) {
            existing.clicks = Math.max(existing.clicks, clicks);
          } else {
            countsMap.set(key, {
              name: site.name || site.title || key,
              url: site.url || '',
              clicks: clicks,
              category: site.category || site.categoryName || 'General',
            });
          }
        }
      });
    }

    const list = Array.from(countsMap.values());
    list.sort((a, b) => b.clicks - a.clicks);
    return list.slice(0, 10);
  }, [filteredEvents, catalogSites, timeRange]);

  const formatEventTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '—';
    }
  };

  return (
    <div className="sites-analytics-dashboard">
      {/* Header */}
      <div className="sites-analytics-header">
        <div>
          <div className="sites-analytics-title-row">
            <h1 className="sites-analytics-title">Visitor & Ecosystem Analytics</h1>
            <span className="sites-analytics-badge">Live Metrics</span>
          </div>
          <p className="sites-analytics-desc">
            Monitor real-time visitor engagements, most clicked websites, and community suggestion flow.
          </p>
        </div>

        <div className="sites-analytics-actions">
          <div className="sites-timerange-picker">
            <Calendar size={14} className="sites-timerange-icon" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="sites-analytics-select"
            >
              <option value="today">Today (24h)</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="sites-analytics-refresh-btn"
            title="Refresh metrics"
          >
            <RefreshCw size={14} className={refreshing ? 'is-spinning' : ''} />
            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="sites-analytics-loading">
          <div className="sites-analytics-spinner" />
          <span>Loading ecosystem analytics…</span>
        </div>
      ) : (
        <>
          {/* Main KPI Cards Grid */}
          <div className="sites-kpi-grid">
            <div className="sites-kpi-card">
              <div className="sites-kpi-top">
                <span className="sites-kpi-label">Outbound Website Opens</span>
                <div className="sites-kpi-icon is-gold">
                  <MousePointerClick size={18} />
                </div>
              </div>
              <div className="sites-kpi-val">{websiteOpens.toLocaleString()}</div>
              <div className="sites-kpi-meta">External resource clicks</div>
            </div>

            <div className="sites-kpi-card">
              <div className="sites-kpi-top">
                <span className="sites-kpi-label">Resource Detail Views</span>
                <div className="sites-kpi-icon is-blue">
                  <Eye size={18} />
                </div>
              </div>
              <div className="sites-kpi-val">{websiteViews.toLocaleString()}</div>
              <div className="sites-kpi-meta">Detail modal & page opens</div>
            </div>

            <div className="sites-kpi-card">
              <div className="sites-kpi-top">
                <span className="sites-kpi-label">Favorites Added</span>
                <div className="sites-kpi-icon is-red">
                  <Heart size={18} />
                </div>
              </div>
              <div className="sites-kpi-val">{favoritesAdded.toLocaleString()}</div>
              <div className="sites-kpi-meta">Member bookmarks saved</div>
            </div>

            <div className="sites-kpi-card">
              <div className="sites-kpi-top">
                <span className="sites-kpi-label">Catalog Directory Size</span>
                <div className="sites-kpi-icon is-emerald">
                  <Globe size={18} />
                </div>
              </div>
              <div className="sites-kpi-val">{catalogSites.length.toLocaleString()}</div>
              <div className="sites-kpi-meta">Live curated websites</div>
            </div>
          </div>

          {/* Community Suggestions Summary Banner */}
          <div className="sites-pipeline-card">
            <div className="sites-pipeline-info">
              <div className="sites-pipeline-header">
                <Inbox size={18} className="sites-pipeline-icon" />
                <h3 className="sites-pipeline-title">Community Suggestions Pipeline</h3>
              </div>
              <p className="sites-pipeline-sub">
                User-contributed websites and applications awaiting or processed by administrators.
              </p>
            </div>

            <div className="sites-pipeline-stats">
              <div className="sites-stat-pill is-pending">
                <Clock size={14} />
                <span className="sites-stat-num">{submissionCounts.pending}</span>
                <span className="sites-stat-tag">Pending</span>
              </div>
              <div className="sites-stat-pill is-approved">
                <CheckCircle2 size={14} />
                <span className="sites-stat-num">{submissionCounts.approved}</span>
                <span className="sites-stat-tag">Approved</span>
              </div>
              <div className="sites-stat-pill is-rejected">
                <XCircle size={14} />
                <span className="sites-stat-num">{submissionCounts.rejected}</span>
                <span className="sites-stat-tag">Rejected</span>
              </div>
              <div className="sites-stat-pill is-total">
                <span className="sites-stat-num">{submissionCounts.total}</span>
                <span className="sites-stat-tag">Total</span>
              </div>
            </div>
          </div>

          {/* Top Clicked Websites Table */}
          <div className="sites-analytics-section">
            <div className="sites-section-header">
              <div className="sites-section-title-wrap">
                <TrendingUp size={18} className="sites-section-icon" />
                <h2 className="sites-section-title">Most Clicked & Visited Websites</h2>
              </div>
              <span className="sites-section-caption">
                Ranked by outbound click volume {timeRange === 'all' ? '(All time)' : `(${timeRange})`}
              </span>
            </div>

            {topClickedWebsites.length === 0 ? (
              <div className="sites-empty-section">
                <Globe size={32} className="sites-empty-icon" />
                <p>No website click events recorded yet in this time window.</p>
              </div>
            ) : (
              <div className="sites-table-card">
                <table className="sites-analytics-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Rank</th>
                      <th>Website Name</th>
                      <th>Category</th>
                      <th>Destination Link</th>
                      <th style={{ textAlign: 'right' }}>Total Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClickedWebsites.map((site, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className={`sites-rank-badge ${idx < 3 ? `is-top-${idx + 1}` : ''}`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td>
                          <div className="sites-table-site-name">{site.name || 'Unnamed Site'}</div>
                        </td>
                        <td>
                          <span className="sites-cat-tag">{site.category || 'General'}</span>
                        </td>
                        <td>
                          {site.url ? (
                            <a
                              href={site.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sites-table-link"
                            >
                              <span>{site.url.replace(/^https?:\/\//i, '').slice(0, 38)}</span>
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sites-clicks-count">
                            {site.clicks.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Events Feed */}
          {filteredEvents.length > 0 && (
            <div className="sites-analytics-section" style={{ marginTop: 28 }}>
              <div className="sites-section-header">
                <div className="sites-section-title-wrap">
                  <Clock size={17} className="sites-section-icon" />
                  <h2 className="sites-section-title">Recent Event Stream</h2>
                </div>
                <span className="sites-section-caption">Last {Math.min(filteredEvents.length, 15)} recorded actions</span>
              </div>

              <div className="sites-events-list">
                {filteredEvents.slice(0, 15).map((ev) => (
                  <div key={ev.id} className="sites-event-row">
                    <div className="sites-event-pill">
                      {ev.eventName === 'website_open' ? 'Outbound Open' : ev.eventName === 'favorite_add' ? 'Bookmark' : ev.eventName}
                    </div>
                    <div className="sites-event-desc">
                      <strong>{ev.websiteName || ev.destination || ev.path || 'STEA Directory'}</strong>
                      {ev.destination && <span className="sites-event-dest"> → {ev.destination}</span>}
                    </div>
                    <div className="sites-event-time">{formatEventTime(ev.timestamp)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .sites-analytics-dashboard {
          color: #F0F2F5;
          max-width: 1100px;
          padding-bottom: 40px;
        }
        .sites-analytics-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }
        .sites-analytics-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }
        .sites-analytics-title {
          font-size: 24px;
          font-weight: 850;
          letter-spacing: -0.02em;
          margin: 0;
          color: #FFF;
        }
        .sites-analytics-badge {
          background: rgba(245, 166, 35, 0.12);
          border: 1px solid rgba(245, 166, 35, 0.3);
          color: #F5A623;
          font-size: 11px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 3px 8px;
          border-radius: 999px;
        }
        .sites-analytics-desc {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          max-width: 650px;
        }
        .sites-analytics-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sites-timerange-picker {
          position: relative;
          display: flex;
          align-items: center;
        }
        .sites-timerange-icon {
          position: absolute;
          left: 10px;
          color: rgba(255, 255, 255, 0.5);
          pointer-events: none;
        }
        .sites-analytics-select {
          appearance: none;
          background: #101625;
          color: #FFF;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9px;
          padding: 7px 28px 7px 30px;
          font: inherit;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }
        .sites-analytics-select:focus {
          border-color: #F5A623;
        }
        .sites-analytics-refresh-btn {
          appearance: none;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #E2E8F0;
          padding: 7px 13px;
          border-radius: 9px;
          font: inherit;
          font-size: 12.5px;
          font-weight: 650;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 140ms ease;
        }
        .sites-analytics-refresh-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.09);
          color: #FFF;
        }
        .is-spinning {
          animation: adminSpin 800ms linear infinite;
        }

        /* KPI Cards */
        .sites-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        .sites-kpi-card {
          background: #0d121f;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 18px 20px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
          transition: transform 140ms ease, border-color 140ms ease;
        }
        .sites-kpi-card:hover {
          border-color: rgba(245, 166, 35, 0.3);
          transform: translateY(-2px);
        }
        .sites-kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .sites-kpi-label {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .sites-kpi-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sites-kpi-icon.is-gold {
          background: rgba(245, 166, 35, 0.15);
          color: #F5A623;
        }
        .sites-kpi-icon.is-blue {
          background: rgba(14, 165, 233, 0.15);
          color: #38BDF8;
        }
        .sites-kpi-icon.is-red {
          background: rgba(239, 68, 68, 0.15);
          color: #F87171;
        }
        .sites-kpi-icon.is-emerald {
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
        }
        .sites-kpi-val {
          font-size: 32px;
          font-weight: 850;
          color: #FFF;
          line-height: 1.1;
          margin-bottom: 6px;
          letter-spacing: -0.03em;
        }
        .sites-kpi-meta {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.45);
        }

        /* Pipeline Card */
        .sites-pipeline-card {
          background: linear-gradient(180deg, rgba(245, 166, 35, 0.06), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(245, 166, 35, 0.2);
          border-radius: 14px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .sites-pipeline-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .sites-pipeline-icon {
          color: #F5A623;
        }
        .sites-pipeline-title {
          font-size: 15px;
          font-weight: 800;
          color: #FFF;
          margin: 0;
        }
        .sites-pipeline-sub {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }
        .sites-pipeline-stats {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sites-stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .sites-stat-pill.is-pending {
          color: #F5A623;
          background: rgba(245, 166, 35, 0.12);
          border-color: rgba(245, 166, 35, 0.3);
        }
        .sites-stat-pill.is-approved {
          color: #4ADE80;
          background: rgba(74, 222, 128, 0.12);
          border-color: rgba(74, 222, 128, 0.3);
        }
        .sites-stat-pill.is-rejected {
          color: #FF6B6B;
          background: rgba(255, 107, 107, 0.12);
          border-color: rgba(255, 107, 107, 0.3);
        }
        .sites-stat-pill.is-total {
          color: #E2E8F0;
        }
        .sites-stat-num {
          font-size: 14px;
          font-weight: 850;
        }
        .sites-stat-tag {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Analytics Section */
        .sites-analytics-section {
          background: #0d121f;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }
        .sites-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        .sites-section-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sites-section-icon {
          color: #F5A623;
        }
        .sites-section-title {
          font-size: 16px;
          font-weight: 800;
          color: #FFF;
          margin: 0;
        }
        .sites-section-caption {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Table */
        .sites-table-card {
          overflow-x: auto;
        }
        .sites-analytics-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .sites-analytics-table th {
          padding: 10px 12px;
          text-align: left;
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .sites-analytics-table td {
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          vertical-align: middle;
        }
        .sites-analytics-table tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }
        .sites-rank-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.6);
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.06);
        }
        .sites-rank-badge.is-top-1 {
          color: #F5A623;
          background: rgba(245, 166, 35, 0.2);
        }
        .sites-rank-badge.is-top-2 {
          color: #E2E8F0;
          background: rgba(255, 255, 255, 0.15);
        }
        .sites-rank-badge.is-top-3 {
          color: #CD7F32;
          background: rgba(205, 127, 50, 0.2);
        }
        .sites-table-site-name {
          font-weight: 750;
          color: #FFF;
        }
        .sites-cat-tag {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 7px;
          border-radius: 4px;
        }
        .sites-table-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #F5A623;
          text-decoration: none;
          font-size: 12px;
        }
        .sites-table-link:hover {
          text-decoration: underline;
        }
        .sites-clicks-count {
          font-size: 14px;
          font-weight: 850;
          color: #FFF;
        }

        /* Event stream */
        .sites-events-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sites-event-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 12px;
        }
        .sites-event-pill {
          padding: 2px 7px;
          border-radius: 4px;
          background: rgba(245, 166, 35, 0.15);
          color: #F5A623;
          font-size: 10.5px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }
        .sites-event-desc {
          flex: 1;
          color: rgba(255, 255, 255, 0.85);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sites-event-dest {
          color: rgba(255, 255, 255, 0.4);
          font-size: 11.5px;
        }
        .sites-event-time {
          color: rgba(255, 255, 255, 0.4);
          font-size: 11px;
          flex-shrink: 0;
        }

        /* Loading / Empty */
        .sites-analytics-loading,
        .sites-empty-section {
          padding: 48px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .sites-analytics-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(245, 166, 35, 0.2);
          border-top-color: #F5A623;
          border-radius: 50%;
          animation: adminSpin 800ms linear infinite;
        }
        @keyframes adminSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
