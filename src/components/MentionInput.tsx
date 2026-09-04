"use client";

import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from "react";

interface UserInfo {
  id: string;
  username: string; 
  name: string;
  image: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function MentionInput({ value, onChange, placeholder, disabled, className }: MentionInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [matchStart, setMatchStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch users when searchQuery changes
  useEffect(() => {
    if (!showDropdown) return;
    
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const url = searchQuery ? `/api/members?q=${encodeURIComponent(searchQuery)}` : `/api/members`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.slice(0, 5)); // Show max 5
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 300); // Debounce
    return () => clearTimeout(timer);
  }, [searchQuery, showDropdown]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const currentPos = e.target.selectionStart;
    setCursorPos(currentPos);

    // Look for "@" word right before cursor
    const textBeforeCursor = newValue.substring(0, currentPos);
    // Regex matches "@" followed by word characters at the end of string
    const match = /(?:^|\s)@([a-zA-Z0-9_가-힣]*)$/.exec(textBeforeCursor);

    if (match) {
      setSearchQuery(match[1]);
      setMatchStart(match.index + (match[0].startsWith(" ") || match[0].startsWith("\n") ? 1 : 0));
      setShowDropdown(true);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelectUser = (user: UserInfo) => {
    if (matchStart === -1) return;
    
    const beforeMention = value.substring(0, matchStart);
    const afterMention = value.substring(cursorPos);
    
    const mentionText = `@${user.name || user.username} `;
    
    const newValue = beforeMention + mentionText + afterMention;
    onChange(newValue);
    
    setShowDropdown(false);
    
    // Set focus back
    if (textareaRef.current) {
      textareaRef.current.focus();
      // setTimeout to set cursor position after render
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = matchStart + mentionText.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % users.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
    } else if (e.key === "Enter") {
      if (e.nativeEvent.isComposing) {
        return; // Ignore Enter during IME composition to prevent trailing characters
      }
      e.preventDefault();
      if (users.length > 0) {
        handleSelectUser(users[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={() => setShowDropdown(false)}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className={`w-full resize-none ${className || ""}`}
      />
      
      {showDropdown && (
        <div className="absolute z-10 w-64 mt-1 bg-white border-2 border-black neo-shadow-sm max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-sm text-black">검색 중...</div>
          ) : users.length > 0 ? (
            <ul className="py-1">
              {users.map((user, index) => (
                <li
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                    index === selectedIndex ? "bg-neo-pink text-white font-bold" : "hover:bg-gray-100"
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {user.image ? (
                    <img src={user.image} alt="" className="w-6 h-6 rounded-full border border-black object-cover" />
                  ) : (
                    <div className={`w-6 h-6 rounded-full border border-black flex items-center justify-center text-xs ${index === selectedIndex ? "bg-white text-neo-pink" : "bg-neo-yellow text-black"}`}>
                      {(user.name || user.username || "?")[0]}
                    </div>
                  )}
                  <span className="text-sm">{user.name || user.username}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-sm text-gray-500">사용자를 찾을 수 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}
