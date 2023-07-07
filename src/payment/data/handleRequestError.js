import { logError, logInfo } from '@edx/frontend-platform/logging';
import { camelCaseObject } from './utils';
import { ERROR_CODES } from '../../feedback/data/constants';
import ApiValidationError from './apiValidationError';
import FieldValidationError from './fieldValidationError';
import ApiMessageError from './apiMessageError';

/**
 * @class RequestError
 *
 * @property {AxiosResponse} [response]
 * @property {string?} [code]
 * @property {string?} [type]
 *
 * @extends Error
 */
/**
 * @typedef ApiErrorMessage
 *
 * @property {string?} [error_code]
 * @property {string?} [user_message]
 * @property {string?} [message_type]
 *
 */

function generateFieldErrors(errors, inner) {
  const fieldErrors = Object.entries(errors).map(([name, value]) => ({
    code: value.error_code ? value.error_code : null,
    userMessage: value.user_message,
    fieldName: name,
  }));

  return new FieldValidationError(inner, fieldErrors);
}

/**
 * Process API Errors and Generate an Error Object
 * @param {ApiErrorMessage[]} errors
 */
function generateApiError(errors, inner) {
  const apiErrors = errors.map(err => ({
    code: err.error_code ? err.error_code : null,
    userMessage: err.user_message ? err.user_message : null,
    messageType: err.message_type ? err.message_type : null,
  }));

  return new ApiValidationError(inner, apiErrors);
}

function generateApiMessageError(messages, inner) {
  return new ApiMessageError(inner, camelCaseObject(messages));
}

/**
 * Generate a simple, single error ApiValidationError
 * @param code The Error Code
 * @param message The Message
 * @param innerError The baseline error
 * @returns {ApiValidationError}
 */
export function generateError(code, message, innerError) {
  return generateApiError([
    {
      error_code: code,
      user_message: message,
    },
  ], innerError);
}

/**
 * Processes and re-throws request errors.  If the response contains a field_errors field, will
 * massage the data into a form expected by the client.
 *
 * If the response contains a single API error, will similarly format that for the client.
 *
 * Field errors will be packaged with a fieldErrors field usable by the client.
 *
 * @param {RequestError|Error|AxiosError} error The original error object.
 */
export default function handleRequestError(error) {
  // Validation errors
  if (error.response && error.response.data.field_errors) {
    logInfo('Field Errors', error.response.data.field_errors);
    return generateFieldErrors(error.response.data.field_errors, error);
  }

  // API errors
  if (error.response && error.response.data.errors !== undefined) {
    logInfo('API Errors', error.response.data.errors);
    return generateApiError(error.response.data.errors, error);
  }

  // API messages
  if (error.response && error.response.data.messages !== undefined) {
    logInfo('API Messages', error.response.data.messages);
    return generateApiMessageError(error.response.data.messages, error);
  }

  // Single API error
  if (error.response && error.response.data.error_code) {
    logInfo('API Error', error.response.data.error_code);
    return generateError(
      error.response.data.error_code,
      error.response.data.user_message,
      error,
    );
  }

  // SKU mismatch error
  if (error.response && error.response.data.sku_error) {
    logInfo('SKU Error', error.response.data.sku_error);
    return generateError(
      ERROR_CODES.BASKET_CHANGED,
      'error',
      error,
    );
  }

  // Basket already purchased
  if (error.code === 'payment_intent_unexpected_state' && error.type === 'invalid_request_error') {
    logInfo('Basket Changed Error', error.code);
    return generateError(
      ERROR_CODES.BASKET_CHANGED,
      'error',
      error,
    );
  }

  // Other errors
  logError(error);
  return error;
}

/**
 * Processes API errors and converts them to error objects the sagas can use.
 * @param requestError
 * @throws
 */
export function handleApiError(requestError) {
  throw handleRequestError(requestError);
}
