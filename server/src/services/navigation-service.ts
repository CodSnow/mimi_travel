export interface NavigationLink {
  amap: string;
  baidu: string;
  webFallback: string;
}

export interface NavigationLinkInput {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  toName: string;
  mode?: 'driving' | 'walking';
}

export class NavigationService {
  buildLink(input: NavigationLinkInput): NavigationLink {
    const mode = input.mode || 'driving';
    const toName = encodeURIComponent(input.toName);

    return {
      amap: `androidamap://route?sourceApplication=mimi_travel&slat=${input.fromLat}&slon=${input.fromLng}&dlat=${input.toLat}&dlon=${input.toLng}&dname=${toName}&dev=0&t=${mode === 'walking' ? 2 : 0}`,
      baidu: `baidumap://map/direction?origin=${input.fromLat},${input.fromLng}&destination=name:${toName}|latlng:${input.toLat},${input.toLng}&mode=${mode === 'walking' ? 'walking' : 'driving'}&src=mimi_travel`,
      webFallback: `https://uri.amap.com/navigation?from=${input.fromLng},${input.fromLat}&to=${input.toLng},${input.toLat},${toName}&mode=${mode === 'walking' ? 'walk' : 'car'}&src=mimi_travel`,
    };
  }
}
