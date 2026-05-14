import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Bot, ArrowRight, HeartHandshake, Zap, MessageCircle, Loader2 } from "lucide-react";
import { api } from "../api";
import { getUserId } from "../storage";

interface Message {
  id: string;
  speaker: string;
  content: string;
  timestamp: string;
}

const STATUS_TIPS = [
  "正在加载双方人格画像...",
  "正在模拟初次见面场景...",
  "智能体正在破冰寒暄...",
  "双方价值观数据比对中...",
  "正在寻找共同话题...",
  "智能体即将开始对谈...",
];

function TypingDots({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm">
      <span>{label}</span>
      <span className="inline-flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
    </div>
  );
}

export function MatchingPage() {
  const navigate = useNavigate();
  const uid = getUserId();
  const matchId = sessionStorage.getItem("match_id") || "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [done, setDone] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [showConnecting, setShowConnecting] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Rotate status tips
  useEffect(() => {
    if (messages.length > 0) return;
    const timer = setInterval(() => {
      setTipIndex((i) => (i + 1) % STATUS_TIPS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [messages.length]);

  // Hide connecting animation once messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setShowConnecting(false);
    }
  }, [messages.length]);

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

  const isWaiting = messages.length === 0 && !done;

  return (
    <div className="h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm px-6 py-4 flex items-center justify-between border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center ${isWaiting ? "animate-pulse" : ""}`}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            {isWaiting && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-ping" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">智能体对话中</h2>
            <p className="text-xs text-purple-500">匹配 ID: {matchId.slice(-12)}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 uppercase tracking-wide">对话轮数</div>
          <div className="text-2xl font-bold text-purple-600 tabular-nums">{currentRound}</div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <div ref={chatContainerRef} className="h-full overflow-y-auto px-4 py-6 space-y-4">

          {/* Waiting / connecting state */}
          {isWaiting && (
            <div className="flex flex-col items-center justify-center h-full gap-8 px-4">
              {/* Two agents facing each other */}
              <div className="flex items-center gap-6">
                {/* My agent */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 animate-float-left">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">我方智能体</span>
                </div>

                {/* Connection */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 200}ms` }}
                      />
                    ))}
                  </div>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-blue-300 via-purple-400 to-pink-300 rounded-full" />
                  <HeartHandshake className="w-5 h-5 text-purple-400 animate-pulse" />
                  <span className="text-[10px] text-purple-400 font-medium">正在撮合</span>
                </div>

                {/* Partner agent */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200 animate-float-right">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <span className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">对方智能体</span>
                </div>
              </div>

              {/* Status text with rotating tips */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                  <span className="text-sm text-purple-600 font-medium transition-opacity duration-500">
                    {STATUS_TIPS[tipIndex]}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-64 mx-auto">
                  <div className="h-1 bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-progress-indeterminate" />
                  </div>
                </div>

                {/* Decorative tags */}
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="text-[10px] text-purple-400 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">人格匹配</span>
                  <span className="text-[10px] text-pink-400 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">三观比对</span>
                  <span className="text-[10px] text-blue-400 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">智能破冰</span>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => {
            const isA = msg.speaker === "agent_a";
            const isLatest = idx === messages.length - 1;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isA ? "justify-start" : "justify-end"} animate-message-in`}
                style={{ animationDelay: `${Math.min(idx, 5) * 50}ms` }}
              >
                {isA && (
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className={`max-w-md ${isA ? "order-2" : "order-1"}`}>
                  <div className={`text-xs mb-1 ${isA ? "text-left text-gray-500" : "text-right text-gray-500"}`}>
                    {isA ? "我方智能体" : "对方智能体"}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl ${
                    isA
                      ? "bg-blue-500 text-white rounded-tl-none"
                      : "bg-white text-gray-900 shadow-md rounded-tr-none"
                  } ${isLatest && !done ? "ring-2 ring-purple-200 ring-offset-1" : ""}`}>
                    <p className="leading-relaxed">{msg.content}</p>
                    <div className={`text-xs mt-2 ${isA ? "text-blue-100" : "text-gray-400"}`}>{msg.timestamp}</div>
                  </div>
                </div>
                {!isA && (
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center shadow-sm">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator after last message when still in progress */}
          {messages.length > 0 && !done && (
            <div className="flex justify-center py-2">
              <TypingDots label="智能体正在输入" />
            </div>
          )}

          {/* Waiting indicator when no messages yet but past the initial connecting phase */}
          {!isWaiting && messages.length === 0 && !done && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <MessageCircle className="w-10 h-10 text-purple-300 animate-pulse" />
              <TypingDots label="等待消息" />
            </div>
          )}

          {/* Bottom padding so last message doesn't sit at the very bottom */}
          <div className="h-4" />
        </div>
      </div>

      {/* Live status bar during active conversation */}
      {messages.length > 0 && !done && (
        <div className="bg-white/90 backdrop-blur-sm border-t border-purple-100 px-6 py-3">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-medium text-red-500 uppercase tracking-wide">直播中</span>
            </div>

            {/* Round progress */}
            <div className="flex items-center gap-3 flex-1 max-w-xs mx-6">
              <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
                第 {currentRound}/30 轮
              </span>
              <div className="flex-1 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((currentRound / 30) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Right: decorative sparkles */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-pulse"
                  style={{ animationDelay: `${i * 300}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Topic hints */}
          <div className="flex justify-center gap-2 mt-2.5">
            {["个性磨合", "三观探索", "生活习惯", "未来规划"].map((tag, i) => (
              <span
                key={tag}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-opacity duration-500 ${
                  Math.floor(currentRound / 7.5) % 4 === i
                    ? "bg-purple-100 text-purple-600 border-purple-300 opacity-100"
                    : "bg-gray-50 text-gray-400 border-gray-200 opacity-50"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar — done states */}
      {done && rejected && (
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex flex-col items-center gap-3 animate-in slide-in-from-bottom">
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
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-center gap-4 animate-in slide-in-from-bottom">
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
