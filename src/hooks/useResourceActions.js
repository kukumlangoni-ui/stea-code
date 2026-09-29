import { useNavigate } from 'react-router-dom';
import { trackSiteEvent } from '../utils/siteAnalytics.js';
import { getResourceDetailPath } from '../utils/routeHelpers.js';

export function useResourceActions() {
  const navigate = useNavigate();

  const openResourceDetail = (resource) => {
    if (!resource) return;
    navigate(getResourceDetailPath(resource), { state: { website: resource } });
  };

  const openExternalWebsite = (resource) => {
    if (!resource || (!resource.url && !resource.domain)) return;
    const url = resource.url || (resource.domain.startsWith('http') ? resource.domain : `https://${resource.domain}`);
    
    // Fire analytics asynchronously
    trackSiteEvent('website_open', { 
      websiteId: resource.id || resource.slug,
      websiteName: resource.name,
      destination: url
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return { openResourceDetail, openExternalWebsite };
}
