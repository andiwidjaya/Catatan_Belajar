import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, CheckCircle2, HelpCircle, BookOpen, Key, Hash } from "lucide-react";

export interface AISummaryCardProps {
  summary: {
    id: string;
    model: string;
    summary: string;
    detailed_summary: string;
    key_points: string[];
    concepts: { name: string; definition: string }[];
    keywords: string[];
    created_at: string;
  };
}

export function AISummaryCard({ summary }: AISummaryCardProps) {
  const formattedDate = new Date(summary.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Short Overview Banner */}
      <Card className="border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/30 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Executive AI Summary
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">
                Model: {summary.model}
              </Badge>
              <span className="text-[10px] text-slate-400">{formattedDate}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
            {summary.summary}
          </p>
        </CardContent>
      </Card>

      {/* Key Takeaways & Core Concepts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Takeaways */}
        {summary.key_points && summary.key_points.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Key Points & Takeaways
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.key_points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Core Concepts */}
        {summary.concepts && summary.concepts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-sky-500" />
                Core Defined Concepts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.concepts.map((concept, idx) => (
                  <div key={idx} className="space-y-0.5 border-l-2 border-indigo-500 pl-3">
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {concept.name}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{concept.definition}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Analysis Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Key className="h-4 w-4 text-amber-500" />
            Detailed Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
            {summary.detailed_summary}
          </div>
        </CardContent>
      </Card>

      {/* Keywords & Tags Footer */}
      {summary.keywords && summary.keywords.length > 0 && (
        <Card>
          <CardContent className="p-4 flex items-center gap-2 flex-wrap text-xs">
            <Hash className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-500">Keywords:</span>
            {summary.keywords.map((kw, idx) => (
              <Badge key={idx} variant="secondary" size="sm">
                #{kw}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
