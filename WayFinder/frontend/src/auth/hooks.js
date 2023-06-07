import {useState, useEffect} from "react"

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const baseURL = process.env.REACT_APP_BASE_URL

  useEffect(() => {
    fetch(`${baseURL}/api/user`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },})
    .then((response) => response.json())
    .then((data) => {
      setCurrentUser(data)
      setIsLoading(false)
    })
  }, [])

  return {currentUser, isLoading}
}