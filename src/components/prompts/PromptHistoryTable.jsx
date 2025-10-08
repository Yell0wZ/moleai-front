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
  pending: "bg-yellow-100 text-yellow-800",
  analyzing: "bg-blue-100 text-blue-800", 
  completed: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800"
};

export default function PromptHistoryTable({ prompts, onViewResponses }) {
  const { t, isRTL, isHebrew } = useLanguage();

  return (
    <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
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
                  console.log('View button clicked for prompt:', prompt);
                  onViewResponses(prompt);
                }}
                disabled={prompt.status !== 'completed'}
                className={`hover:bg-blue-50 hover:text-blue-700 text-xs px-3 py-1 h-8 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Eye className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {isHebrew ? "הצג" : "View"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-gray-50">
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
              <TableRow key={prompt.id} className="hover:bg-gray-50">
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
                    className={`hover:bg-blue-50 hover:text-blue-700 text-xs px-2 py-1 h-8 whitespace-nowrap ${isRTL ? 'flex-row-reverse' : ''}`}
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
