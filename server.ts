import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client to prevent crashes if key is missing during startup
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// AI Score Analysis API Route
app.post('/api/analyze-scores', async (req, res) => {
  try {
    const { studentName, classroom, studentId, attempts } = req.body;

    if (!attempts || !Array.isArray(attempts) || attempts.length === 0) {
      return res.status(400).json({ error: 'No attempts data provided for analysis' });
    }

    const client = getGeminiClient();

    // Prepare data summary for Gemini
    const attemptsSummary = attempts.map(att => {
      return `- แบบทดสอบ: ${att.quizTitle}, คะแนน: ${att.score}/${att.maxScore}, ชนิด: ${att.type === 'pre' ? 'ก่อนเรียน' : att.type === 'post' ? 'หลังเรียน' : 'เก็บคะแนนบทเรียน'}`;
    }).join('\n');

    const systemInstruction = `คุณคือระบบวิเคราะห์ผลการเรียนอัจฉริยะ (AI Academic Analyzer) สำหรับรายวิชาวิทยาการคำนวณ ชั้นมัธยมศึกษาปีที่ 3 ของประเทศไทย
วิเคราะห์ข้อมูลคะแนนดิบและแนวโน้มของนักเรียน แล้วให้คำแนะนำที่สร้างสรรค์ สรุปจุดแข็ง จุดอ่อน และระบุเนื้อหา/เทคนิคที่ควรเรียนรู้เพิ่ม
กรุณาตอบเป็นภาษาไทยที่เป็นมิตร ชัดเจน สร้างแรงบันดาลใจ และใช้สัญกรณ์ JSON ตามโครงสร้างที่ระบุอย่างเคร่งครัด`;

    const prompt = `วิเคราะห์ผลการเรียนของนักเรียนดังต่อไปนี้:
ชื่อนักเรียน: ${studentName || 'ทั่วไป'}
ชั้นเรียน: ${classroom || 'ม.3'}
เลขประจำตัว: ${studentId || 'ไม่ระบุ'}

ผลการทำแบบทดสอบ:
${attemptsSummary}

กรุณาวิเคราะห์จุดเด่น (strongPoints), จุดที่ควรพัฒนา (weakPoints), และสร้างรายงานข้อแนะนำโดยรวม (recommendations) พร้อมระบุคำศัพท์เฉพาะทางด้านวิทยาการคำนวณ ม.3 ที่เกี่ยวข้อง เช่น IoT, SDLC, Big Data, Copyright หรือ Digital Citizenship ให้ครบถ้วนและเหมาะสม พร้อมทั้งระบุทรัพยากรการศึกษาแนะนำ (suggestedResources)`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.STRING,
              description: 'บทสรุปวิเคราะห์ผลการเรียนและคำแนะนำเชิงพัฒนาการสำหรับนักเรียน'
            },
            weakPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'รายการข้อผิดพลาดหรือเนื้อหาบทเรียนที่เป็นจุดอ่อนที่ควรได้รับการทบทวนเป็นข้อๆ'
            },
            strongPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'รายการจุดแข็ง หรือทักษะที่ทำคะแนนได้ดีมากเป็นข้อๆ'
            },
            suggestedResources: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'รายการคำแนะนำในการไปหาความรู้เพิ่มเติม เช่น ทบทวนสไลด์หน่วยที่ X, แหล่งข้อมูล สื่อวิดีโอ หรือแบบฝึกหัดเจาะลึก'
            }
          },
          required: ['recommendations', 'weakPoints', 'strongPoints', 'suggestedResources']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('No text returned from Gemini API');
    }

    const parsedResult = JSON.parse(resultText);
    res.json(parsedResult);
  } catch (error: any) {
    console.error('Gemini score analysis failed:', error);
    res.status(500).json({ 
      error: 'Failed to analyze scores with AI', 
      details: error.message || error 
    });
  }
});

// Serve health status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Dev server: Mounted Vite middleware');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Prod server: Serving static files from', distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
