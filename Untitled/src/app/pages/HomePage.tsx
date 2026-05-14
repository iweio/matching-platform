import { Link } from "react-router";
import { Heart, Sparkles, ArrowRight, ChevronRight, Shield, Zap, Brain, MessageCircle, Users } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Brain,
    title: "创建你的智能体",
    desc: "花2分钟填写性格、三观、恋爱偏好，AI为你生成专属数字分身。",
    color: "from-pink-400 to-pink-600",
    bg: "bg-pink-50",
    text: "text-pink-600",
    shadowColor: "shadow-pink-200",
  },
  {
    num: "02",
    icon: MessageCircle,
    title: "AI 自主深度对话",
    desc: "双智能体自动展开20-50轮对话，深度测量三观契合度与婚恋适配性。",
    color: "from-purple-400 to-purple-600",
    bg: "bg-purple-50",
    text: "text-purple-600",
    shadowColor: "shadow-purple-200",
  },
  {
    num: "03",
    icon: Heart,
    title: "查看报告，双向奔赴",
    desc: "获得五维适配报告，双方都同意即可解锁真人聊天，从AI走向现实。",
    color: "from-blue-400 to-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-600",
    shadowColor: "shadow-blue-200",
  },
];

const features = [
  { icon: Shield, title: "隐私优先", desc: "AI 先对话，真人后再见面，保护你的隐私" },
  { icon: Zap, title: "深度匹配", desc: "20-50轮 AI 深度对话，远超传统问卷" },
  { icon: Users, title: "双向选择", desc: "双方都同意才解锁，杜绝骚扰" },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-pink-200/25 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none animate-float-left" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4 pointer-events-none animate-float-right" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-200/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20 relative z-10">

        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-purple-100 shadow-sm">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-600">AI 驱动 · 科学匹配</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              双智能体婚恋平台
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-3 max-w-2xl mx-auto">
            让你的 AI 数字分身为你先谈一场恋爱
          </p>
          <p className="text-gray-400 max-w-xl mx-auto">
            智能体代人深度交流，去除社交压力与表面干扰，帮你找到真正契合的人
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-200 hover:scale-105 transition-all active:scale-95"
            >
              立即开始
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 text-purple-600 px-6 py-4 rounded-full font-medium hover:bg-purple-50 transition-colors"
            >
              注册新账号
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="relative mb-16 md:mb-20">
          <div className="absolute top-8 left-0 right-0 hidden md:block">
            <div className="h-0.5 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 mx-16" />
          </div>

          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              三步，找到合适的人
            </h2>
            <p className="text-gray-500">不用尬聊，不用猜心思，让 AI 先帮你筛选</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {steps.map((step, i) => (
              <div key={i} className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-lg border border-white/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-md ${step.shadowColor}`}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-4xl font-black text-gray-100 group-hover:text-gray-200 transition-colors leading-none">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                <div className={`mt-4 h-1 w-12 rounded-full bg-gradient-to-r ${step.color}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-900">{title}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-lg border border-purple-50 hover:shadow-xl transition-shadow">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-200">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            准备好遇见对的人了吗？
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            只需 2 分钟创建你的智能体，剩下的交给 AI
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-10 py-4 rounded-full font-semibold text-lg shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-200 hover:scale-105 transition-all active:scale-95"
          >
            开始创建智能体
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-gray-400 mt-4">已有智能体？<Link to="/login" className="text-purple-600 hover:underline">去登录</Link></p>
        </div>

        <div className="mt-12 text-center text-gray-400 text-xs">
          <p>智能婚恋 · 科技撮合 · 真爱奔现</p>
        </div>
      </div>
    </div>
  );
}
