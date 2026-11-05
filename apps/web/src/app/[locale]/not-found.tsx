import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <h1>Page not found / Page introuvable</h1>
      <p>This page does not exist or has moved. Cette page n’existe pas ou a été déplacée.</p>
      <p><Link href="/">HumanLift</Link></p>
    </>
  );
}
