import BaseError from './baseError';

export default class FieldValidationError extends BaseError {
  constructor(innerError, fieldErrors) {
    super(innerError);
    this.m_fieldErrors = fieldErrors;
  }

  get fieldErrors() {
    return this.m_fieldErrors;
  }
}
