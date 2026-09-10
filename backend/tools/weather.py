"""Live Weather Tool using public meteorological endpoints."""

from typing import Dict, Any
import httpx
from backend.tools.base import BaseTool


class WeatherTool(BaseTool):
    name = "weather"
    description = "Get current weather conditions and temperature for any city or location."
    parameters = {
        "location": {
            "type": "string",
            "description": "City or location name (e.g. 'San Francisco', 'London', 'Tokyo', 'Mumbai')",
            "required": True,
        }
    }
    requires_confirmation = False

    async def execute(self, arguments: Any) -> str:
        if isinstance(arguments, str):
            location = arguments.strip()
        elif isinstance(arguments, dict):
            location = str(
                arguments.get("location")
                or arguments.get("city")
                or arguments.get("place")
                or arguments.get("query")
                or ""
            ).strip()
        else:
            location = str(arguments).strip()

        if not location:
            return "Error: Location cannot be empty."

        headers = {"User-Agent": "FRIDAY-Agent/2.0"}
        try:
            async with httpx.AsyncClient(headers=headers, timeout=6.0, follow_redirects=True) as client:
                # 1. Geocode location via Open-Meteo geocoding API
                geo_resp = await client.get(
                    "https://geocoding-api.open-meteo.com/v1/search",
                    params={"name": location, "count": 1, "language": "en", "format": "json"},
                )
                geo_data = geo_resp.json()

                if not geo_data.get("results"):
                    return f"Could not locate '{location}'. Please specify a valid city."

                res = geo_data["results"][0]
                lat = res["latitude"]
                lon = res["longitude"]
                city_name = res.get("name", location)
                country = res.get("country", "")

                # 2. Fetch current weather
                w_resp = await client.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m",
                        "timezone": "auto",
                    },
                )
                w_data = w_resp.json()

            current = w_data.get("current", {})
            temp = current.get("temperature_2m", "N/A")
            apparent = current.get("apparent_temperature", "N/A")
            humidity = current.get("relative_humidity_2m", "N/A")
            wind = current.get("wind_speed_10m", "N/A")

            return (
                f"Weather for {city_name}, {country}:\n"
                f"- Temperature: {temp}°C (Feels like {apparent}°C)\n"
                f"- Humidity: {humidity}%\n"
                f"- Wind Speed: {wind} km/h"
            )
        except Exception as e:
            return f"Weather service error: {str(e)}"

