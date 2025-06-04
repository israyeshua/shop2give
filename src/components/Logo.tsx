import { Link } from 'react-router-dom';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`block ${className}`}>
      <img src="/logo.svg" alt="Shop2Give" className="h-10" />
    </Link>
  );
}