export class ErrorsGenerator {
  /** @type {string[]} */
  messages = []

  /**
   * @param {boolean} condition 
   * @param {string} message 
   */
  assert(condition, message) {
    if (!condition) {
      this.push(message)
    }

    return this
  }

  /**
   * @param {string[]} messages 
   */
  push(...messages) {
    this.messages.push(...messages)

    return this
  }

  get has_errors() {
    return this.messages.length > 0
  }

  /**
   * @param {{[key: string]: any}} others 
   */
  gen(others) {
    return {
      success: false,
      errors: this.messages,
      ...others,
    }
  }

  /**
   * @param {string[]} messages 
   * @param {{[key: string]: any}} others 
   */
  static gen(messages, others) {
    return new this().push(...messages).gen(others)
  }
}
