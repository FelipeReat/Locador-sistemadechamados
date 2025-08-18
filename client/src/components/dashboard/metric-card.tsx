import { LucideIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  gradient?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconColor,
  iconBgColor,
  gradient = "from-gray-50 to-white"
}: MetricCardProps) {
  const changeIcon = changeType === "positive" ? TrendingUpIcon : TrendingDownIcon;
  const ChangeIcon = changeIcon;

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${gradient} border border-white/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 leading-none">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">
              {value}
            </p>
            <div className={`flex items-center space-x-1 text-xs font-medium ${
              changeType === "positive" 
                ? "text-emerald-600" 
                : "text-rose-600"
            }`}>
              <ChangeIcon className="w-3 h-3" />
              <span>{change}</span>
            </div>
          </div>
          
          <div className={`p-3 rounded-xl ${iconBgColor} shadow-sm`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
        
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/10 pointer-events-none" />
      </CardContent>
    </Card>
  );
}