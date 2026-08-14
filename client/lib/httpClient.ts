import axios from 'axios';
import axiosRetry, { exponentialDelay } from 'axios-retry';
import logger from './logger';

const httpClient = axios.create({
  timeout: 30000, // 30 seconds
});

// Configure retry logic
axiosRetry(httpClient as any, {
  retries: 3,
  retryDelay: (retryCount) => {
    logger.debug({ retryCount }, 'Retrying HTTP request...');
    return exponentialDelay(retryCount);
  },
  retryCondition: (error) => {
    // Retry on network errors or 5xx status codes
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response ? error.response.status >= 500 : false)
    );
  },
});

export default httpClient;
