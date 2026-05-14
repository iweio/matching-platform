const UID_PATTERN = /^user_\d{13}_[0-9a-f]{8}$/;

export function getUserId(): string {
  const v = sessionStorage.getItem("user_id");
  if (v && UID_PATTERN.test(v)) return v;
  return "";
}


export function getToken(): string {
  const v = sessionStorage.getItem("auth_token");
  if (v && v.length > 20) return v;
  return "";
}

export function clearSession(): void {
  sessionStorage.removeItem("user_id");
  sessionStorage.removeItem("agent_id");
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("match_id");
  sessionStorage.removeItem("distill_speak");
  sessionStorage.removeItem("distill_char");
  sessionStorage.removeItem("distill_love");
  sessionStorage.removeItem("distill_values");
  sessionStorage.removeItem("distill_taboo");
}
