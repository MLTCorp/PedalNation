// Affiliate marketplace configuration
// These are search URLs that will be used until specific product links are set up

export interface Marketplace {
  id: string;
  name: string;
  icon: string;
  color: string;
  commission: string;
  searchUrl: (query: string) => string;
}

export const MARKETPLACES: Marketplace[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    icon: '🛒',
    color: '#FF9900',
    commission: '4%',
    searchUrl: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q + ' guitar pedal')}&tag=pedalnation-20`
  },
  {
    id: 'sweetwater',
    name: 'Sweetwater',
    icon: '🎵',
    color: '#0073CF',
    commission: '7%',
    searchUrl: (q) => `https://www.sweetwater.com/store/search?s=${encodeURIComponent(q)}`
  },
  {
    id: 'reverb',
    name: 'Reverb',
    icon: '🔄',
    color: '#4A90D9',
    commission: '5-10%',
    searchUrl: (q) => `https://reverb.com/marketplace?query=${encodeURIComponent(q)}&category=effects-and-pedals`
  },
  {
    id: 'guitarcenter',
    name: 'Guitar Center',
    icon: '🎸',
    color: '#CC0000',
    commission: '6%',
    searchUrl: (q) => `https://www.guitarcenter.com/search?Ntt=${encodeURIComponent(q)}`
  },
  {
    id: 'musiciansfriend',
    name: "Musician's Friend",
    icon: '🎶',
    color: '#006B3F',
    commission: '5%',
    searchUrl: (q) => `https://www.musiciansfriend.com/search?Ntt=${encodeURIComponent(q)}`
  }
];

export function getAffiliateLinks(brand: string, name: string) {
  const query = `${brand} ${name}`;
  return MARKETPLACES.map(m => ({
    id: m.id,
    name: m.name,
    icon: m.icon,
    color: m.color,
    url: m.searchUrl(query)
  }));
}
