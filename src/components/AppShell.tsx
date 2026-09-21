import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/games', label: 'Games' },
  { to: '/tracker', label: 'Tracker' },
  { to: '/account', label: 'Account' },
];

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="content-container header-content">
          <NavLink className="brand" to="/" aria-label="Font of Blessings home">
            Font of Blessings
          </NavLink>
          <nav aria-label="Primary navigation">
            <ul className="primary-nav">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to}>{link.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main className="content-container page-content">{children}</main>
    </div>
  );
}
