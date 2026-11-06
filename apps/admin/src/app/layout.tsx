import './globals.css';

export const metadata = { title: 'HumanLift Admin', robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production' && (
          <div className="env" role="note">Test environment — synthetic data only. Every action you take is recorded in the audit log.</div>
        )}
        {children}
      </body>
    </html>
  );
}
