import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Bot, ArrowRight } from "lucide-react";
import { api } from "../api";
import { getUserId } from "../storage";

interface Message {
  id: string;
  speaker: string;
  content: string;
  timestamp: string;
}

export function MatchingPage() {
  const navigate = useNavigate();
  const uid = getUserId();
  const matchId = sessionStorage.getItem("match_id") || "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [done, setDone] = useState(false);
  const [rejected, setRejected] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!uid || !matchId) { navigate("/match", { replace: true }); return; }

    const known = new Set<string>();

    const es = new EventSource(
      `/api/match/chat-stream?match_id=${encodeURIComponent(matchId)}&user_id=${encodeURIComponent(uid)}`
    );

    es.addEventListener("message", (e) => {
      try {
        const msg: Message = JSON.parse(e.data);
        if (known.has(msg.id)) return;
        known.add(msg.id);
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setCurrentRound((r) => r + 1);
      } catch {}
    });

    es.addEventListener("done", (e) => {
      es.close();
      try {
        const data = JSON.parse((e as MessageEvent).data);
        if (data === "rejected") {
          setRejected(true);
        }
      } catch {}
      setDone(true);
    });

    es.addEventListener("error", () => {
      // If no messages arrived via SSE after 10s, try REST fallback
      setTimeout(() => {
        if (known.size === 0) {
          api.getChatRecord(matchId).then((r) => {
            const items: Message[] = (r.records || []).map((rec: any) => ({
              id: rec.id,
              speaker: rec.speaker,
              content: rec.content,
              timestamp: rec.timestamp,
            }));
            if (items.length > 0) {
              setMessages(items);
              setCurrentRound(items.length);
              setDone(true);
            }
          }).catch(() => {});
        }
      }, 10000);
      setTimeout(() => es.close(), 120_000);
    });

    return () => es.close();
  }, [uid, matchId, navigate]);

  // REST fallback: if SSE doesn't connect, poll for chat records
  useEffect(() => {
    if (!uid || !matchId) return;
    let stop = false;
    const poll = async () => {
      if (stop) return;
      try {
        const r = await api.getChatRecord(matchId);
        if (r.records && r.records.length > 0) {
          setMessages(
            r.records.map((rec: any) => ({
              id: rec.id,
              speaker: rec.speaker,
              content: rec.content,
              timestamp: rec.timestamp,
            }))
          );
          setCurrentRound(r.records.length);
          const prog = await api.getProgress(matchId, uid);
          if ((prog as any).status >= 2) {
            if ((prog as any).status === 4) setRejected(true);
            setDone(true);
            stop = true;
            return;
          }
        }
      } catch {}
      if (!stop) setTimeout(poll, 3000);
    };
    poll();
    return () => { stop = true; };
  }, [uid, matchId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex flex-col">
      <div className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">智能体对话中</h2>
          <p className="text-sm text-gray-500">匹配 ID: {matchId}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">当前轮数</div>
          <div className="text-2xl font-bold text-purple-600">{currentRound}</div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div ref={chatContainerRef} className="h-full overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 pt-20">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>等待智能体开始对话...</p>
            </div>
          )}

          {messages.map((msg) => {
            const isA = msg.speaker === "agent_a";
            return (
              <div key={msg.id} className={`flex gap-3 ${isA ? "justify-start" : "justify-end"}`}>
                {isA && (
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className={`max-w-md ${isA ? "order-2" : "order-1"}`}>
                  <div className={`text-xs mb-1 ${isA ? "text-left text-gray-500" : "text-right text-gray-500"}`}>
                    {isA ? "我方智能体" : "对方智能体"}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl ${isA ? "bg-blue-500 text-white rounded-tl-none" : "bg-white text-gray-900 shadow-md rounded-tr-none"}`}>
                    <p className="leading-relaxed">{msg.content}</p>
                    <div className={`text-xs mt-2 ${isA ? "text-blue-100" : "text-gray-400"}`}>{msg.timestamp}</div>
                  </div>
                </div>
                {!isA && (
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {done && rejected && (
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex flex-col items-center gap-3">
          <p className="text-red-600 font-medium">对方已拒绝该匹配</p>
          <p className="text-sm text-gray-500">很遗憾，双方未能达成共识。您可以返回重新发起匹配。</p>
          <button
            onClick={() => navigate("/match", { replace: true })}
            className="inline-flex items-center gap-2 bg-gray-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-600 transition-all"
          >
            返回匹配
          </button>
        </div>
      )}
      {done && !rejected && (
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-center gap-4">
          <p className="text-green-600 font-medium">智能体对话已完成</p>
          <button
            onClick={() => navigate("/report", { replace: true })}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            查看报告 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
