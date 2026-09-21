import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <section className="hero" aria-labelledby="home-title">
      <p className="eyebrow">Magic: The Gathering game tracker</p>
      <h1 id="home-title">Remember every game. Learn from every match.</h1>
      <p>
        Font of Blessings is a home for your game history, performance insights, and live
        multiplayer life tracking.
      </p>
      <div className="hero-actions">
        <Link className="button" to="/login">Get started</Link>
        <Link className="button button-secondary" to="/tracker">Open tracker</Link>
      </div>
    </section>
  );
}
