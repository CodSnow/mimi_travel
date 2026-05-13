export interface InternalRequestMeta {
  requestId: string;
  traceId?: string;
  operatorUserId?: string;
  source: 'ts-bff';
  timestamp: string;
}
