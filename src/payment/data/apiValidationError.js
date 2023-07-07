import BaseError from './baseError';

export default class ApiValidationError extends BaseError {
  constructor(innerError, errors) {
    super(innerError);
    this.m_errors = errors;
  }

  get errors() {
    return this.m_errors;
  }
}
