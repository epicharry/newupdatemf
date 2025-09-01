export interface RegionInfo {
  region: string;
  shard: string;
}

export class RegionService {
  private static readonly REGION_MAPPING: Record<string, string> = {
    // North America
    'usa': 'na', 'can': 'na', 'mex': 'na',
    // Europe
    'gbr': 'eu', 'fra': 'eu', 'deu': 'eu', 'ita': 'eu', 'esp': 'eu',
    'nld': 'eu', 'bel': 'eu', 'che': 'eu', 'aut': 'eu', 'swe': 'eu',
    'nor': 'eu', 'dnk': 'eu', 'fin': 'eu', 'pol': 'eu', 'rus': 'eu',
    'irl': 'eu', 'prt': 'eu', 'cze': 'eu', 'hun': 'eu', 'svk': 'eu',
    'svn': 'eu', 'hrv': 'eu', 'srb': 'eu', 'bgr': 'eu', 'rou': 'eu',
    'grc': 'eu', 'cyp': 'eu', 'mlt': 'eu', 'lux': 'eu', 'est': 'eu',
    'lva': 'eu', 'ltu': 'eu', 'isl': 'eu', 'mkd': 'eu', 'alb': 'eu',
    'bih': 'eu', 'mne': 'eu', 'xkx': 'eu', 'mda': 'eu', 'ukr': 'eu',
    'blr': 'eu', 'geo': 'eu', 'arm': 'eu', 'aze': 'eu', 'kaz': 'eu',
    // Asia Pacific
    'aus': 'ap', 'nzl': 'ap', 'sgp': 'ap', 'hkg': 'ap', 'twn': 'ap',
    'jpn': 'ap', 'kor': 'ap', 'idn': 'ap', 'mys': 'ap', 'tha': 'ap',
    'phl': 'ap', 'vnm': 'ap', 'ind': 'ap', 'pak': 'ap', 'bgd': 'ap',
    'lka': 'ap', 'mmr': 'ap', 'khm': 'ap', 'lao': 'ap', 'brn': 'ap',
    'mnp': 'ap', 'plw': 'ap', 'mhl': 'ap', 'fsm': 'ap', 'nru': 'ap',
    'tuv': 'ap', 'kir': 'ap', 'fji': 'ap', 'ton': 'ap', 'wsm': 'ap',
    'vut': 'ap', 'slb': 'ap', 'png': 'ap', 'ncl': 'ap', 'pyf': 'ap',
    'chn': 'ap', 'mac': 'ap', 'mng': 'ap',
    // Korea (separate region)
    'prk': 'kr',
    // Brazil
    'bra': 'br',
    // Latin America
    'arg': 'latam', 'chl': 'latam', 'col': 'latam', 'per': 'latam',
    'ury': 'latam', 'pry': 'latam', 'bol': 'latam', 'ecu': 'latam',
    'ven': 'latam', 'guy': 'latam', 'sur': 'latam', 'guf': 'latam',
    'pan': 'latam', 'cri': 'latam', 'nic': 'latam', 'hnd': 'latam',
    'gtm': 'latam', 'blz': 'latam', 'slv': 'latam', 'dom': 'latam',
    'hti': 'latam', 'jam': 'latam', 'cub': 'latam', 'tto': 'latam',
    'brb': 'latam', 'grd': 'latam', 'lca': 'latam', 'vct': 'latam',
    'atg': 'latam', 'kna': 'latam', 'dma': 'latam'
  };

  static getRegionFromCountry(countryCode: string): RegionInfo {
    const normalizedCode = countryCode.toLowerCase();
    const region = this.REGION_MAPPING[normalizedCode] || 'na'; // Default to NA
    
    // Determine shard based on region
    let shard: string;
    switch (region) {
      case 'eu':
        shard = 'eu';
        break;
      case 'ap':
        shard = 'ap';
        break;
      case 'kr':
        shard = 'kr';
        break;
      case 'br':
        shard = 'br';
        break;
      case 'latam':
        shard = 'latam';
        break;
      default:
        shard = 'na';
    }

    return { region, shard };
  }

  static async detectUserRegion(authToken: string): Promise<RegionInfo> {
    try {
      const response = await window.electronAPI.makeRequest({
        url: 'https://auth.riotgames.com/userinfo',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        method: 'GET'
      });

      if (response.status === 200 && response.data?.country) {
        const regionInfo = this.getRegionFromCountry(response.data.country);
        console.log(`Detected region: ${regionInfo.region} (${regionInfo.shard}) for country: ${response.data.country}`);
        return regionInfo;
      }
    } catch (error) {
      console.error('Failed to detect user region:', error);
    }

    // Fallback to default region
    console.log('Using default region: na');
    return { region: 'na', shard: 'na' };
  }
}