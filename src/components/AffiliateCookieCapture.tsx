import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { setAffiliateCookie } from "@/hooks/useAffiliate";

/**
 * Captures ?ref=BOSSXXXX from URL and stores it in a 7-day cookie.
 * Mount once at the app root.
 */
const AffiliateCookieCapture = () => {
  const [params] = useSearchParams();

  useEffect(() => {
    const ref = params.get("ref");
    if (ref && /^BOSS[0-9]{4,}$/i.test(ref)) {
      setAffiliateCookie(ref.toUpperCase());
    }
  }, [params]);

  return null;
};

export default AffiliateCookieCapture;
