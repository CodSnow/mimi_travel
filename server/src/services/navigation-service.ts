import { env } from '../config/env.js';

export interface NavigationLink {
  amap: string;
  baidu: string;
  webFallback: string;
}

export interface NavigationSdkProviderConfig {
  enabled: boolean;
  key: string;
  sdkUrl: string;
}

export interface NavigationSdkConfig {
  enabled: boolean;
  webFallbackEnabled: boolean;
  providers: {
    amap: NavigationSdkProviderConfig;
    baidu: NavigationSdkProviderConfig;
  };
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
  /**
   * 返回前端可公开使用的地图 Web SDK 配置。
   * 参数：无，配置只来自环境变量，避免把真实 key 写入代码仓库。
   * 返回值：包含 AMap/Baidu 的启用状态、Web SDK key 和始终可用的 Web fallback 开关。
   */
  getSdkConfig(): NavigationSdkConfig {
    const amapKey = env.mapAmapWebKey.trim();
    const baiduKey = env.mapBaiduWebKey.trim();
    const sdkEnabled = env.mapSdkEnabled;

    return {
      enabled: sdkEnabled && Boolean(amapKey || baiduKey),
      webFallbackEnabled: true,
      providers: {
        amap: {
          enabled: sdkEnabled && Boolean(amapKey),
          key: amapKey,
          sdkUrl: 'https://webapi.amap.com/maps',
        },
        baidu: {
          enabled: sdkEnabled && Boolean(baiduKey),
          key: baiduKey,
          sdkUrl: 'https://api.map.baidu.com/api',
        },
      },
    };
  }

  /**
   * 生成三方 App URI 和 Web fallback 导航链接。
   * 参数：起终点坐标、终点名称和导航模式，坐标沿用业务订单中的坐标系。
   * 返回值：高德 URI、百度 URI、以及没有 SDK 或 App 时可打开的 Web 导航链接。
   */
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
