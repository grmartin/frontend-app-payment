export default class BaseError extends Error {
  constructor(innerError) {
    super();
    this.m_innerError = innerError;
  }

  get innerError() {
    return this.m_innerError;
  }
}
