import { Home } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/25 animate-pulse">
            <Home className="size-8 text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 blur-xl opacity-30 animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0ms]" />
          <div className="size-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:150ms]" />
          <div className="size-2 rounded-full bg-purple-600 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
