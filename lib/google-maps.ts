"use server"

export async function getGoogleMapsApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY || ""
}
