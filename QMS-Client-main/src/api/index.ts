import axios, { AxiosError, AxiosInstance } from 'axios';


const $host = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const $authHost = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});


const authInterceptor = (config: any) => {
  const token = localStorage.getItem('token');

  if (token && token !== "undefined" && token !== "null") {
    config.headers.authorization = `Bearer ${token}`;
  }
  return config;
};

$authHost.interceptors.request.use(authInterceptor);

const MAX_RETRIES = 1;

function addRateLimitRetry(instance: AxiosInstance) {
  instance.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as any;
    if (
      error.response?.status === 429 &&
      config &&
      (config._retryCount ?? 0) < MAX_RETRIES
    ) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      const retryAfter = Number(error.response.headers['retry-after']) || 2;
      const delayMs = Math.min(retryAfter * 1000, 10000);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return instance.request(config);
    }
    return Promise.reject(error);
  });
}

addRateLimitRetry($host);
addRateLimitRetry($authHost);

export {
  $host,
  $authHost,
};
