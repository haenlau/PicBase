async function parseBody(res) {
  const text = await res.text()
  if (!text) return null

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(body, fallback) {
  if (!body) return fallback
  if (typeof body === 'string') return body
  if (typeof body.error === 'string') return body.error
  if (body.error?.message) return body.error.message
  if (body.message) return body.message
  return fallback
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    ...options
  })
  const body = await parseBody(res)

  if (!res.ok) {
    throw new Error(getErrorMessage(body, 'HTTP ' + res.status))
  }

  return body
}

const api = {
  get(url) {
    return request(url)
  },

  post(url, data) {
    return request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },

  put(url, data) {
    return request(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },

  del(url) {
    return request(url, {
      method: 'DELETE'
    })
  },

  upload(file, params) {
    const formData = new FormData()
    formData.append('file', file)

    let url = '/upload'
    if (params && Object.keys(params).length > 0) {
      const query = new URLSearchParams(params).toString()
      url = '/upload?' + query
    }

    return request(url, {
      method: 'POST',
      body: formData
    })
  }
}

export default api
