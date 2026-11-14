import { useSearchParams } from 'react-router-dom';
import Landing from './Landing';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  return <Landing initialAuthModal={mode} />;
}
