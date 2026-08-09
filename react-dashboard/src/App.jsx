import React from 'react';
import './App.css';

const Card = ({ title, subtitle, link }) => {
  const isLinked = !!link;
  const handleClick = () => {
    if (isLinked) window.location.href = link;
  };
  return (
    <div
      className={`card ${isLinked ? 'card-linked' : 'card-disabled'}`}
      onClick={isLinked ? handleClick : undefined}
    >
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
};

const Column = ({ title, color, cards }) => (
  <div className="column">
    {cards.map((card, index) => (
      <Card key={index} title={card.title} subtitle={card.subtitle} link={card.link} />
    ))}
  </div>
);

function App() {
  const columns = [
    {
      title: 'MASTER',
      color: '#3b82f6',
      cards: [
        { title: 'Users', subtitle: 'System users & logins', link: 'http://localhost:3000/users_form.html' },
        { title: 'LOV Master', subtitle: 'List of Values configuration', link: 'http://localhost:3000/lov_form.html' },
        { title: 'Service Category', subtitle: 'Service types (Maid, Plumber…)', link: null },
        { title: 'Provider Profile', subtitle: 'Provider details, rates & skills', link: null },
        { title: 'City Master', subtitle: 'Cities available for service', link: null },
        { title: 'Area Master', subtitle: 'Areas within each city', link: null },
        { title: 'Document Type', subtitle: 'ID & verification document types', link: null },
        { title: 'Settings', subtitle: 'System-wide configuration values', link: null },
      ],
    },
    {
      title: 'TRANSACTIONS',
      color: '#10b981',
      cards: [
        { title: 'Bookings', subtitle: 'Customer service requests', link: 'http://localhost:8000/booking_form.html' },
        { title: 'Payments', subtitle: 'Track & record service payments', link: 'http://localhost:8000/payments_form.html' },
        { title: 'Notifications', subtitle: 'System alerts & messages', link: 'http://localhost:8000/notifications_form.html' },
        { title: 'Reviews', subtitle: 'Customer ratings & feedback', link: null },
        { title: 'Provider Documents', subtitle: 'Uploaded ID & verification docs', link: null },
        { title: 'Complaints', subtitle: 'Issue tracking & resolution', link: null },
        { title: 'Audit Log', subtitle: 'System action history & trail', link: 'http://localhost:8000/audit_log_form.html' },
      ],
    },
    {
      title: 'REPORTS',
      color: '#f97316',
      cards: [
        { title: 'Booking Report', subtitle: 'Bookings summary & status analysis', link: null },
        { title: 'Revenue Report', subtitle: 'Payments & commission breakdown', link: null },
        { title: 'Provider Report', subtitle: 'Provider performance metrics', link: null },
        { title: 'Customer Report', subtitle: 'Customer activity & history', link: null },
        { title: 'Ratings Report', subtitle: 'Service satisfaction insights', link: null },
        { title: 'Complaint Report', subtitle: 'Complaint trends & resolution stats', link: null },
      ],
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Fixed top header */}
      <header className="dashboard-header">
        <h1>House Help Management System</h1>
        {/* <button className="exit-button" onClick={() => alert('Logging out...')}>Exit</button> */}
      </header>

      {/* Fixed column title bar just below the header */}
      <div className="column-title-bar">
        <div className="column-title-bar-inner">
          {columns.map((col, idx) => (
            <div
              key={idx}
              className="column-title-pill"
              style={{ backgroundColor: col.color }}
            >
              {col.title}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable grid */}
      <main className="dashboard-grid">
        {columns.map((col, idx) => (
          <Column key={idx} title={col.title} color={col.color} cards={col.cards} />
        ))}
      </main>
    </div>
  );
}

export default App;
