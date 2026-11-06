'use client';

import { Shell, useStaff } from '@/components/Shell';

function Overview() {
  const s = useStaff();
  return (
    <>
      <h1>Overview</h1>
      <div className="card">
        <p>Signed in as <strong>{s.email}</strong> with roles: {s.roles.map((r) => <span key={r} className="badge">{r}</span>)}</p>
        <p className="muted">Use the menu to reach the areas your role allows. Pages you cannot use are hidden, and the server refuses them anyway.</p>
      </div>
      <div className="card">
        <h2>Not built yet</h2>
        <p className="muted">Verification review (Milestone 2), request approval (Milestone 3) and payment reconciliation (Milestone 4) will appear here when they exist.</p>
      </div>
    </>
  );
}

export default function Page() {
  return <Shell><Overview /></Shell>;
}
