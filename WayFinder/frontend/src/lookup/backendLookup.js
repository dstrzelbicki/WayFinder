import axios from 'axios'

const requestToBackend = (method, endpoint, callback, data) => {
  const url = `${process.env.REACT_APP_BASE_URL}/api${endpoint}`
  const accessToken = sessionStorage.getItem('accessToken')

  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  axios({
    method: method,
    url: url,
    data: data,
    headers: headers,
    withCredentials: true
  })
  .then(response => {
    callback(response.data, response.status)
  })
  .catch(error => {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      if (status === 401) {
        // handle expired access token
        const refreshToken = sessionStorage.getItem('refreshToken')
        if (refreshToken) {
          refreshAccessToken(refreshToken, method, endpoint, callback, data)
        } else {
          redirectToLogin()
        }
      } else {
        callback(data, status)
      }
    } else {
      callback({'message': 'An error occurred'}, error.response.status)
    }
  })
}

function refreshAccessToken(refreshToken, originalMethod, originalEndpoint, originalCallback, originalData) {
  const refreshUrl = `${process.env.REACT_APP_BASE_URL}/api/token/refresh/`
  fetch(refreshUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
    sessionStorage.setItem('refreshToken', data.refresh)
    sessionStorage.setItem('accessToken', data.access)
    // retry the original request with the new access token
    requestToBackend(originalMethod, originalEndpoint, originalCallback, originalData)
  })
  .catch(() => {
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
  requestToBackend("PUT", "/user", callback, data)
}

export function apiPasswordChange(passwords, callback) {
  requestToBackend("PUT", "/change-password", callback, passwords)
}

export function apiUserRoutes(callback) {
  requestToBackend("GET", "/route", callback)
}

export function apiProfileData(callback) {
  requestToBackend("GET", "/user", callback)
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

  requestToBackend("POST", "/route", callback, routeData)
}

export function apiSetupTOTP(callback) {
  requestToBackend("GET", "/setup-totp/", callback)
}

export function apiVerifyTOTP(otp, action, callback) {
  const data = {
    otp: otp,
    action: action
  }
  requestToBackend("POST", "/verify-totp/", callback, data)
}

export function apiDisableTOTP(callback) {
  requestToBackend("POST", "/disable-totp/", callback)
}

export function apiVerifyRecoveryCode(recoveryCode, email, callback) {
  const data = {
    recovery_code: recoveryCode,
    email: email
  }
  requestToBackend("POST", "/use-recovery-code/", callback, data)
}

export function apiPostSearchedLocation(data, callback) {
  requestToBackend("POST", "/location", callback, data)
}

export function apiGetSearchedLocations(callback) {
  requestToBackend("GET", "/location", callback)
}

export function apiForgottenPassword(email, callback) {
  const data = {
    email: email
  }
  requestToBackend("POST", "/forgotten-password", callback, data)
}

export function apiPasswordReset(uidb64, token, password, callback) {
  const data = {
    uidb64: uidb64,
    token: token,
    password: password
  }
  requestToBackend("POST", "/password-reset", callback, data)
}

export function apiPostFavRoute(routeName, favRouteData, callback) {
  const data = {
    name: routeName,
    data: favRouteData
  }
  requestToBackend("POST", "/fav-route", callback, data)
}

export function apiGetFavRoutes(callback) {
  requestToBackend("GET", "/fav-route", callback)
}