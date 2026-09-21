import { Link } from 'react-router-dom';
import { PagePlaceholder } from './PagePlaceholder';
export function GamesPage() { return <PagePlaceholder eyebrow="Game history" title="Games"><p>Search, filter, and review your recorded matches here.</p><Link className="text-link" to="/games/new">Record a game</Link></PagePlaceholder>; }
