import type { NextApiRequest, NextApiResponse } from 'next'
import { GoogleGenAI } from '@google/genai'

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY

if (!API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set. API routes will fail until it is provided.')
}

const ai = new GoogleGenAI({ apiKey: API_KEY })

const cleanJsonString = (text: string) => {
  let clean = (text || '').trim()
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json/, '').replace(/```$/, '')
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```/, '').replace(/```$/, '')
  }
  return clean.trim()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Only POST allowed')
  if (!API_KEY) return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' })

  const body = req.body || {}
  const action = body.action

  try {
    if (action === 'generateSpeech') {
      const text = body.text || ''
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: (text || '').trim() }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      })
      const base64Audio = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
      return res.status(200).json({ audioBase64: base64Audio ?? null })
    }

    if (action === 'identifyObject') {
      const imageBase64 = body.imageBase64
      const theme = body.theme
      const validationLogic = theme
        ? `\nGAME MODE: "${theme.label}"\nGAME RULE DESCRIPTION: "${theme.description || ''}"\nYOUR ROLE: You are a strict but friendly referee for a children's scavenger hunt.\nOUTPUT: Return JSON with word, definition, visualDetail, matchesTheme(boolean), feedback` 
        : ''

      const prompt = `Analyze this image for a child's learning app. ${validationLogic} Return a JSON object with: word, definition, visualDetail, matchesTheme, feedback.`

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
            { text: prompt },
          ],
        },
        config: { responseMimeType: 'application/json' },
      })

      const text = response?.text || ''
      const clean = cleanJsonString(text)
      const json = clean ? JSON.parse(clean) : {}
      return res.status(200).json(json)
    }

    if (action === 'lookupWord') {
      const { word, context, ageGroup } = body
      const prompt = `Explain the word "${word}" to a ${ageGroup} year old child. Context: "${context}". Return JSON with definition, funFact, emoji, visualDetail.`
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } })
      const json = JSON.parse(cleanJsonString(response?.text || '{}'))
      return res.status(200).json(json)
    }

    if (action === 'generateStory') {
      const { items, theme, kidProfile, userPrompt } = body
      const prompt = `You are writing a short story for a child. CHILD PROFILE: ${JSON.stringify(kidProfile)} THEME: ${theme?.label || ''} REQUIRED ITEMS: ${items?.map((i: any) => i.word).join(',')} USER'S IDEA: "${userPrompt || ''}". Return JSON with title, mainCharacterVisual, pages (array of {pageNumber,text}).`
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } })
      const json = JSON.parse(cleanJsonString(response?.text || '{}'))
      return res.status(200).json(json)
    }

    if (action === 'generateIllustration') {
      const { prompt: userPrompt, style, characterVisual } = body
      const finalPrompt = `Kids book illustration, ${style}. ${characterVisual}. Action: ${userPrompt}. Colorful, cute, high quality. No text, no words, no letters, no labels.`
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: finalPrompt }] }, config: { imageConfig: { aspectRatio: '1:1' } } })
      const parts = response?.candidates?.[0]?.content?.parts || []
      for (const part of parts) {
        if (part.inlineData) {
          return res.status(200).json({ imageBase64: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` })
        }
      }
      return res.status(200).json({ imageBase64: null })
    }

    if (action === 'generateSticker') {
      const { imageBase64, word } = body
      const prompt = `Create a die-cut sticker of the "${word}" from this image. 1. Isolate the object on a white background. 2. Add a thick white sticker border. 3. Add a drop shadow. 4. Keep original colors. High quality.`
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }, { text: prompt }] }, config: { imageConfig: { aspectRatio: '1:1' } } })
      const parts = response?.candidates?.[0]?.content?.parts || []
      for (const part of parts) {
        if (part.inlineData) {
          return res.status(200).json({ imageBase64: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` })
        }
      }
      return res.status(200).json({ imageBase64: null })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (error: any) {
    console.error('API error', error)
    return res.status(500).json({ error: error?.message || String(error) })
  }
}
