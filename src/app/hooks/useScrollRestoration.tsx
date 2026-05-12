import { useEffect } from 'react';
import { useLocation } from 'react-router';

const SCROLL_POSITION_KEY = 'homepage_scroll_position';

export function useScrollRestoration() {
  const location = useLocation();

  // Guardar posición de scroll antes de desmontar
  useEffect(() => {
    const saveScrollPosition = () => {
      if (location.pathname === '/') {
        sessionStorage.setItem(SCROLL_POSITION_KEY, window.scrollY.toString());
      }
    };

    // Guardar posición al hacer scroll
    window.addEventListener('scroll', saveScrollPosition);

    return () => {
      window.removeEventListener('scroll', saveScrollPosition);
      saveScrollPosition(); // Guardar al desmontar
    };
  }, [location.pathname]);

  // Restaurar posición de scroll al montar
  useEffect(() => {
    if (location.pathname === '/') {
      const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedPosition) {
        // Usar requestAnimationFrame para asegurar que el DOM esté listo
        requestAnimationFrame(() => {
          window.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: 'instant'
          });
        });
      }
    }
  }, [location.pathname]);

  // Limpiar posición guardada cuando se navega a otra ruta que no sea un proyecto
  useEffect(() => {
    if (!location.pathname.startsWith('/proyectos') && location.pathname !== '/') {
      sessionStorage.removeItem(SCROLL_POSITION_KEY);
    }
  }, [location.pathname]);
}
