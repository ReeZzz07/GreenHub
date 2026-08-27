import { useEffect, useState } from 'react';

const QUERY = '(min-width: 768px)';

// Совпадает с брейкпоинтом `md` в Tailwind — там же, где бургер/нижняя навигация переключаются на десктопный вид.
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}
