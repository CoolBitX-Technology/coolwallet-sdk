import axios from 'axios';
import type { AxiosInstance } from 'axios';

function createAxiosInstance(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    method: 'POST',
    responseType: 'arraybuffer',
  });
}

export { createAxiosInstance };
