import axios from 'axios'

const api = axios.create({
  baseURL: '/api',  // 相対パスでAPIアクセス
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
