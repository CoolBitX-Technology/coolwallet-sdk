import axios from 'axios';

function createAxiosInstance(baseURL: string) {
  return axios.create({
    baseURL,
    method: 'POST',
    responseType: 'arraybuffer',
  });
}

export { createAxiosInstance };
