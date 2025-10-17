// frontend/src/main.jsx

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 🛑 FIX: Change the path to point to the styles directory 🛑
import './styles/index.css' 
// OR, if you haven't created a styles folder and it's still at the root:
// import './index.css' // (If it's at the root and you just had a typo)

// 🛑 Note: This line also looks incorrect now: import App from "/styles/App.jsx" 🛑
// Based on our previous fix, this line should likely be:
import App from './App.jsx' 
// or if App.jsx is gone and main.jsx renders PaymentTracker directly:
// import PaymentTracker from './modules/payments/PaymentTracker.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* You must decide which component to render. 
       Assuming you kept the 'App' wrapper: 
    */}
    <App /> 
  </StrictMode>,
)