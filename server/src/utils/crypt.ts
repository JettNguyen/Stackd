import bcrypt from 'bcrypt'

class Crypt {
  instance: typeof bcrypt = bcrypt

  async hash(value: string) {
    const salt = await this.instance.genSalt(10)
    const hash = await this.instance.hash(value, salt)

    return hash
  }

  async validate(value: string, hash: string) {
    return await this.instance.compare(value, hash)
  }
}

export default new Crypt()
