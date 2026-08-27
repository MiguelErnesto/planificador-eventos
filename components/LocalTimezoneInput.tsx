"use client";

import { useEffect, useState } from "react";
import { localTimeZone } from "@/lib/dates";

export function LocalTimezoneInput() {
  const [tz, setTz] = useState("");
  useEffect(() => {
    setTz(localTimeZone());
  }, []);
  return <input type="hidden" name="timezone" value={tz} />;
}
