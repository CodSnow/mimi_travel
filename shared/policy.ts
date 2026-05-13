export interface PolicyPoint {
  name: string;
  address?: string;
  time?: string;
  phone?: string;
}

export interface PolicyDocument {
  id: string;
  district: string;
  category: string;
  title: string;
  summary: string;
  point?: PolicyPoint;
  materials: string;
  sourceName: string;
  content: string;
}

export interface KnowledgeBase {
  updatedAt: string;
  sourceNames: string[];
  districts: string[];
  documents: PolicyDocument[];
}
