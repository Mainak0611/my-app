// frontend/src/modules/payments/PaymentTracker.jsx

import { useEffect, useState, useMemo } from "react";
import api from "../../lib/api";
import '../../styles/App.css'; // Assuming you move App.css to src/styles/
import { 
    formatDateForDisplay, 
    getStatusDisplay 
    // formatDateForInput is not needed here 
} from "./PaymentUtils.js";


function PaymentTracker() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState({ type: null, text: '' });
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(''); // Stores date string for filtering
  const [sortOrder, setSortOrder] = useState('none'); // 'none', 'asc', or 'desc'
  
  // State for the modal
  const [managePaymentId, setManagePaymentId] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [newRemark, setNewRemark] = useState('');
  const [newDate, setNewDate] = useState('');

  // Headers and Keys
  const ALL_HEADERS = [
    "ID", "Party", "Contact No", 
    "Status", 
    "Latest Date", 
    "Latest Remark", 
    "Action"
  ];
  
  const DATA_KEYS = [
    "id", "Party", "Contact No", 
    "payment_status", 
    "Latest Payment Date", 
    "Latest Remark",       
    "Action"
  ];

  // --- LOGOUT FUNCTION ---
  const handleLogout = () => {
      // 1. Clear authentication data
      localStorage.removeItem('userToken');
      localStorage.removeItem('userId');
      
      // 2. Redirect to the login page (forces re-evaluation of App.jsx)
      window.location.href = '/login'; 
  };


  // Function to fetch payments
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/payments");
      setPayments(res.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // --- FILTERING LOGIC (useMemo for performance) ---
  const filteredPayments = useMemo(() => {
    let list = payments;
    
    // 1. Search Filter (by Party or Contact No)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p => 
        (p.Party && String(p.Party).toLowerCase().includes(term)) ||
        (p['Contact No'] && String(p['Contact No']).toLowerCase().includes(term))
      );
    }

    // 2. Date Filter (by Latest Payment Date)
    if (filterDate) {
      // Normalize filter date for comparison
      const filterDay = new Date(filterDate);
      filterDay.setHours(0, 0, 0, 0);

      list = list.filter(p => {
        if (!p['Latest Payment Date']) return false;
        
        // Normalize payment date for comparison
        const paymentDay = new Date(p['Latest Payment Date']);
        paymentDay.setHours(0, 0, 0, 0);
        
        // Compare timestamps
        return paymentDay.getTime() === filterDay.getTime();
      });
    }

    // 3. Sort by Latest Payment Date (if sortOrder is not 'none')
    if (sortOrder !== 'none') {
      list = [...list].sort((a, b) => {
        const dateA = a['Latest Payment Date'];
        const dateB = b['Latest Payment Date'];
        
        // Records without dates always go to the bottom
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1; // a goes to bottom
        if (!dateB) return -1; // b goes to bottom
        
        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();
        
        if (sortOrder === 'asc') {
          return timeA - timeB; // Oldest first
        } else if (sortOrder === 'desc') {
          return timeB - timeA; // Newest first
        }
        return 0;
      });
    }

    return list;
  }, [payments, searchTerm, filterDate, sortOrder]); // Re-calculate only when these change


  // --- TRACKING MANAGEMENT FUNCTIONS ---

  const fetchTrackingHistory = async (paymentId) => {
    try {
      const res = await api.get(`/api/payments/tracking/${paymentId}`);
      setTrackingHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch tracking history:", err);
    }
  };

  const openManageModal = (paymentId) => {
    setManagePaymentId(paymentId);
    fetchTrackingHistory(paymentId);
    setNewRemark('');
    setNewDate('');
  };

  const closeManageModal = () => {
    setManagePaymentId(null);
    setTrackingHistory([]);
  };
  
  // handleAddTrackingEntry now ONLY adds date/remark
  const handleAddTrackingEntry = async (e) => {
    e.preventDefault();
    if (!newDate && !newRemark) {
      alert("Please enter at least a date or a remark.");
      return;
    }

    try {
      await api.post(`/api/payments/tracking/${managePaymentId}`, { 
        date: newDate, 
        remark: newRemark
      });
      // Refresh history and inputs
      await fetchTrackingHistory(managePaymentId); 
      setNewRemark('');
      setNewDate('');
      fetchPayments(); // Refresh main table (for latest date/remark)
    } catch (err) {
      console.error("Failed to add tracking entry:", err);
      alert("Failed to save entry.");
    }
  };
  
  // Function to update the main payment status from the history list 
  const handleUpdatePaymentStatus = async (newStatus) => {
    if (!newStatus || !managePaymentId) return;

    try {
        // Use the new dedicated PATCH route
        await api.patch(`/api/payments/${managePaymentId}/status`, { 
            newStatus: newStatus
        });
        
        // Refresh the main payments list to show the new status immediately
        fetchPayments(); 
    } catch (err) {
        console.error("Failed to update status:", err);
        alert("Failed to update payment status.");
    }
  };


  // --- HELPER FUNCTIONS ---

  // Function to determine if a row should be highlighted 
  const shouldHighlightRow = (latestPaymentDate) => {
    if (!latestPaymentDate) return false;
    
    const targetDate = new Date(latestPaymentDate);
    targetDate.setHours(0, 0, 0, 0); 
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    return targetDate.getTime() === today.getTime();
  };
  
  // File Upload and Delete functions
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadMessage({ type: 'error', text: 'Please select a file first.' });
      return;
    }

    setUploadMessage({ type: 'info', text: 'Uploading and processing data...' });
    const formData = new FormData();
    formData.append('csvFile', file); 

    try {
      // Explicitly retrieve and send the Authorization token
      const token = localStorage.getItem('userToken');

      if (!token) {
        setUploadMessage({ type: 'error', text: 'Authentication token missing. Please log in.' });
        return; 
      }

      const res = await api.post("/api/payments/upload", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` // Send the token
        }
      });

      setUploadMessage({ type: 'success', text: res.data.message || 'Upload successful!' });
      setFile(null); 
      document.getElementById('file-input').value = null; 
      fetchPayments(); 
    } catch (err) {
      // Improved error message for unauthorized issues
      const msg = err.response?.status === 401 
        ? 'Upload failed: Your session expired or you are not logged in.'
        : err.response?.data?.error || 'Upload failed due to a server error.';

      console.error("Upload error:", err.response || err);
      setUploadMessage({ type: 'error', text: msg });
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL your payment records? This cannot be undone.')) {
      return;
    }

    setUploadMessage({ type: 'info', text: 'Deleting all records...' });
    try {
      const res = await api.delete("/api/payments"); 
      setUploadMessage({ type: 'success', text: res.data.message || 'All records deleted!' });
      fetchPayments(); 
    } catch (err) {
      const msg = err.response?.data?.error || 'Delete failed.';
      console.error("Delete error:", err);
      setUploadMessage({ type: 'error', text: msg });
    }
  };


  return (
    // Used a wrapper div to contain the title and logout button
    <div style={{ position: 'relative', maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      
      {/* 🛑 LOGOUT BUTTON 🛑 */}
      <button 
        onClick={handleLogout} 
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px 15px',
          backgroundColor: '#dc3545', // Red color for danger/logout
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          zIndex: 100 // Ensure it's on top
        }}
        aria-label="Logout"
      >
        Logout
      </button>

      <div className="payment-container">
        <h1 className="payment-title">Payment Records</h1>
        
        {/* Upload & Delete Form */}
        <form onSubmit={handleUpload} className="upload-form">
          <input 
            id="file-input"
            type="file" 
            accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
            onChange={(e) => setFile(e.target.files[0])} 
            className="upload-input"
          />
          <button type="submit" disabled={!file || uploadMessage.type === 'info'} 
            className="upload-button"
          >
            {uploadMessage.type === 'info' ? 'Uploading...' : 'Upload File (.csv or .xlsx)'}
          </button>
          <button 
            type="button" 
            onClick={handleDeleteAll} 
            className="upload-button delete-button"
            disabled={uploadMessage.type === 'info'}
          >
            Delete All Records
          </button>
        </form>
        
        {/* MODIFIED: SEARCH AND FILTER CONTROLS using inline styles */}
        <div 
          className="filter-controls" 
          style={{
            display: 'flex', 
            gap: '25px', 
            alignItems: 'center', 
            marginBottom: '25px', 
            padding: '20px', 
            maxWidth: '1200px', 
            width: '100%',
            border: '1px solid #d0d0d0', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            backgroundColor: '#f9f9f9'
          }}
        >
          <input
            type="text"
            placeholder="Search by Party or Contact No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flexGrow: 1, 
              padding: '12px', 
              fontSize: '1.1rem', 
              border: '1px solid #a0a0a0',
              borderRadius: '4px',
            }}
          />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{
              padding: '12px', 
              fontSize: '1.1rem', 
              border: '1px solid #a0a0a0',
              borderRadius: '4px',
              maxWidth: '180px',
            }}
          />
          <button 
              onClick={() => setFilterDate('')} 
              className="upload-button"
              disabled={!filterDate}
              style={{
                  backgroundColor: '#007bff', 
                  padding: '12px 20px', 
                  fontSize: '1rem', 
                  transition: 'background-color 0.3s',
                  ...(filterDate ? {} : {backgroundColor: '#cccccc', cursor: 'not-allowed'})
              }}
          >
              Clear Date Filter
          </button>
          
          {/* Sort by Date Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap' }}>Sort by Date:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                padding: '12px',
                fontSize: '1.1rem',
                border: '1px solid #a0a0a0',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="none">Default (No Sort)</option>
              <option value="asc">Oldest First</option>
              <option value="desc">Newest First</option>
            </select>
          </div>
        </div>


        {/* Upload Message */}
        {uploadMessage.text && (
          <div className={`message ${uploadMessage.type}`}>
            {uploadMessage.text}
          </div>
        )}

        {/* Payment Table */}
        {loading ? (
          <p className="payment-loading">Loading payment records...</p>
        ) : payments.length === 0 ? (
          <p className="payment-loading">No payment records found. Upload a file to begin.</p>
        ) : (
          <div className="table-wrapper">
            <table className="payment-table">
              <thead>
                <tr>
                  {ALL_HEADERS.map((header, index) => (
                    <th key={index} className="table-th">{header}</th> 
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* RENDER filteredPayments INSTEAD OF payments */}
                {filteredPayments.map((p, index) => { 
                  const isEven = index % 2 === 1;
                  let rowClassName = isEven ? 'table-tr even' : 'table-tr';
                  
                  // Highlight logic uses the LATEST DATE fetched from the DB join
                  if (shouldHighlightRow(p['Latest Payment Date'])) {
                    rowClassName += ' highlight-row';
                  }

                  return (
                    <tr key={p.id} className={rowClassName}>
                      {DATA_KEYS.map((key) => {
                        
                        // 🛑 FIX: Intercept the ID column and display index + 1 🛑
                        if (key === 'id') {
                            return (
                                <td key={key} className="table-td">
                                    {index + 1} 
                                </td>
                            );
                        }
                        
                        // Status Column Rendering 
                        if (key === 'payment_status') {
                          const statusData = getStatusDisplay(p[key]);
                          return (
                              <td key={key} className="table-td" 
                                  style={{
                                      backgroundColor: statusData.bgColor,
                                      color: statusData.color || 'white', 
                                      fontWeight: 'bold',
                                      textAlign: 'center',
                                      padding: '12px 8px' 
                                  }}
                              >
                                  {statusData.text}
                              </td>
                          );
                        }
                        
                        // Action button column
                        if (key === 'Action') {
                          return (
                            <td key={key} className="table-td action-cell">
                              <button onClick={() => openManageModal(p.id)} className="manage-button">
                                Manage
                              </button>
                            </td>
                          );
                        }
                        
                        // Latest Date column - format for display
                        if (key === 'Latest Payment Date') {
                          return (
                            <td key={key} className="table-td">
                              {formatDateForDisplay(p[key])}
                            </td>
                          );
                        }
                        
                        // Latest Remark column
                        if (key === 'Latest Remark') {
                          return (
                            <td key={key} className="table-td">
                              {p[key] || 'None'}
                            </td>
                          );
                        }

                        // Render standard cells: Party, Contact No
                        return (
                          <td key={key} className="table-td">{p[key]}</td>
                        );
                      })}
                    </tr>
                  );
                })}
                {/* Display message if no results after filtering */}
                {filteredPayments.length === 0 && payments.length > 0 && (
                  <tr>
                      <td colSpan={ALL_HEADERS.length} className="table-td" style={{textAlign: 'center', fontWeight: 'bold'}}>
                          No records match the current filters.
                      </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TRACKING MODAL */}
        {managePaymentId !== null && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Tracking History for ID: {managePaymentId}</h2>
              <button className="modal-close" onClick={closeManageModal}>&times;</button>
              
              {/* Form to Add New Entry */}
              <form onSubmit={handleAddTrackingEntry} className="tracking-form" style={{flexWrap: 'wrap'}}>
                  <input 
                      type="date" 
                      value={newDate} 
                      onChange={(e) => setNewDate(e.target.value)} 
                      required={!newRemark}
                      style={{flexGrow: 1}}
                  />
                  <input 
                      type="text" 
                      value={newRemark} 
                      onChange={(e) => setNewRemark(e.target.value)} 
                      placeholder="Enter Remark (Optional)" 
                      required={!newDate}
                      style={{flexGrow: 1}}
                  />
                  <button type="submit" className="upload-button" style={{backgroundColor: '#4a90e2'}}>Add New Entry</button>
              </form>

              {/* History List */}
              <div className="history-list">
                  <h3>Current Status: <span style={{color: getStatusDisplay(payments.find(p => p.id === managePaymentId)?.payment_status || 'PENDING').color, fontWeight: 'bold'}}>{getStatusDisplay(payments.find(p => p.id === managePaymentId)?.payment_status || 'PENDING').text}</span></h3>
                  
                  {trackingHistory.length === 0 ? (
                      <p>No history found. Add the first date/remark above.</p>
                  ) : (
                      <ul>
                          {trackingHistory.map((entry) => (
                              <li key={entry.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                  <div>
                                      <strong>Date:</strong> {formatDateForDisplay(entry.actual_payment_date)} 
                                      | <strong>Remark:</strong> {entry.remark || 'None'}
                                      <br />
                                      <small>Created on: {formatDateForDisplay(entry.created_at)}</small>
                                  </div>
                                  
                                  {/* Status Selector in History Item */}
                                  <select 
                                      // When the status changes, we call the API to update the parent payment record
                                      onChange={(e) => handleUpdatePaymentStatus(e.target.value)}
                                      // Display the current status of the main record
                                      value={payments.find(p => p.id === managePaymentId)?.payment_status || 'PENDING'}
                                      style={{
                                          padding: '5px', 
                                          borderRadius: '4px',
                                          border: '1px solid #ccc',
                                          backgroundColor: '#fff',
                                          fontWeight: 'bold'
                                      }}
                                  >
                                      <option value="" disabled>Set Status</option>
                                      <option value="PARTIAL">Partial Payment Done</option>
                                      <option value="PAID">Full Payment Done</option>
                                      <option value="PENDING">Payment Not Done</option>
                                  </select>
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default PaymentTracker; // Renamed export