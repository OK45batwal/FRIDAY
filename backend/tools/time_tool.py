"""Time and Date Information Tool."""

import time
from datetime import datetime
from typing import Dict, Any
from backend.tools.base import BaseTool


class TimeTool(BaseTool):
    name = "time"
    description = "Get the current time, date, day of the week, and timezone."
    parameters = {}
    requires_confirmation = False

    async def execute(self, arguments: Dict[str, Any]) -> str:
        now = datetime.now()
        date_str = now.strftime("%A, %B %d, %Y")
        time_str = now.strftime("%I:%M:%S %p")
        tz_str = time.tzname[time.daylight] if time.daylight else time.tzname[0]
        return f"Current Date & Time:\n- Date: {date_str}\n- Time: {time_str}\n- Timezone: {tz_str}"
