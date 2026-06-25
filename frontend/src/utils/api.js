const api = {
  async get(url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  },

  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  },

  async del(url) {
    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  },

  async upload(file, params = {}) {
    const formData = new FormData()
    formData.append('file', file)

    const query = new URLSearchParams(params).toString()
    const url = query ? `/upload?${query}` : '/upload'

    const res = await fetch(url, {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Upload failed: ${res.status}`)
    }

    return res.json()
  }
}

export default api
