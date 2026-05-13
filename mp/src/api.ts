import Taro from '@tarojs/taro'

const BASE_URL = 'http://localhost:3000' // 你的后端地址

export const miniFetch = async (url: string, options: any = {}) => {
  const { method = 'GET', body, headers = {} } = options
  
  const res = await Taro.request({
    url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
    method: method as any,
    data: body ? JSON.parse(body) : undefined,
    header: headers,
  })

  return {
    ok: res.statusCode >= 200 && res.statusCode < 300,
    json: async () => res.data,
  }
}
