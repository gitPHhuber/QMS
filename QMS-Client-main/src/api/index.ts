import axios from 'axios';


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

$authHost.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (
      error.response?.status === 429 &&
      (!config._retryCount || config._retryCount < 2)
    ) {
      config._retryCount = (config._retryCount || 0) + 1;
      const retryAfter = error.response.headers['retry-after'];
      const delay = retryAfter
        ? parseInt(retryAfter) * 1000
        : 1000 * Math.pow(2, config._retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return $authHost(config);
    }
    return Promise.reject(error);
  }
);

export {
  $host,
  $authHost,
};
