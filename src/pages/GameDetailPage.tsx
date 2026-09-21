import { useParams } from 'react-router-dom';
import { PagePlaceholder } from './PagePlaceholder';
export function GameDetailPage() { const { gameId } = useParams(); return <PagePlaceholder eyebrow="Game detail" title="Game record">Viewing game <strong>{gameId}</strong>.</PagePlaceholder>; }
