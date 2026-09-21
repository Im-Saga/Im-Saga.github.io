import { Link } from 'react-router-dom';
import { PagePlaceholder } from './PagePlaceholder';
export function NotFoundPage() { return <PagePlaceholder eyebrow="404" title="Page not found"><Link className="text-link" to="/">Return home</Link></PagePlaceholder>; }
