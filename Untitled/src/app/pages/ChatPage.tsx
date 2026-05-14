import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Send, User, MessageCircle, Phone, Heart, Sparkles } from "lucide-react";
import { api } from "../api";
import { getUserId } from "../storage";

interface Contact {
  matchId: string;
  partnerUserId: string;
  partnerNick: string;
  partnerGender: number;
  lastMessage: string;
  lastTime: string;
}

interface Message {
  message_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function ChatPage() {
  const uid = getUserId();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!uid) return;
    api.getConversations().then(setContacts).catch(() => {});
  }, [uid]);

  useEffect(() => {
    if (!uid || !selectedMatchId) return;
    let stop = false;
    const known = new Set<string>();

    const fetchMessages = () => {
      if (stop) return;
      api.getMessages(selectedMatchId, uid)
        .then((r) => {
          if (stop) return;
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.message_id));
            const merged = [...prev];
            for (const m of r.messages || []) {
              if (!known.has(m.message_id) && !existingIds.has(m.message_id)) {
                known.add(m.message_id);
                merged.push(m);
              }
            }
            const filtered = merged.filter((m) => {
              if (!m.message_id.startsWith("tmp_")) return true;
              return !merged.some((x) => x.sender_id === m.sender_id && !x.message_id.startsWith("tmp_") && x.content === m.content);
            });
            filtered.sort((a, b) => a.created_at.localeCompare(b.created_at));
            return filtered;
          });
        })
        .catch(() => {});
    };

    fetchMessages();
    const timer = setInterval(fetchMessages, 3000);
    return () => { stop = true; clearInterval(timer); };
  }, [uid, selectedMatchId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedMatchId(contact.matchId);
    setSelectedPartner(contact);
    setMobileShowChat(true);
  };

  const handleBackToList = () => {
    setMobileShowChat(false);
  };

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !uid || !selectedMatchId) return;
    const content = inputValue;
    const tempId = "tmp_" + Date.now().toString();
    setInputValue("");
    setMessages((prev) => [...prev, {
      message_id: tempId,
      sender_id: uid,
      content,
      created_at: new Date().toISOString().replace("T", " ").slice(0, 19),
    }]);
    try {
      const res = await api.sendMessage(selectedMatchId, uid, content);
      setMessages((prev) => prev.map((m) =>
        m.message_id === tempId ? { ...m, message_id: res.message_id } : m
      ));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "发送失败";
      alert("发送失败: " + msg);
      setMessages((prev) => prev.filter((m) => m.message_id !== tempId));
      setInputValue(content);
    }
  }, [inputValue, uid, selectedMatchId]);

  return (
    <div className="h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-pink-200/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-200/15 rounded-full blur-3xl pointer-events-none" />

      {/* Contact list */}
      <div className={`w-full lg:w-80 lg:flex-shrink-0 border-r border-purple-100 flex flex-col bg-white/70 backdrop-blur-sm relative z-10 ${mobileShowChat ? "hidden lg:flex" : "flex"}`}>
        <div className="px-5 py-4 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">消息</h2>
          </div>
        </div>

        {contacts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 font-medium">暂无聊天</p>
              <p className="text-xs text-gray-300 mt-1">解锁匹配后可开始聊天</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-2">
            {contacts.map((c) => {
              const active = selectedMatchId === c.matchId;
              return (
                <button
                  key={c.matchId}
                  onClick={() => handleSelectContact(c)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-purple-50 to-pink-50 border-r-2 border-r-purple-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-bold text-sm">{c.partnerNick?.charAt(0) || "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 text-sm truncate">{c.partnerNick}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{c.lastTime}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {c.lastMessage || "暂无消息"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col min-w-0 relative z-10 ${mobileShowChat ? "flex" : "hidden lg:flex"}`}>
        {selectedPartner ? (
          <>
            <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-5 py-3 flex items-center gap-3 flex-shrink-0">
              <button onClick={handleBackToList} className="lg:hidden text-gray-600 hover:text-gray-900 p-1">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold text-sm">{selectedPartner.partnerNick?.charAt(0) || "?"}</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">{selectedPartner.partnerNick}</div>
                <div className="text-xs text-green-500 font-medium">在线</div>
              </div>
              <Phone className="w-5 h-5 text-gray-400" />
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gradient-to-b from-purple-50/30 to-pink-50/30">
              {messages.map((msg) => {
                const isMine = msg.sender_id === uid;
                return (
                  <div key={msg.message_id} className={`flex gap-3 ${isMine ? "justify-end" : "justify-start"}`}>
                    {!isMine && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-xs">{selectedPartner.partnerNick?.charAt(0) || "?"}</span>
                      </div>
                    )}
                    <div className="max-w-xs md:max-w-md">
                      <div className={`px-4 py-3 rounded-2xl ${
                        isMine
                          ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-tr-none shadow-md"
                          : "bg-white text-gray-900 shadow-sm rounded-tl-none"
                      }`}>
                        <p className="leading-relaxed break-words text-sm">{msg.content}</p>
                      </div>
                      <div className={`text-xs text-gray-400 mt-1 ${isMine ? "text-right" : "text-left"}`}>{msg.created_at}</div>
                    </div>
                    {isMine && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-white/80 backdrop-blur-sm border-t border-purple-100 px-4 py-3 flex-shrink-0">
              <div className="flex gap-3 items-end">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="输入消息..."
                  rows={1}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white outline-none resize-none max-h-32 text-sm transition-all"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">发送</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-purple-50/30 to-pink-50/30">
            <div className="text-center px-8">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">欢迎来到聊天</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                从左侧选择一个联系人，即可开始发送消息与对方进行愉快交流
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-purple-500 bg-purple-50 px-5 py-2.5 rounded-full border border-purple-100">
                <span className="hidden lg:inline">←</span>
                <span className="lg:hidden">👆</span>
                选择联系人开始聊天
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
