import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api"; // Ensure this path is correct

export default function HomePage() {
  // State for Stats - Only 2 items now
  const [stats, setStats] = useState([
    { id: 1, label: "Total Records", value: "0" },
    { id: 2, label: "Pending", value: "0" },
  ]);
  
  const [loading, setLoading] = useState(true);

  // Fetch and Calculate Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/api/payments");
        const data = res.data;

        // 1. Total Payments (Count of all records)
        const totalCount = data.length;

        // 2. Pending (Count where status is PENDING)
        const pendingCount = data.filter(p => p.payment_status === 'PENDING').length;

        // Update State (Removed This Month & Overdue)
        setStats([
          { id: 1, label: "Total Records", value: totalCount.toString() },
          { id: 2, label: "Pending", value: pendingCount.toString() },
        ]);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const cards = [
    { id: "payments", title: "Payments", desc: "View & manage payments", icon: "dollar", to: "/payments" },
    { id: "settings", title: "Settings", desc: "Preferences", icon: "cog", to: "/change-password" },
  ];

  return (
    <div className="dashboard-container">
      {/* INTERNAL CSS */}
      <style>{`
        :root {
          --bg-body: #f8fafc;
          --bg-card: #ffffff;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --primary: #059669;
          --primary-hover: #047857;
          --border: #e2e8f0;
        }

        .dashboard-container {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: var(--bg-body);
          min-height: 100vh;
          color: var(--text-main);
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }

        .dashboard-container::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 85% 10%, rgba(16, 185, 129, 0.08) 0%, transparent 500px);
          pointer-events: none;
          z-index: 0;
        }

        .wrapper {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          gap: 20px;
        }

        .header h1 {
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }

        .header p {
          color: var(--text-muted);
          margin: 0;
          font-size: 16px;
        }

        .btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px; border-radius: 8px;
          font-weight: 600; font-size: 14px; text-decoration: none;
          transition: all 0.2s ease; border: 1px solid transparent;
        }

        .btn-primary {
          background-color: var(--primary);
          color: white;
          box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
        }
        .btn-primary:hover { background-color: var(--primary-hover); transform: translateY(-1px); }

        .main-grid {
          display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px;
        }
        @media (max-width: 1024px) { .main-grid { grid-template-columns: 1fr; } }

        .card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        /* Hero Card */
        .hero-content { display: flex; gap: 20px; }
        .hero-icon {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
        }
        /* UPDATED GRID to support only 2 items nicely */
        .stats-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 24px;
        }
        @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }

        .stat-box {
          background: #f8fafc; border: 1px solid var(--border);
          padding: 16px; border-radius: 8px;
        }
        .stat-val { font-size: 20px; font-weight: 700; color: var(--text-main); }
        .stat-lbl { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

        /* Quick Actions */
        .action-list { display: flex; flex-direction: column; gap: 8px; }
        .action-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px; border-radius: 8px; text-decoration: none; transition: background 0.2s;
        }
        .action-item:hover { background-color: #f8fafc; }
        .action-item.disabled { opacity: 0.6; cursor: not-allowed; }
        
        .action-left { display: flex; align-items: center; gap: 12px; }
        .action-icon {
          width: 40px; height: 40px; background: #ecfdf5; color: var(--primary);
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
        }
        .action-text h4 { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-main); }
        .action-text p { margin: 0; font-size: 12px; color: var(--text-muted); }
        .badge {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          padding: 2px 6px; border-radius: 4px; background: #fef3c7; color: #92400e; margin-right: 8px;
        }

        /* Table */
        .table-header {
          display: flex; justify-content: space-between; align-items: center;
          padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--border);
        }
        .view-link { color: var(--primary); font-weight: 600; font-size: 14px; text-decoration: none; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { text-align: left; color: var(--text-muted); font-size: 12px; text-transform: uppercase; padding: 12px 8px; }
        td { padding: 14px 8px; border-bottom: 1px solid #f1f5f9; color: var(--text-main); }
        .status { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
        .status.paid { background: #ecfdf5; color: #065f46; }
        .status.pending { background: #fffbeb; color: #92400e; }

        /* Metrics */
        .metrics-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 20px; }
        .metric { text-align: center; background: #f8fafc; padding: 12px; border-radius: 8px; }
      `}</style>

      <div className="wrapper">
        {/* Header */}
        <header className="header">
          <div>
            <h1>Murti Dashboard</h1>
            <p>Payments made simple — clear, fast and secure tracking.</p>
          </div>
          <div className="header-actions">
            <Link to="/payments/new" className="btn btn-primary">
              <Icons.Plus /> New Payment
            </Link>
          </div>
        </header>

        {/* Top Section */}
        <div className="main-grid">
          {/* Overview Card */}
          <div className="card">
            <div className="hero-content">
              <div className="hero-icon">
                <Icons.Chart size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Performance Overview</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
                  {loading ? 'Calculating data...' : 'Quick snapshot of your financial health.'}
                </p>
                
                <div className="stats-grid">
                  {stats.map((s) => (
                    <div key={s.id} className="stat-box">
                      <div className="stat-val">{s.value}</div>
                      <div className="stat-lbl">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 16px 8px' }}>Quick Actions</h3>
            <div className="action-list">
              {cards.map((c) => (
                <Link key={c.id} to={c.to} className={`action-item ${c.soon ? 'disabled' : ''}`}>
                  <div className="action-left">
                    <div className="action-icon">{getIcon(c.icon)}</div>
                    <div className="action-text">
                      <h4>{c.title}</h4>
                      <p>{c.desc}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {c.badge && <span className="badge">{c.badge}</span>}
                    {c.soon ? (
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>SOON</span>
                    ) : (
                      <Icons.ChevronRight />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Icons ---
const Icons = {
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  Chart: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3 3 0 0 0 0 6H14a3 3 0 0 1 0 6H7"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
};

function getIcon(name) {
  const props = { width: "20", height: "20", strokeWidth: 1.8 };
  switch (name) {
    case 'dollar': return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3 3 0 0 0 0 6H14a3 3 0 0 1 0 6H7"/></svg>;
    case 'file': return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
    case 'chart': return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case 'cog': return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    default: return null;
  }
}