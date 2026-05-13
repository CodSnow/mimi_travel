import { Router } from 'express';

import { env } from '../../config/env.js';
import { MimiEngine } from '../../engine.js';
import { DeepSeekProvider, LocalRagProvider } from '../../services/policy-providers.js';

export function createPolicyRouter(engine: MimiEngine): Router {
  const router = Router();
  const localRagProvider = new LocalRagProvider();
  const deepSeekProvider = new DeepSeekProvider(env.deepSeekApiKey);

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
      if (req.body?.provider === 'deepseek' && !deepSeekProvider.isEnabled()) {
        return res.json(deepSeekProvider.answerUnavailable(question, knowledge));
      }
      return res.json(localRagProvider.answer(question, contexts));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
}
