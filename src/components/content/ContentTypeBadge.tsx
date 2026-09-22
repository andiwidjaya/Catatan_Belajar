import React from "react";
import { Badge } from "@/components/ui/Badge";
import { ContentType } from "@/types/database.types";
import { Youtube, FileAudio, FileText } from "lucide-react";

export interface ContentTypeBadgeProps {
  type: ContentType;
}

export function ContentTypeBadge({ type }: ContentTypeBadgeProps) {
  switch (type) {
    case "video":
      return (
        <Badge variant="danger" size="sm" className="gap-1">
          <Youtube className="h-3 w-3" />
          Video
        </Badge>
      );
    case "audio":
      return (
        <Badge variant="info" size="sm" className="gap-1">
          <FileAudio className="h-3 w-3" />
          Audio
        </Badge>
      );
    case "text":
      return (
        <Badge variant="success" size="sm" className="gap-1">
          <FileText className="h-3 w-3" />
          Text Note
        </Badge>
      );
    default:
      return <Badge variant="secondary" size="sm">{type}</Badge>;
  }
}
