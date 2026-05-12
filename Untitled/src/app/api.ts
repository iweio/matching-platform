const BASE_URL = "/api";
import { getToken } from "./storage";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
    ...options,
  });
  const json = await res.json();
  if (json.code !== 200) {
    throw new Error(json.msg || "request failed");
  }
  return json.data as T;
}

function get(path: string) {
  return request(path);
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

type AuthData = { userId: string; agentId: string; token: string; nick: string; distillStatus: number };

export const api = {
  register: (body: { phone: string; nick: string; password: string; gender?: number; age?: number }) =>
    post<AuthData>("/auth/register", body),

  login: (body: { phone: string; password: string }) =>
    post<AuthData>("/auth/login", body),

  getMe: () =>
    get<AuthData>("/auth/me"),

  createUser: (body: { phone: string; nick: string; gender: number; age: number }) =>
    post<{ user_id: string; agent_id: string }>("/agent/init", body),

  getUser: (userId: string) =>
    get<{
      user_id: string; phone: string; nick: string; gender: number;
      age: number; agent_id: string; distill_status: number;
      model_version: string; avatar: string; height: number;
      education: string; occupation: string; province_code: string;
      city_code: string;
    }>(`/user/me?user_id=${userId}`),

  distill: (body: {
    speak_style: string; character: string;
    love_style: string; values_view: object; taboo: object;
  }) => post<{ distill_status: number }>("/user/distill", body),

  modelRefresh: (body: {
    user_id: string; agent_id: string; speak_style: string;
    character: string; love_style: string; values_view: object; taboo: object;
  }) =>
    post<{ model_version: string; status: string }>("/agent/algo/model-refresh", body),

  startMatch: (userId: string) =>
    post<{ match_id: string; partner_id: string }>("/match/start", { user_id: userId }),

  getProgress: (matchId: string, userId: string) =>
    get<{ match_id: string; status: number; chat_round: number; partner_id: string }>(
      `/match/progress?match_id=${matchId}&user_id=${userId}`
    ),

  getChatRecord: (matchId: string, sinceId?: string) => {
    const url = sinceId
      ? `/match/chat-record?match_id=${matchId}&since_id=${sinceId}`
      : `/match/chat-record?match_id=${matchId}`;
    return get<{ records: { id: string; speaker: string; content: string; timestamp: string }[]; has_more: boolean }>(url);
  },

  getReport: (matchId: string, userId: string) =>
    get<{
      score: number; dimensions: { name: string; score: number }[];
      advantage: string; risk: string; suggest: string;
    }>(`/match/report?match_id=${matchId}&user_id=${userId}`),

  unlock: (matchId: string, userId: string, operation: string) =>
    post<{ status: number; a_op: string; b_op: string; unlock_flag: number }>(
      "/match/unlock", { match_id: matchId, user_id: userId, operation }
    ),

  sendMessage: (matchId: string, senderId: string, content: string) =>
    post<{ message_id: string }>("/chat/send", {
      match_id: matchId, sender_id: senderId, content,
    }),

  getMessages: (matchId: string, userId: string) =>
    get<{
      messages: { message_id: string; sender_id: string; content: string; created_at: string }[];
      page: number; total: number;
    }>(`/chat/list?match_id=${matchId}&user_id=${userId}`),

  getConversations: () =>
    get<{
      matchId: string; partnerUserId: string; partnerNick: string;
      partnerGender: number; lastMessage: string; lastTime: string; unlockFlag: number;
    }[]>("/user/conversations"),

  getHistory: (userId: string) =>
    get<{
      match_id: string; partner_id: string; partner_nick: string; status: number;
      a_op: string; b_op: string; unlock_flag: number; chat_round: number;
      create_time: string; score: number; advantage: string;
    }[]>(`/match/history?user_id=${userId}`),
};
