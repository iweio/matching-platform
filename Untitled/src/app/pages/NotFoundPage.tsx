import { Link } from "react-router";
import { Home, Search, Heart } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-40 h-40 bg-pink-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center relative z-10">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl mb-6">
            <Search className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-7xl font-black text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text mb-3">404</h1>
          <p className="text-xl text-gray-600 font-medium mb-2">页面未找到</p>
          <p className="text-gray-400 text-sm">你访问的页面不存在或已被移除</p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-[0.98]"
        >
          <Home className="w-5 h-5" />
          返回首页
        </Link>
      </div>
    </div>
  );
}
