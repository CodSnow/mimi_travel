import type { KnowledgeBase, PolicyDocument } from '@mimi/shared';

export interface PolicyAnswer {
  question: string;
  answer: string;
  mode: string;
  model: string;
  checklist: string[];
  citations: Array<{ id: string; title: string; sourceName: string; district: string }>;
  contexts: Array<Omit<PolicyDocument, 'content'> & { score?: number }>;
}

export class LocalRagProvider {
  answer(question: string, contexts: Array<PolicyDocument & { score: number }>): PolicyAnswer {
    const hasEnoughContext = contexts.length > 0 && contexts[0].score >= 6;
    if (!hasEnoughContext) {
      return {
        question,
        answer: '知识库中暂未检索到相关资料，无法确认答案。请换个区县、办理点、材料或托运方式再问一次。',
        mode: 'no-context',
        model: 'local-rag',
        checklist: [],
        citations: [],
        contexts: [],
      };
    }

    const first = contexts[0];
    const checklist = buildChecklist(first.materials);
    const answer = [
      `优先参考「${first.title}」：${first.summary}`,
      `办理材料：${first.materials}`,
      '通用提醒：《动物检疫合格证明》有效期通常为5天，建议出行前2-3天办理，并提前电话确认材料和工作时间。',
    ].join('\n');

    return {
      question,
      answer,
      mode: 'local-rag',
      model: 'local-retriever',
      checklist,
      citations: contexts.map((doc) => ({
        id: doc.id,
        title: doc.title,
        sourceName: doc.sourceName,
        district: doc.district,
      })),
      contexts: contexts.map(({ content: _content, ...doc }) => doc),
    };
  }
}

export class DeepSeekProvider {
  constructor(private readonly apiKey?: string) {}

  isEnabled(): boolean {
    return Boolean(this.apiKey);
  }

  answerUnavailable(question: string, knowledge: KnowledgeBase): PolicyAnswer {
    return {
      question,
      answer: 'DeepSeekProvider 未配置 API Key，当前使用本地 RAG provider。真实接入需要配置密钥、限流、审计和失败降级策略。',
      mode: 'deepseek-disabled',
      model: 'deepseek-not-configured',
      checklist: [],
      citations: [],
      contexts: knowledge.documents.slice(0, 2).map(({ content: _content, ...doc }) => doc),
    };
  }
}

function buildChecklist(materials: string): string[] {
  return materials
    .split(/[+；;、，,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .concat(['提前电话确认办理点工作时间', '出行前2-3天办理检疫证明', '携带宠物到场做健康检查'])
    .filter((item, index, array) => array.indexOf(item) === index);
}
