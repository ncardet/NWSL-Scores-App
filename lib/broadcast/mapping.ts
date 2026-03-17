export interface NetworkConfig {
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  bgColor: string;
}

export const networkConfigs: Record<string, NetworkConfig> = {
  'ESPN': { name: 'ESPN', shortName: 'ESPN', color: '#CC0000', textColor: '#ffffff', bgColor: '#CC0000' },
  'ESPN2': { name: 'ESPN2', shortName: 'ESPN2', color: '#CC0000', textColor: '#ffffff', bgColor: '#CC0000' },
  'ESPN+': { name: 'ESPN+', shortName: 'ESPN+', color: '#00356B', textColor: '#ffffff', bgColor: '#00356B' },
  'Prime Video': { name: 'Prime Video', shortName: 'Prime', color: '#00A8E1', textColor: '#ffffff', bgColor: '#00A8E1' },
  'CBS Sports Network': { name: 'CBS Sports Network', shortName: 'CBS SN', color: '#0056A2', textColor: '#ffffff', bgColor: '#0056A2' },
  'CBS': { name: 'CBS', shortName: 'CBS', color: '#0056A2', textColor: '#ffffff', bgColor: '#0056A2' },
  'ION': { name: 'ION', shortName: 'ION', color: '#6B2D8B', textColor: '#ffffff', bgColor: '#6B2D8B' },
  'Victory+': { name: 'Victory+', shortName: 'Victory+', color: '#E8871A', textColor: '#ffffff', bgColor: '#E8871A' },
  'NWSL+': { name: 'NWSL+', shortName: 'NWSL+', color: '#003087', textColor: '#ffffff', bgColor: '#003087' },
  'Peacock': { name: 'Peacock', shortName: 'Peacock', color: '#000000', textColor: '#ffffff', bgColor: '#000000' },
  'USA Network': { name: 'USA Network', shortName: 'USA', color: '#1C64A8', textColor: '#ffffff', bgColor: '#1C64A8' },
};

export function getNetworkConfig(network: string): NetworkConfig {
  // Try exact match first
  if (networkConfigs[network]) return networkConfigs[network];

  // Try partial match
  const lower = network.toLowerCase();
  for (const [key, config] of Object.entries(networkConfigs)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return config;
    }
  }

  // Default fallback
  return {
    name: network,
    shortName: network,
    color: '#6B7280',
    textColor: '#ffffff',
    bgColor: '#6B7280',
  };
}

// Fallback broadcast inference when ESPN returns no broadcast data
export function inferBroadcast(isoDate: string): string | null {
  const date = new Date(isoDate);
  const day = date.getDay(); // 0=Sun, 1=Mon, ... 5=Fri, 6=Sat
  const hour = date.getHours();

  if (day === 5) return 'Prime Video'; // Friday
  if (day === 6) {
    if (hour >= 15) return 'ION'; // Saturday late (3pm+)
    return 'CBS Sports Network'; // Saturday day
  }
  if (day === 0) return 'Victory+'; // Sunday

  return 'NWSL+'; // Weekday
}
