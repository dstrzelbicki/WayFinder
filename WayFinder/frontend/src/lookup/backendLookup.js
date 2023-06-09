function getCookie(name) {
  let cookieValue = null
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";")
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === (name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

function backendLookup(method, endpoint, callback, data) {
  let jsonData
  if (data) {
    jsonData = JSON.stringify(data)
  }
  const xhr = new XMLHttpRequest()
  const url = `${process.env.REACT_APP_BASE_URL}/api${endpoint}`
  xhr.responseType = "json"
  const csrftoken = getCookie("csrftoken")
  xhr.open(method, url)
  xhr.setRequestHeader("Content-Type", "application/json")
  if (csrftoken) {
    xhr.setRequestHeader("X-CSRFToken", csrftoken)
  }
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
  xhr.setRequestHeader("Authorization", `Token ${sessionStorage.getItem("token")}`)
  xhr.withCredentials = true
  xhr.onload = function() {
    if (xhr.status === 403) {
      const detail = xhr.response.detail
      if (detail === "Authentication credentials were not provided.") {
        if (window.location.href.indexOf("login") === -1) {
          window.location.href = "/login?showLoginRequired=true"
        }
      }
    }
    callback(xhr.response, xhr.status)
  }
  xhr.onerror = function(e) {
    console.log(e)
    callback({"message": "An error occurred."}, 400)
  }
  xhr.send(jsonData)
}

export function apiProfileDataChange(user, callback) {
  const data = {
    username: user.username,
    email: user.email,
    // first_name: user.first_name,
    // last_name: user.last_name
  }
  backendLookup("PUT", "/user", callback, data)
}

export function apiPasswordChange(passwords, callback) {
  backendLookup("PUT", "/change-password", callback, passwords)
}

export function apiUserRoutes(callback) {
  backendLookup("GET", "/route", callback)
}

export function apiProfileData(callback) {
  backendLookup("GET", "/user", callback)
}