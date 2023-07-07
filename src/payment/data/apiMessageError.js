import BaseError from './baseError';

export default class ApiMessageError extends BaseError {
  constructor(innerError, messages) {
    super(innerError);
    this.m_messages = messages;
  }

  get messages() {
    return this.m_messages;
  }
}
