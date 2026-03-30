import mongoose from 'mongoose'
import { MONGO_URI, MONGO_OPTIONS } from '../constants/index'

class Mongo {
  instance: typeof mongoose = mongoose

  async connect() {
    if (this.instance.connection.readyState === 1) return

    try {
      console.log('⏳ Connecting to MongoDB')

      await this.instance.connect(MONGO_URI, MONGO_OPTIONS)
      const connection = this.instance.connection

      if (connection.readyState === 1) console.log('✅ MongoDB connected')

      connection.on('disconnected', () => console.log('❌ MongoDB disconnected'))
      connection.on('error', (error) => console.log('❌ MongoDB connection error', error))
    } catch (error: any) {
      console.log('❌ MongoDB connection error:', error.message)
    }
  }
}

export default new Mongo()
