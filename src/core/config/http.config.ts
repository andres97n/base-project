import {
  HTTP_DEFAULT_MAX_REDIRECTS,
  HTTP_DEFAULT_RETRY_ATTEMPTS,
  HTTP_DEFAULT_RETRY_BASE_DELAY,
  HTTP_DEFAULT_TIMEOUT,
} from 'src/common/constants';
import { HttpConfigInterface } from 'src/common/interfaces';

export const HttpConfiguration = (): HttpConfigInterface => ({
  httpTimeout: +(process.env.HTTP_TIMEOUT || HTTP_DEFAULT_TIMEOUT),
  httpMaxRedirects: +(
    process.env.HTTP_MAX_REDIRECTS || HTTP_DEFAULT_MAX_REDIRECTS
  ),
  httpRetryAttempts: +(
    process.env.HTTP_RETRY_ATTEMPTS || HTTP_DEFAULT_RETRY_ATTEMPTS
  ),
  httpRetryBaseDelay: +(
    process.env.HTTP_RETRY_BASE_DELAY || HTTP_DEFAULT_RETRY_BASE_DELAY
  ),
});
