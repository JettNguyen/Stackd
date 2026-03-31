import joi from 'joi'

class Joi {
  instance: typeof joi = joi

  async validate(schema: Record<string, any>, body: Record<string, any>) {
    try {
      await this.instance.object(schema).unknown(true).validateAsync(body)
    } catch (error: any) {
      return {
        statusCode: 400,
        message: error.message,
      }
    }
  }
}

export default new Joi()
