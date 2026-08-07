import React from 'react';
import './App.css';
const Card = ({ title, subtitle, link }) => {
  const handleClick = () => {
    if (link) {
      window.location.href = link;
    } else {
      alert(`${title} module is currently under construction.`);
    }
  };
  return (
    <div className="card" onClick={handleClick}>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
};
const Column = ({ title, color, cards }) => {
  return (
    <div className="column">
      <div className="column-header" style={{ backgroundColor: color }}>
        {title}
      </div>
      {cards.map((card, index) => (
        <Card key={index} title={card.title} subtitle={card.subtitle} link={card.link} />
      ))}
    </div>
  );
};
function App() {
  const columns = [
    {
      title: 'MASTER ENTRY',
      color: '#3b82f6', 
      cards: [
        { title: 'Users', subtitle: 'System users & logins', link: 'http://localhost:3000/users_form.html' },
        { title: 'LOV Master', subtitle: 'List of Values config', link: 'http://localhost:3000/lov_form.html' },
      ]
    },
    {
      title: 'TRANSACTIONS',
      color: '#10b981', 
      cards: [
        { title: 'Bookings', subtitle: 'Customer service requests', link: 'http://localhost:8000/booking_form.html' },
        { title: 'Payments', subtitle: 'Track service payments', link: 'http://localhost:8000/payments_form.html' },
        { title: 'Notifications', subtitle: 'System alerts & messages', link: 'http://localhost:8000/notifications_form.html' },
      ]
    },
    {
      title: 'REPORTS',
      color: '#f97316', 
      cards: [
        { title: 'Audit Logs', subtitle: 'System action history', link: 'http://localhost:8000/audit_log_form.html' },
      ]
    }
  ];
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>House Help Management System</h1>
        <p>Service Booking & Resource Allocation System</p>
        <button className="exit-button" onClick={() => alert('Logging out...')}>Exit</button>
      </header>
      <main className="dashboard-grid">
        {columns.map((col, idx) => (
          <Column key={idx} title={col.title} color={col.color} cards={col.cards} />
        ))}
      </main>
    </div>
  );
}
export default App;
