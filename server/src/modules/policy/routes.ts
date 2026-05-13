import { Router } from 'express';

import { MimiEngine } from '../../engine.js';

export function createPolicyRouter(engine: MimiEngine): Router {
  const router = Router();

  router.get('/api/knowledge', async (req, res) => {
    try {
      const knowledge = await engine.readKnowledge();
      const { district } = req.query;

      let documents = knowledge.documents;
      if (typeof district === 'string' && district) {
        documents = documents.filter((doc) => doc.district === district);
      }

      res.json({
        updatedAt: knowledge.updatedAt,
        sourceNames: knowledge.sourceNames,
        districts: knowledge.districts,
        documents: documents.map(({ content, ...doc }) => doc),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/api/knowledge/:id', async (req, res) => {
    try {
      const knowledge = await engine.readKnowledge();
      const document = knowledge.documents.find((doc) => doc.id === req.params.id);
      if (!document) {
        return res.status(404).json({ error: 'Policy not found' });
      }
      return res.json(document);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post('/api/ask', async (req, res) => {
    try {
      const { question } = req.body;
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }

      const knowledge = await engine.readKnowledge();
      const contexts = engine.retrieveDocuments(question, knowledge, 4);
      const hasEnoughContext = contexts.length > 0 && contexts[0].score >= 6;

      if (!hasEnoughContext) {
        return res.json({
          question,
          answer:
            '知识库中暂未检索到相关资料，无法确认答案。请换个区县、办理点、材料或托运方式再问一次。',
          mode: 'no-context',
          model: 'local-retriever',
          contexts: [],
        });
      }

      const first = contexts[0];
      const answer = [
        `优先参考「${first.title}」：${first.summary}`,
        `办理材料：${first.materials}`,
        '通用材料包含：宠物主人身份证原件、宠物有效免疫证、航班号/列车车次、出行日期、现场检疫申报单，并且宠物需到场做健康检查。',
        '通用提醒：《动物检疫合格证明》有效期通常为5天，建议出行前2-3天办理，并提前电话确认材料和工作时间。',
      ].join('\n');

      return res.json({
        question,
        answer,
        mode: 'local-rag',
        model: 'local-retriever',
        contexts: contexts.map(({ content, ...doc }) => doc),
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
}
