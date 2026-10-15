import { AppConfig } from '../config/app-config.js';

export class ApiClient {
  constructor(baseUrl = AppConfig.API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    };

    const config = {
      ...options,
      headers,
      credentials: 'include' // Send session cookie
    };

    if (config.body && !(config.body instanceof FormData) && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(url, config);

      // Handle file download
      if (options.responseType === 'blob') {
        if (!res.ok) throw new Error(`Download failed with status ${res.status}`);
        return await res.blob();
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const error = new Error(data.message || `Request failed with status ${res.status}`);
        error.status = res.status;
        error.data = data;
        throw error;
      }

      return data.data !== undefined ? data.data : data;
    } catch (err) {
      if (err.status === 401 && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html') && window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html')) {
        // Redirect to login if unauthorized
        window.location.href = '/login.html';
      }
      throw err;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  upload(endpoint, formData, onProgress) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.withCredentials = true;

      if (xhr.upload && typeof onProgress === 'function') {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText || '{}');
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data.data !== undefined ? data.data : data);
          } else {
            const error = new Error(data.message || `Upload failed with status ${xhr.status}`);
            error.status = xhr.status;
            error.data = data;
            reject(error);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  }
}

export const api = new ApiClient();
