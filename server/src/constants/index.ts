import dotenv from 'dotenv'
import path from 'path'

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
})

const ORIGIN = '*'
const PORT = process.env.PORT || 8080

// For "MongoDB Atlas": edit MONGO_URI in -> .env file
// For "MongoDB Community Server": edit <DB_NAME> in -> MONGO_URI below
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/<DB_NAME>'
const MONGO_OPTIONS = {}

const JWT_SECRET = process.env.JWT_SECRET || 'unsafe_secret'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

const BREVO_API_KEY = process.env.BREVO_API_KEY || ''
const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email'
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || ''
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Stackd'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

export {
  ORIGIN,
  PORT,
  MONGO_URI,
  MONGO_OPTIONS,
  JWT_SECRET,
  GEMINI_API_KEY,
  BREVO_API_KEY,
  BREVO_API_URL,
  BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME,
  APP_URL,
}
