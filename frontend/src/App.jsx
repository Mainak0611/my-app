// frontend/src/App.jsx
import { useEffect, useState } from "react";

function App() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/payments")
      .then((res) => res.json())
      .then((data) => setPayments(data))
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Payment Records</h1>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Party</th>
            <th>Contact No</th>
            <th>Rent Amount</th>
            <th>Total Amt</th>
            <th>Payment Date</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.Party}</td>
              <td>{p["Contact No"]}</td>
              <td>{p["Rent Amount"]}</td>
              <td>{p["Total Amt"]}</td>
              <td>{p["payment date"]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
