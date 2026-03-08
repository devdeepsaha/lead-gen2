import React from 'react';
// CHANGED: Removed Vite boilerplate imports (React logo, useState, App.css)
// CHANGED: Imported the new LeadDashboard component
import LeadDashboard from './components/LeadDashboard';

export default function App() {
  // CHANGED: Removed the counter state and boilerplate JSX, replacing it with the dashboard wrapper
  return (
    <LeadDashboard />
  );
}