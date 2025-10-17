// frontend/src/modules/payments/PaymentUtils.js

// Helper function to format date from DB (YYYY-MM-DDTHH:MM:SS.000Z) to Display (Local format)
export const formatDateForDisplay = (dbDate) => {
  if (!dbDate) return 'N/A';
  try {
    const date = new Date(dbDate);
    // Use toLocaleDateString for a user-friendly format (e.g., 10/17/2025)
    return date.toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

// Helper function to format date for input (YYYY-MM-DD)
export const formatDateForInput = (dbDate) => {
  if (!dbDate) return '';
  const date = new Date(dbDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function for Status Display and Styling (Softer Red) 
export const getStatusDisplay = (status) => {
    const statusMap = {
        'PAID': { 
            text: 'Full Payment Done', 
            bgColor: '#d4edda',   // Light Green background
            color: '#155724'      // Dark Green text for contrast
        },     
        'PARTIAL': { 
            text: 'Partial Payment Done', 
            bgColor: '#fff3cd',   // Light Yellow background
            color: '#856404'      // Dark Brown text for contrast
        }, 
        // Corrected dark text color for PENDING
        'PENDING': { 
            text: 'Payment Not Done', 
            bgColor: '#f8d7da',   // Light Red/Pink background
            color: '#721c24'      // Dark Red text for contrast
        },   
    };
    return statusMap[status] || statusMap['PENDING'];
};