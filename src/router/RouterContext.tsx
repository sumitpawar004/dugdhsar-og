import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  setSearchParam: (key: string, value: string) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode; initialPath?: string }> = ({ children, initialPath }) => {
  const [path, setPath] = useState<string>(() => {
    if (initialPath) return initialPath;
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      setPath(window.location.pathname || '/');
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (!to) return;
    
    // Support relative or absolute path with query string
    let targetPath = to;
    let targetSearch = '';
    if (to.includes('?')) {
      const parts = to.split('?');
      targetPath = parts[0];
      targetSearch = '?' + parts[1];
    }

    if (window.location.pathname !== targetPath || window.location.search !== targetSearch) {
      window.history.pushState({}, '', targetPath + targetSearch);
      setPath(targetPath);
      setSearchParams(new URLSearchParams(targetSearch));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const setSearchParam = useCallback((key: string, value: string) => {
    const nextParams = new URLSearchParams(window.location.search);
    if (!value) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    const newSearch = nextParams.toString() ? `?${nextParams.toString()}` : '';
    window.history.pushState({}, '', window.location.pathname + newSearch);
    setSearchParams(nextParams);
  }, []);

  // Compute matched params dynamically for current path
  const params: Record<string, string> = {};
  
  // Pattern matching for routes like /products/:slug, /product/:slug, /collections/:slug, /order/success/:id, /account/orders/:id, /journal/:slug
  const segments = path.split('/').filter(Boolean);
  if ((segments[0] === 'products' || segments[0] === 'product') && segments[1]) {
    params.slug = segments[1];
  } else if (segments[0] === 'collections' && segments[1]) {
    params.slug = segments[1];
  } else if (segments[0] === 'journal' && segments[1]) {
    params.slug = segments[1];
  } else if (segments[0] === 'order' && segments[1] === 'success' && segments[2]) {
    params.id = segments[2];
  } else if (segments[0] === 'account' && segments[1] === 'orders' && segments[2]) {
    params.id = segments[2];
  }

  return (
    <RouterContext.Provider value={{ path, navigate, params, searchParams, setSearchParam }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
