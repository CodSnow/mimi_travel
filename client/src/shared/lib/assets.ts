const baseUrl = ((import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL || '/').replace(
  /\/?$/,
  '/',
);

export function resolveAssetUrl(name: string): string {
  return `${baseUrl}assets/${name}`;
}

export const assets = {
  homeCat: resolveAssetUrl('home-cat.png'),
  policyCat: resolveAssetUrl('policy-qa-cat.svg'),
  bannerCat: resolveAssetUrl('banner-suitcase-cat.svg'),
  windCat: resolveAssetUrl('wind-cat.png'),
  routeDog: resolveAssetUrl('route-dog.png'),
  loginCat: resolveAssetUrl('login-cat.svg'),
  adoptCat: resolveAssetUrl('banner-round-cat.svg'),
  postCarrier: resolveAssetUrl('post-carrier.jpg'),
  postCert: resolveAssetUrl('post-cert.jpg'),
  postLuggage: resolveAssetUrl('post-luggage.jpg'),
};
