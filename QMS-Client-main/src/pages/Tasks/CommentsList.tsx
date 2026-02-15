import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Reply, Trash2, Edit3, X, AtSign } from "lucide-react";
import Avatar from "src/components/qms/Avatar";
import { TaskComment, fetchComments, createComment, updateComment, deleteComment } from "src/api/commentsApi";
import { userGetModel } from "src/types/UserModel";

interface CommentsListProps {
  taskId: number;
  users: userGetModel[];
  currentUserId?: number;
}

const CommentsList: React.FC<CommentsListProps> = ({ taskId, users, currentUserId }) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [sending, setSending] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchComments(taskId);
      setComments(data);
    } catch {} finally { setLoading(false); }
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      // Extract @mentions from text
      const mentionRegex = /@(\S+)/g;
      const mentionNames: string[] = [];
      let match;
      while ((match = mentionRegex.exec(text)) !== null) {
        mentionNames.push(match[1].toLowerCase());
      }
      const mentionIds = users
        .filter(u => mentionNames.some(n =>
          `${u.surname}${u.name}`.toLowerCase().includes(n) ||
          `${u.name}${u.surname}`.toLowerCase().includes(n)
        ))
        .map(u => u.id);

      const created = await createComment(taskId, text, {
        parentId: replyTo || undefined,
        mentions: mentionIds,
      });
      setComments(prev => [...prev, created]);
      setBody("");
      setReplyTo(null);
    } catch {} finally { setSending(false); }
  };

  const handleEdit = async (id: number) => {
    if (!editBody.trim()) return;
    try {
      const updated = await updateComment(taskId, id, editBody.trim());
      setComments(prev => prev.map(c => c.id === id ? updated : c));
      setEditingId(null);
      setEditBody("");
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteComment(taskId, id);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch {}
  };

  const insertMention = (user: userGetModel) => {
    setBody(prev => {
      const atIdx = prev.lastIndexOf("@");
      return prev.slice(0, atIdx) + `@${user.surname}${user.name} `;
    });
    setShowMentions(false);
    setMentionFilter("");
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBody(val);
    const atIdx = val.lastIndexOf("@");
    if (atIdx >= 0 && atIdx === val.length - 1) {
      setShowMentions(true);
      setMentionFilter("");
    } else if (atIdx >= 0 && !val.slice(atIdx).includes(" ")) {
      setShowMentions(true);
      setMentionFilter(val.slice(atIdx + 1).toLowerCase());
    } else {
      setShowMentions(false);
    }
  };

  const fmtTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  // Build tree: top-level comments + replies
  const topLevel = comments.filter(c => !c.parentId);
  const repliesMap: Record<number, TaskComment[]> = {};
  for (const c of comments) {
    if (c.parentId) {
      if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
      repliesMap[c.parentId].push(c);
    }
  }

  const filteredUsers = users.filter(u =>
    !mentionFilter || `${u.surname} ${u.name}`.toLowerCase().includes(mentionFilter)
  ).slice(0, 5);

  const renderComment = (c: TaskComment, isReply = false) => (
    <div key={c.id} className={`flex gap-2.5 ${isReply ? "ml-8" : ""}`}>
      <Avatar
        name={c.author ? `${c.author.surname} ${c.author.name}` : "?"}
        size="sm"
        color="accent"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[12px] font-semibold text-asvo-text">
            {c.author ? `${c.author.surname} ${c.author.name}` : "Пользователь"}
          </span>
          <span className="text-[10px] text-asvo-text-dim">{fmtTime(c.createdAt)}</span>
        </div>

        {editingId === c.id ? (
          <div className="flex gap-2 items-end">
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              className="flex-1 bg-asvo-surface-2 border border-asvo-border rounded-lg px-2 py-1 text-[12px] text-asvo-text resize-none focus:outline-none focus:border-asvo-accent/50"
              rows={2}
            />
            <button onClick={() => handleEdit(c.id)} className="text-asvo-accent hover:text-asvo-accent/70"><Send size={14} /></button>
            <button onClick={() => setEditingId(null)} className="text-asvo-text-dim hover:text-asvo-text"><X size={14} /></button>
          </div>
        ) : (
          <p className="text-[12px] text-asvo-text-mid whitespace-pre-wrap break-words">
            {c.body.split(/(@\S+)/g).map((part, i) =>
              part.startsWith("@") ? (
                <span key={i} className="text-asvo-accent font-medium">{part}</span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </p>
        )}

        {editingId !== c.id && (
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => { setReplyTo(c.id); inputRef.current?.focus(); }}
              className="text-[10px] text-asvo-text-dim hover:text-asvo-accent flex items-center gap-0.5"
            >
              <Reply size={10} /> Ответить
            </button>
            {currentUserId === c.authorId && (
              <>
                <button
                  onClick={() => { setEditingId(c.id); setEditBody(c.body); }}
                  className="text-[10px] text-asvo-text-dim hover:text-asvo-accent flex items-center gap-0.5"
                >
                  <Edit3 size={10} /> Изменить
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-[10px] text-asvo-text-dim hover:text-red-400 flex items-center gap-0.5"
                >
                  <Trash2 size={10} /> Удалить
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-asvo-accent/30 border-t-asvo-accent rounded-full animate-spin" />
        </div>
      )}

      {!loading && comments.length === 0 && (
        <p className="text-[13px] text-asvo-text-dim text-center py-3">Комментариев пока нет</p>
      )}

      {!loading && (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {topLevel.map(c => (
            <div key={c.id}>
              {renderComment(c)}
              {repliesMap[c.id]?.map(r => renderComment(r, true))}
            </div>
          ))}
        </div>
      )}

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 px-2 py-1 bg-asvo-accent/5 rounded text-[11px] text-asvo-accent">
          <Reply size={12} />
          <span>Ответ на комментарий</span>
          <button onClick={() => setReplyTo(null)} className="ml-auto text-asvo-text-dim hover:text-asvo-text"><X size={12} /></button>
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <div className="flex gap-2 items-end">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={body}
              onChange={handleInputChange}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Написать комментарий... (@для упоминания)"
              className="w-full bg-asvo-surface-2 border border-asvo-border rounded-lg px-3 py-2 text-[12px] text-asvo-text resize-none focus:outline-none focus:border-asvo-accent/50 placeholder:text-asvo-text-dim"
              rows={2}
              disabled={sending}
            />
            {/* Mention dropdown */}
            {showMentions && filteredUsers.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-full bg-asvo-card border border-asvo-border rounded-lg shadow-lg z-10 max-h-[150px] overflow-y-auto">
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => insertMention(u)}
                    className="w-full text-left px-3 py-1.5 text-[12px] text-asvo-text hover:bg-asvo-accent/10 flex items-center gap-2"
                  >
                    <AtSign size={12} className="text-asvo-accent shrink-0" />
                    {u.surname} {u.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={sending || !body.trim()}
            className="p-2 bg-asvo-accent text-white rounded-lg hover:bg-asvo-accent/80 transition disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentsList;
