'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiFetch } from '@/lib/client';
import { useAuth } from './AuthProvider';
import { Spinner } from './ui';

interface Message {
  id: string;
  senderId: string;
  body: string;
  attachmentUrl: string | null;
  createdAt: string;
}

// Secure in-app chat for a single project<->contractor thread. Opens only once a
// bid exists (the API enforces this). Phone numbers are never exchanged here.
export function Chat({
  projectId,
  contractorId,
  counterpartyName,
}: {
  projectId: string;
  contractorId: string;
  counterpartyName: string;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const query = `?contractorId=${encodeURIComponent(contractorId)}`;

  // Load history.
  useEffect(() => {
    let active = true;
    apiFetch<{ messages: Message[] }>(`/api/projects/${projectId}/messages${query}`)
      .then((d) => { if (active) setMessages(d.messages); })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [projectId, contractorId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Connect realtime socket and join the thread room.
  useEffect(() => {
    const socket = io({ path: '/socket.io', withCredentials: true });
    socketRef.current = socket;
    socket.emit('join', { projectId, contractorId });
    socket.on('message:new', (msg: Message) => {
      setMessages((prev) => (prev ? (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]) : [msg]));
    });
    return () => {
      socket.emit('leave', { projectId, contractorId });
      socket.disconnect();
    };
  }, [projectId, contractorId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError('');
    try {
      const { message } = await apiFetch<{ message: Message }>(
        `/api/projects/${projectId}/messages${query}`,
        { method: 'POST', body: JSON.stringify({ body }) },
      );
      // Optimistically append (socket echo is de-duped by id).
      setMessages((prev) => (prev ? [...prev, message] : [message]));
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send.');
    } finally {
      setSending(false);
    }
  }

  async function sendAttachment(file: File) {
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { url } = await apiFetch<{ url: string }>('/api/uploads', { method: 'POST', body: fd });
      const { message } = await apiFetch<{ message: Message }>(
        `/api/projects/${projectId}/messages${query}`,
        { method: 'POST', body: JSON.stringify({ body: '📎 Shared a file', attachmentUrl: url }) },
      );
      setMessages((prev) => (prev ? [...prev, message] : [message]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[28rem] flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Chat with {counterpartyName}</p>
        <p className="text-xs text-slate-500">Keep all communication on-platform for your safety.</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {!messages ? (
          <div className="flex h-full items-center justify-center"><Spinner className="text-brand-500" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400">No messages yet. Say hello 👋</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? 'bg-brand-600 text-white' : 'bg-white text-slate-800 shadow-sm'}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  {m.attachmentUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a href={m.attachmentUrl} target="_blank" rel="noreferrer">
                      <img src={m.attachmentUrl} alt="attachment" className="mt-2 max-h-40 rounded-lg" />
                    </a>
                  )}
                  <p className={`mt-1 text-[10px] ${mine ? 'text-brand-100' : 'text-slate-400'}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 py-1 text-xs text-red-600">{error}</p>}

      <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-200 p-3">
        <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg px-2 py-2 text-slate-500 hover:bg-slate-100" title="Attach a photo">
          📎
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendAttachment(f); }} />
        <input
          className="input"
          placeholder="Type a message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button type="submit" disabled={sending || !body.trim()} className="btn-primary shrink-0">Send</button>
      </form>
    </div>
  );
}
