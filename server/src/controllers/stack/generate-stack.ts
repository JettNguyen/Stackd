import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import { GEMINI_API_KEY } from '../../constants'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_MODEL = 'gemini-2.5-flash'

const allowedMimeTypes = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
]

type UploadedFile = {
  mimetype?: string
  buffer: Buffer
}

type FileData = {
  mimeType: string
  base64: string
}

const normalizeModelName = (name: string) => {
  const value = String(name || '').trim()
  if (!value) return ''
  return value.startsWith('models/') ? value : `models/${value}`
}

const fail = (next: Parameters<RequestHandler>[2], statusCode: number, message: string, details?: string) => {
  next({ statusCode, message, ...(details ? { details } : {}) })
}

const generateWithModel = async (
  modelName: string,
  systemPrompt: string,
  userText: string,
  files?: FileData[]
) => {
  const url = `${GEMINI_API_BASE}/${modelName}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`

  const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: userText },
  ]
  for (const file of files ?? []) {
    userParts.push({ inlineData: { mimeType: file.mimeType, data: file.base64 } })
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [
        {
          role: 'user',
          parts: userParts,
        },
      ],
      generationConfig: { temperature: 0.2 },
    }),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`generateContent failed for ${modelName} (${response.status}): ${details || response.statusText}`)
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  return (payload.candidates?.[0]?.content?.parts || [])
    .map((part) => String(part.text || ''))
    .join('\n')
    .trim()
}

const generateStack: RequestHandler = async (req, res, next) => {
  try {
    if (!GEMINI_API_KEY) {
      fail(next, 500, 'GEMINI_API_KEY is not configured')
      return
    }

    const uploadedFiles = ((req as any).files ?? []) as UploadedFile[]
    const pastedText = String(req.body.pastedText || '').trim()

    if (uploadedFiles.length === 0 && !pastedText) {
      fail(next, 400, 'Provide a file or paste text to generate cards from')
      return
    }

    for (const uploadedFile of uploadedFiles) {
      const mimeType = String(uploadedFile.mimetype || '').trim()
      if (!mimeType) {
        fail(next, 400, 'File mime type is required')
        return
      }
      const isAllowedType = mimeType.startsWith('image/') || allowedMimeTypes.includes(mimeType)
      if (!isAllowedType) {
        fail(next, 400, 'Unsupported file type. Upload a PDF, image, or text file.')
        return
      }
    }

    const rawCardCount = String(req.body.cardCount || '').trim().toLowerCase()
    const isAutoCardCount = rawCardCount === 'auto'
    const numericCardCount = Number(rawCardCount)

    if (!isAutoCardCount && (!Number.isInteger(numericCardCount) || numericCardCount < 1 || numericCardCount > 100)) {
      fail(next, 400, 'cardCount must be an integer between 1 and 100, or "auto"')
      return
    }

    const validationError = await joi.validate(
      {
        notes: joi.instance.string().allow('').max(2000).optional().default(''),
        pastedText: joi.instance.string().allow('').max(50000).optional().default(''),
      },
      {
        notes: String(req.body.notes || ''),
        pastedText,
      }
    )

    if (validationError) {
      next(validationError)
      return
    }

    const cardCount = isAutoCardCount ? null : numericCardCount
    const notes = String(req.body.notes || '').trim()
    const fileDataList: FileData[] = uploadedFiles.map((f) => ({
      mimeType: String(f.mimetype || '').trim(),
      base64: f.buffer.toString('base64'),
    }))

    const systemPrompt = [
      'You generate flashcards from user-provided material.',
      'Output only raw comma-separated lines in this exact format: term,definition.',
      'Rules:',
      '- One card per line.',
      '- No headers.',
      '- No blank lines.',
      '- No numbering or bullet points.',
      '- Do not include commas inside terms.',
      '- Do not include commas inside definitions.',
      '- Keep terms concise and definitions clear.',
    ].join('\n')

    const userText = [
      cardCount === null
        ? 'Generate an appropriate number of flashcards based on the provided material. Choose a count that covers key concepts without redundancy.'
        : `Generate exactly ${cardCount} flashcards from the provided material.`,
      ...(pastedText ? [`\n\nPasted text:\n${pastedText}`] : []),
      ...(notes ? [`Additional notes from user: ${notes}`] : []),
    ].join('\n')

    const modelName = normalizeModelName(GEMINI_MODEL)
    let outputText = ''

    try {
      outputText = await generateWithModel(modelName, systemPrompt, userText, fileDataList)
    } catch (error) {
      fail(
        next,
        502,
        `Gemini generateContent failed for model ${modelName}`,
        error instanceof Error ? error.message : String(error || '')
      )
      return
    }

    if (!outputText) {
      fail(next, 502, 'AI did not return any card content')
      return
    }

    res.status(200).type('text/plain').send(outputText)
  } catch (error) {
    next(error)
  }
}

export default generateStack
