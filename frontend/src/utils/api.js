const api = {
  async get(url) {
    const res = await fetch(url, {
      credentials: 'include'
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'HTTP ' + res.status)
    }
    return res.json()
  },

  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'HTTP ' + res.status)
    }
    return res.json()
  },

  async put(url, data) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'HTTP ' + res.status)
    }
    return res.json()
  },

  async del(url) {
    const res = await fetch(url, {
      method: 'DELETE',
      credentials: 'include'
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'HTTP ' + res.status)
    }
    return res.json()
  },

  async upload(file, params) {
    const formData = new FormData()
    formData.append('file', file)

    let url = '/upload'
    if (params && Object.keys(params).length > 0) {
      const query = new URLSearchParams(params).toString()
      url = '/upload?' + query
    }

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Upload failed: ' + res.status)
    }

    return res.json()
  }
}

export default api
