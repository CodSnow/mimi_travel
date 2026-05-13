import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AppState, KnowledgeBase, PolicyDocument } from '@mimi/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.join(__dirname, '../../');
const dataDir = path.join(root, 'data');
const dbPath = path.join(dataDir, 'db.json');
const knowledgePath = path.join(dataDir, 'knowledge.json');

const defaultDb: AppState = {
  district: "拱墅区",
  pickup: "",
  destination: "",
  user: { nickname: "", phone: "", avatar: "" },
  pets: [],
  bookedRoutes: [],
  bookedBuddies: [],
  orders: [],
  favorites: ["拱墅区航空托运政策"],
  idleApplication: { status: "not_applied", permissions: [], area: "", intro: "" },
};

export class MimiEngine {
  async ensureDb() {
    await fs.mkdir(dataDir, { recursive: true });
    try {
      await fs.access(dbPath);
    } catch {
      await fs.writeFile(dbPath, JSON.stringify(defaultDb, null, 2));
    }
  }

  async readDb(): Promise<AppState> {
    await this.ensureDb();
    const raw = await fs.readFile(dbPath, "utf8");
    return { ...defaultDb, ...JSON.parse(raw) };
  }

  async writeDb(data: Partial<AppState>): Promise<AppState> {
    const current = await this.readDb();
    const next = { ...current, ...data };
    await fs.writeFile(dbPath, JSON.stringify(next, null, 2));
    return next;
  }

  async readKnowledge(): Promise<KnowledgeBase> {
    try {
      const raw = await fs.readFile(knowledgePath, "utf8");
      return JSON.parse(raw);
    } catch {
      return {
        updatedAt: new Date().toISOString(),
        sourceNames: [],
        districts: [],
        documents: []
      };
    }
  }

  scoreDocument(question: string, doc: PolicyDocument): number {
    const text = `${doc.district} ${doc.title} ${doc.summary} ${doc.materials} ${doc.content}`.toLowerCase();
    const normalized = question.toLowerCase();
    const keywords = ["航空", "铁路", "高铁", "托运", "检疫", "证明", "材料", "地址", "电话", "时间", "狂犬", "抗体", "有效期", "航班", "车次", "免疫", "居住证"];
    const terms = [
      ...normalized.split(/[^\p{L}\p{N}]+/u).filter((term) => term.length > 1),
      ...keywords.filter((term) => normalized.includes(term)),
    ];
    let score = 0;
    if (normalized.includes(doc.district)) score += 8;
    if (text.includes(normalized) && normalized.length > 2) score += 10;
    terms.forEach((term) => {
      const hits = text.split(term).length - 1;
      score += Math.min(hits, 6);
    });
    return score;
  }

  retrieveDocuments(question: string, knowledge: KnowledgeBase, limit = 4): (PolicyDocument & { score: number })[] {
    return [...knowledge.documents]
      .map((doc) => ({ ...doc, score: this.scoreDocument(question, doc) }))
      .filter((doc) => doc.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
