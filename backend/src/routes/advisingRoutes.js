// routes/advisingRoutes.js or controllers/advisingController.js
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai'; // or OpenAI

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', async (req, res) => {
  try {
    const { message, history, studentSnapshot } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message query is required.' });
    }

    // 1. Build context-aware system instructions using the student's profile
    const systemInstruction = `
      You are an expert AI Academic Advisor for engineering college students.
      Your job is to provide supportive, practical, and structured academic guidance.

      CURRENT STUDENT CONTEXT:
      - Student ID / Name: ${studentSnapshot?.studentId || 'N/A'}
      - Academic Risk Level: ${studentSnapshot?.riskLevel || 'Medium'}
      - Key Focus Areas: ${studentSnapshot?.focusAreas || 'Attendance & Core Subjects'}
      - Recommended Action Plan: ${studentSnapshot?.actionPlan || 'Focus on subject-level support in high-risk courses.'}

      RULES:
      1. Keep responses clear, structured, and empathetic (use bullet points and action items where helpful).
      2. Tailor your recommendations specifically to the student's risk level and focus areas.
      3. Do not give financial, medical, or legal advice.
      4. Always encourage consulting with their assigned human Academic Adviser for official grade updates or course drops.
    `;

    // 2. Initialize the AI model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction 
    });

    // 3. Map frontend chat history to model chat format
    const formattedHistory = (history || []).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // 4. Start chat session and send new query
    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(message);
    const botReply = result.response.text();

    return res.status(200).json({
      success: true,
      reply: botReply,
    });
  } catch (error) {
    console.error('AI Advising Error:', error);
    return res.status(500).json({
      success: false,
      reply: 'I am currently experiencing technical difficulties retrieving your academic profile. Please try again shortly.',
    });
  }
});

export default router;