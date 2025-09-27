import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const personalityMap = {
  professor: 'You are a professor. Use a calm, structured, and educational tone to explain the summary like teaching students.',
  journalist: 'You are a journalist. Use a concise, factual, and serious tone to write the summary as a news report.',
  narrator: 'You are a storyteller. Use an engaging, dramatic, and fun tone to narrate the summary like a bedtime story.'
};

app.post('/api/summarize', async (req, res) => {
  try {
    const { character, document, model } = req.body || {};
    if (!character || !document) {
      return res.status(400).json({ error: 'Missing required fields: character, document' });
    }
    const personaInstruction = personalityMap[character] || personalityMap.professor;
    const prompt = `${personaInstruction}\n\nSummarize the following document:\n\n${document}`;
    const usedModel = model || DEFAULT_MODEL;

    const { data } = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: usedModel,
      prompt,
      stream: false
    });

    return res.json({ character, model: usedModel, summary: data?.response || '' });
  } catch (err) {
    const details = err?.response?.data || err?.message || 'Unknown error';
    console.error('Ollama summarize error:', details);
    return res.status(500).json({ error: 'Ollama request failed', details });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Summarizer backend running on http://localhost:${PORT}`);
});