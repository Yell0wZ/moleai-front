import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/components/common/LanguageProvider";

const statusColors = {
  pending: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200 shadow-sm",
  analyzing: "bg-gradient-to-r from-blue-100 to-sky-100 text-blue-800 border border-blue-200 shadow-sm", 
  completed: "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 shadow-sm",
  error: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200 shadow-sm"
};

export default function PromptHistoryTable({ prompts, onViewResponses }) {
  const { t, isRTL, isHebrew } = useLanguage();

  return (
    <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>

      <div className="block lg:hidden space-y-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className={`flex items-center gap-2 text-sm text-gray-600 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs">
                    {format(new Date(prompt.created_date), "MMM d, yyyy")}
                  </span>
                </div>
                <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="font-medium text-sm truncate">{prompt.persona_name}</span>
                </div>
              </div>
              <Badge className={`text-xs ${statusColors[prompt.status] || statusColors.pending}`}>
                {isHebrew ?
                  (prompt.status === 'pending' ? 'בהמתנה' :
                   prompt.status === 'analyzing' ? 'מנתח' :
                   prompt.status === 'completed' ? 'הושלם' : 'שגיאה')
                  : prompt.status
                }
              </Badge>
            </div>
            
            <p className={`text-sm text-gray-600 mb-3 line-clamp-2 ${isRTL ? 'text-right' : ''}`} title={prompt.prompt}>
              {prompt.prompt}
            </p>
            
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MessageSquare className="w-4 h-4 text-sky-500 flex-shrink-0" />
                <span className="font-semibold text-sm">{prompt.businessNameMentions || 0}</span>
                <span className="text-xs text-gray-500">{isHebrew ? "אזכורים" : "Mentions"}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onViewResponses(prompt);
                }}
                disabled={prompt.status !== 'completed'}
                className={`bg-gradient-to-r from-sky-500/10 to-blue-500/10 hover:from-sky-500/20 hover:to-blue-500/20 border-sky-200 hover:border-sky-300 text-sky-700 hover:text-sky-800 text-xs px-4 py-2 h-9 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Eye className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {isHebrew ? "הצג" : "View"}
              </Button>
            </div>
          </div>
        ))}
      </div>


      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-white/20 shadow-lg bg-white/90 backdrop-blur-sm">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-sky-50/50 to-blue-50/50 border-b border-white/20">
              <TableHead className={`min-w-[120px] ${isRTL ? 'text-right' : ''}`}>{isHebrew ? "תאריך" : "Date"}</TableHead>
              <TableHead className={`min-w-[120px] ${isRTL ? 'text-right' : ''}`}>{isHebrew ? "אווטאר" : "Avatar"}</TableHead>
              <TableHead className={`min-w-[200px] ${isRTL ? 'text-right' : ''}`}>{isHebrew ? "פרומפט" : "Prompt"}</TableHead>
              <TableHead className={`min-w-[100px] ${isRTL ? 'text-right' : ''}`}>{isHebrew ? "סטטוס" : "Status"}</TableHead>
              <TableHead className={`min-w-[100px] ${isRTL ? 'text-right' : ''}`}>{isHebrew ? "אזכורים" : "Mentions"}</TableHead>
              <TableHead className={`min-w-[100px] ${isRTL ? 'text-right' : ''}`}>{isHebrew ? "פעולות" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.map((prompt) => (
              <TableRow key={prompt.id} className="hover:bg-gradient-to-r hover:from-sky-50/30 hover:to-blue-50/30 transition-all duration-300 border-b border-white/10">
                <TableCell className="min-w-[120px]">
                  <div className={`flex items-center gap-2 text-sm whitespace-nowrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      {format(new Date(prompt.created_date), "MMM d, yyyy")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="min-w-[120px]">
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="font-medium text-xs sm:text-sm truncate max-w-[100px]">{prompt.persona_name}</span>
                  </div>
                </TableCell>
                <TableCell className="min-w-[200px]">
                  <div className="max-w-[180px] sm:max-w-[250px]">
                    <p className={`truncate text-xs sm:text-sm text-gray-600 ${isRTL ? 'text-right' : ''}`} title={prompt.prompt}>
                      {prompt.prompt}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="min-w-[100px]">
                  <Badge className={`text-xs ${statusColors[prompt.status] || statusColors.pending}`}>
                    {isHebrew ?
                      (prompt.status === 'pending' ? 'בהמתנה' :
                       prompt.status === 'analyzing' ? 'מנתח' :
                       prompt.status === 'completed' ? 'הושלם' : 'שגיאה')
                      : prompt.status
                    }
                  </Badge>
                </TableCell>
                <TableCell className="min-w-[100px]">
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <MessageSquare className="w-4 h-4 text-sky-500 flex-shrink-0" />
                    <span className="font-semibold text-xs sm:text-sm">{prompt.businessNameMentions || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="min-w-[100px]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewResponses(prompt)}
                    disabled={prompt.status !== 'completed'}
                    className={`bg-gradient-to-r from-sky-500/10 to-blue-500/10 hover:from-sky-500/20 hover:to-blue-500/20 border-sky-200 hover:border-sky-300 text-sky-700 hover:text-sky-800 text-xs px-3 py-2 h-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Eye className={`w-3 h-3 sm:w-4 sm:h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    <span className="hidden sm:inline">{isHebrew ? "הצג" : "View"}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
