import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { buildApiUrl, getImageUrl } from "@/lib/api-config";

interface MentionUser {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  required?: boolean;
}

export function MentionTextarea({ value, onChange, placeholder, rows = 4, className, required }: MentionTextareaProps) {
  const [mentionQuery, setMentionQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [] } = useQuery<MentionUser[]>({
    queryKey: ["/api/users/search", mentionQuery],
    queryFn: async () => {
      if (mentionQuery.length < 1) return [];
      const res = await fetch(buildApiUrl(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`), {
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: showSuggestions && mentionQuery.length >= 1,
  });

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart || 0;
    onChange(text);
    setCursorPosition(cursor);

    const textBeforeCursor = text.substring(0, cursor);
    const atMatch = textBeforeCursor.match(/@([^@\[\]]*)$/);

    if (atMatch) {
      setMentionStartIndex(cursor - atMatch[0].length);
      setMentionQuery(atMatch[1]);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
      setMentionQuery("");
    }
  }, [onChange]);

  const insertMention = useCallback((user: MentionUser) => {
    const before = value.substring(0, mentionStartIndex);
    const after = value.substring(cursorPosition);
    const mentionTag = `@[${user.username}]`;
    const newText = `${before}${mentionTag} ${after}`;
    onChange(newText);
    setShowSuggestions(false);
    setMentionQuery("");

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursor = mentionStartIndex + mentionTag.length + 1;
        textareaRef.current.selectionStart = newCursor;
        textareaRef.current.selectionEnd = newCursor;
        textareaRef.current.focus();
      }
    }, 0);
  }, [value, mentionStartIndex, cursorPosition, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && showSuggestions) {
      e.preventDefault();
      insertMention(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [showSuggestions, suggestions, selectedIndex, insertMention]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
        required={required}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-gray-900 border border-gray-700 rounded-lg shadow-xl"
        >
          {suggestions.map((user, index) => {
            const name = user.displayName
              ? user.displayName
              : user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-[#D4AF37]/20 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Avatar className="w-7 h-7">
                  <AvatarImage src={getImageUrl(user.profileImageUrl)} />
                  <AvatarFallback className="bg-[#D4AF37] text-black text-xs">
                    {(user.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-gray-400">@{user.username}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function renderContentWithMentions(content: string): JSX.Element {
  if (!content) return <></>;

  const parts = content.split(/(@\[([^\]]+)\])/g);
  const elements: JSX.Element[] = [];
  let i = 0;

  while (i < parts.length) {
    const part = parts[i];
    if (part && part.startsWith('@[') && part.endsWith(']')) {
      const username = parts[i + 1];
      elements.push(
        <Link
          key={i}
          href={`/profile/${encodeURIComponent(username)}`}
          className="text-[#D4AF37] font-medium hover:underline"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          @{username}
        </Link>
      );
      i += 2;
    } else if (part !== undefined && part !== '') {
      elements.push(<span key={i}>{part}</span>);
      i += 1;
    } else {
      i += 1;
    }
  }

  return <>{elements}</>;
}
