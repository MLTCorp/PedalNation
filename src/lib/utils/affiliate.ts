export interface FallbackAffiliateLink {
	store_name: string;
	url: string;
	icon: string;
	color: string;
	is_fallback: true;
}

const MARKETPLACES = [
	{
		name: 'Amazon',
		icon: '🛒',
		color: '#FF9900',
		buildUrl: (q: string) =>
			`https://www.amazon.com/s?k=${encodeURIComponent(q + ' guitar pedal')}&tag=pedalnation-20`
	},
	{
		name: 'Sweetwater',
		icon: '🎵',
		color: '#0073CF',
		buildUrl: (q: string) =>
			`https://www.sweetwater.com/store/search?s=${encodeURIComponent(q)}`
	},
	{
		name: 'Reverb',
		icon: '🔄',
		color: '#4A90D9',
		buildUrl: (q: string) =>
			`https://reverb.com/marketplace?query=${encodeURIComponent(q)}&category=effects-and-pedals`
	},
	{
		name: 'Guitar Center',
		icon: '🎸',
		color: '#CC0000',
		buildUrl: (q: string) =>
			`https://www.guitarcenter.com/search?Ntt=${encodeURIComponent(q)}`
	},
	{
		name: "Musician's Friend",
		icon: '🎶',
		color: '#006B3F',
		buildUrl: (q: string) =>
			`https://www.musiciansfriend.com/search?Ntt=${encodeURIComponent(q)}`
	}
] as const;

export function generateFallbackLinks(brand: string, name: string): FallbackAffiliateLink[] {
	const query = `${brand} ${name}`;
	return MARKETPLACES.map((mp) => ({
		store_name: mp.name,
		url: mp.buildUrl(query),
		icon: mp.icon,
		color: mp.color,
		is_fallback: true as const
	}));
}
