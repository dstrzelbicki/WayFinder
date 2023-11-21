function getToken(name) {
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
  const csrftoken = getToken("csrftoken")
  xhr.open(method, url)
  xhr.setRequestHeader("Content-Type", "application/json")
  if (csrftoken) {
    xhr.setRequestHeader("X-CSRFToken", csrftoken)
  }
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
  // xhr.setRequestHeader("Authorization", `Token ${sessionStorage.getItem("token")}`)
  const accessToken = sessionStorage.getItem("accessToken")
  if (accessToken) {
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`)
  }
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
    if (xhr.status === 401) {
      // handle expired access token

      // attempt to refresh access token
      const refreshToken = sessionStorage.getItem("refreshToken")
      if (refreshToken) {
        refreshAccessToken(refreshToken, method, endpoint, callback, data)
      } else {
        redirectToLogin()
      }
      return
    }
    callback(xhr.response, xhr.status)
  }
  xhr.onerror = function(e) {
    console.log(e)
    callback({"message": "An error occurred."}, 400)
  }
  xhr.send(jsonData)
}

function refreshAccessToken(refreshToken, originalMethod, originalEndpoint, originalCallback, originalData) {
  const refreshUrl = `${process.env.REACT_APP_BASE_URL}/api/token/refresh/`
  fetch(refreshUrl, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken })
  })
  .then(response => {
    if (response.ok) {
      return response.json()
    }
    throw new Error('Failed to refresh access token')
  })
  .then(data => {
    sessionStorage.setItem("accessToken", data.access)
    // retry the original request with the new access token
    backendLookup(originalMethod, originalEndpoint, originalCallback, originalData)
  })
  .catch(error => {
    console.error(error)
    redirectToLogin()
  })
}

function redirectToLogin() {
  sessionStorage.removeItem("accessToken")
  sessionStorage.removeItem("refreshToken")
  window.location.href = "/login?showLoginRequired=true"
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

export function apiPostRoute(callback) {
  const routeData = {
    start_location_name: sessionStorage.getItem("start"),
    start_location_lat: sessionStorage.getItem("startLat"),
    start_location_lng: sessionStorage.getItem("startLon"),
    end_location_name: sessionStorage.getItem("end"),
    end_location_lat: sessionStorage.getItem("endLat"),
    end_location_lng: sessionStorage.getItem("endLon"),
    distance: 0,
    duration: 0
  }

  backendLookup("POST", "/route", callback, routeData)
}

export function apiSetupTOTP(callback) {
  backendLookup("GET", "/setup-totp/", callback)
}

export function apiVerifyTOTP(otp, action, callback) {
  const data = {
    otp: otp,
    action: action
  }
  backendLookup("POST", "/verify-totp/", callback, data)
}

export function apiDisableTOTP(callback) {
  backendLookup("POST", "/disable-totp/", callback)
}

export function apiVerifyRecoveryCode(recoveryCode, email, callback) {
  const data = {
    recovery_code: recoveryCode,
    email: email
  }
  backendLookup("POST", "/use-recovery-code/", callback, data)
}

export function apiPostSearchedLocation(data, callback) {
  backendLookup("POST", "/location", callback, data)
}

export function apiGetSearchedLocations(callback) {
  backendLookup("GET", "/location", callback)
}