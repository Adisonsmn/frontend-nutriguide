import { useEffect } from 'react';

/**
 * Sets the document title dynamically for each page.
 * Format: "Page Name | Nutri Guide"
 */
export const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = title ? `${title} | Nutri Guide` : 'Nutri Guide';
    return () => {
      document.title = 'Nutri Guide';
    };
  }, [title]);
};
