import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, Sparkles, History, ArrowRight, Loader2, X, Bot, Eye, Zap, Users, User } from "lucide-react";
import { api } from "../api";
import { getUserId } from "../storage";

export function MatchPage() {
  const navigate = useNavigate();
  const uid = getUserId();
  const [loading, setLoading] = useState(false);
  const [distillStatus, setDistillStatus] = useState<number>(-1);
  const [queued, setQueued] = useState(false);
  const [queueMsg, setQueueMsg] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [chatModal, setChatModal] = useState<{ open: boolean; matchId: string; messages: { id: string; speaker: string; content: string; timestamp: string }[] }>({ open: false, matchId: "", messages: [] });
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!uid) { navigate("/login", { replace: true }); return; }
    api.getUser(uid).then((u) => setDistillStatus(u.distill_status)).catch(() => setDistillStatus(-2));
    api.getHistory(uid).then(setHistory).catch(() => {});
  }, [uid, navigate]);

  const tryMatch = useCallback(async () => {
    if (!uid || cancelledRef.current) return;
    setLoading(true);
    try {
      const data = await api.startMatch(uid) as any;
      if (data.match_id) {
        sessionStorage.setItem("match_id", data.match_id);
        navigate("/matching");
        return;
      }
      if (data.queued) {
        setQueued(true);
        setQueueMsg(data.message || "暂无可匹配用户，系统将为您自动寻找");
        setRetryCount((c) => c + 1);
        if (!cancelledRef.current) {
          retryRef.current = setTimeout(tryMatch, 3000);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "发起匹配失败";
      alert("发起匹配失败: " + msg);
      setQueued(false);
    } finally {
      setLoading(false);
    }
  }, [uid, navigate]);

  const handleStartMatch = () => {
    cancelledRef.current = false;
    setQueued(true);
    setRetryCount(0);
    setQueueMsg("正在为您寻找合适的匹配对象...");
    if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null; }
    tryMatch();
  };

  const handleCancelMatch = () => {
    cancelledRef.current = true;
    setQueued(false);
    setRetryCount(0);
    if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null; }
  };

  const handleViewChatRecord = async (matchId: string) => {
    setChatModal({ open: true, matchId, messages: [] });
    try {
      const r = await api.getChatRecord(matchId);
      setChatModal({
        open: true, matchId,
        messages: (r.records || []).map((rec: any) => ({
          id: rec.id, speaker: rec.speaker, content: rec.content, timestamp: rec.timestamp,
        })),
      });
    } catch {
      setChatModal((prev) => ({ ...prev, messages: [] }));
    }
  };

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);

  const statusLabel = distillStatus === -1 ? "加载中..." : distillStatus === 1 ? "已完成" : "未完成";

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-10 w-40 h-40 bg-pink-200/20 rounded-full blur-3xl animate-float-left pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-purple-200/20 rounded-full blur-3xl animate-float-right pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Match card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-purple-100/50 p-8 mb-6 border border-white/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">发起匹配</h2>
              <p className="text-sm text-gray-500">让 AI 帮你找到合适的人</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 mb-6 border border-purple-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1.5">你的智能体已准备就绪</h3>
                <p className="text-gray-600 text-sm leading-relaxed">点击下方按钮开始匹配，系统将为你寻找最合适的另一半。双方智能体将进行深度对话，测试三观适配度。</p>
              </div>
            </div>
          </div>

          {distillStatus === -2 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-700">无法获取蒸馏状态，请刷新页面重试</p>
            </div>
          )}

          {distillStatus === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">尚未完成人格蒸馏</h3>
              <p className="text-sm text-gray-600 mb-4">您需要先完成人格蒸馏，创建专属智能体后才能发起匹配</p>
              <Link
                to="/distill"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-[0.98]"
              >
                前往蒸馏 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {queued && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping" />
                  </div>
                  <div>
                    <span className="font-semibold text-blue-900 block">正在寻找匹配对象</span>
                    <span className="text-xs text-blue-500">已尝试 {retryCount} 次 · 每3秒自动重试</span>
                  </div>
                </div>
                <button onClick={handleCancelMatch} className="text-gray-400 hover:text-gray-600 hover:bg-white/50 p-2 rounded-lg transition-all active:scale-90">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-blue-700 mb-3">{queueMsg}</p>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-progress-indeterminate" />
              </div>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-700 text-sm">人格蒸馏状态</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${distillStatus === 1 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {statusLabel}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-700 text-sm">智能体状态</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">已就绪</span>
            </div>
          </div>

          <button onClick={handleStartMatch} disabled={loading || distillStatus !== 1}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50 active:scale-[0.98]">
            {loading ? (
              <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />匹配中...</span>
            ) : distillStatus !== 1 ? "请先完成人格蒸馏" : "开始匹配"}
          </button>
        </div>

        {/* History card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-purple-100/50 p-8 border border-white/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">历史匹配记录</h3>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">暂无匹配记录</p>
              <p className="text-gray-400 text-sm mt-1">完成人格蒸馏后即可发起匹配</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((h, i) => {
                const statusLabels: Record<number, string> = {0:"匹配中",1:"智能体对话中",2:"对话完成",3:"报告就绪",4:"已拒绝",5:"已解锁"};
                const canView = h.status != null && h.status >= 1;
                return (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 group">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                      <span className="text-white font-bold text-sm">{h.partner_nick?.charAt(0) || "?"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">{h.partner_nick}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.unlock_flag === 1 ? "bg-green-100 text-green-700" : (h.status === 4 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700")}`}>
                          {statusLabels[h.status] || "未知"}
                        </span>
                        {h.score != null && <span className="text-xs text-purple-600 font-semibold ml-auto">{h.score}分</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(h.create_time).toLocaleString("zh-CN")}</p>
                    </div>
                    {canView && (
                      <button
                        onClick={() => handleViewChatRecord(h.match_id)}
                        className="flex-shrink-0 text-purple-500 hover:text-purple-700 hover:bg-purple-50 p-2.5 rounded-xl transition-all active:scale-90"
                        title="查看智能体对话记录"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {chatModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setChatModal({ open: false, matchId: "", messages: [] })}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">智能体对话记录</h3>
              </div>
              <button onClick={() => setChatModal({ open: false, matchId: "", messages: [] })} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all active:scale-90">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50">
              {chatModal.messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  <p>加载中...</p>
                </div>
              ) : (
                chatModal.messages.map((msg) => {
                  const isA = msg.speaker === "agent_a";
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isA ? "justify-start" : "justify-end"}`}>
                      {isA && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`max-w-sm ${isA ? "order-2" : "order-1"}`}>
                        <div className={`text-xs mb-1 ${isA ? "text-left text-gray-500" : "text-right text-gray-500"}`}>
                          {isA ? "我方智能体" : "对方智能体"}
                        </div>
                        <div className={`px-4 py-3 rounded-2xl ${isA ? "bg-blue-500 text-white rounded-tl-none" : "bg-white text-gray-900 shadow-sm rounded-tr-none"}`}>
                          <p className="leading-relaxed text-sm">{msg.content}</p>
                          <div className={`text-xs mt-1.5 ${isA ? "text-blue-100" : "text-gray-400"}`}>{msg.timestamp}</div>
                        </div>
                      </div>
                      {!isA && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
