import { useEffect } from 'react';
import { useWebsitesData } from '../../context/WebsitesDataContext.jsx';

export function useAdminSitesCatalog() {
  const data = useWebsitesData();
  
  useEffect(() => {
    if (data && data.triggerFetch && !data.hasReceivedServerSnapshot) {
      data.triggerFetch();
    }
  }, [data]);
  
  return data;
}
