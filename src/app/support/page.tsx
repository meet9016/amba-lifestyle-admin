'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Image as ImageIcon,
  User,
  Shield,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { apiClient, API_ENDPOINTS } from '@/lib/api';

export interface ChatMessage {
  sender: 'customer' | 'admin';
  senderName: string;
  text: string;
  images?: string[];
  createdAt: string;
}

export interface SupportTicketItem {
  _id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  messages: ChatMessage[];
  createdAt: string;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPPORT.LIST, {
        headers: { 'x-user-role': 'admin' }
      });
      if (res.data?.data) {
        setTickets(res.data.data);
        if (res.data.data.length > 0 && !selectedTicket) {
          setSelectedTicket(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReplyImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!replyText.trim() && !replyImage)) return;

    setIsSending(true);
    const newMsg: ChatMessage = {
      sender: 'admin',
      senderName: 'Amba Super Admin Specialist',
      text: replyText.trim(),
      images: replyImage ? [replyImage] : [],
      createdAt: new Date().toISOString()
    };

    try {
      await apiClient.post(
        API_ENDPOINTS.SUPPORT.ADD_MESSAGE(selectedTicket._id),
        {
          text: replyText.trim(),
          images: replyImage ? [replyImage] : [],
          sender: 'admin',
          senderName: 'Amba Super Admin Specialist'
        },
        { headers: { 'x-user-role': 'admin' } }
      );

      const updatedTicket = {
        ...selectedTicket,
        status: 'in_progress' as const,
        messages: [...selectedTicket.messages, newMsg]
      };

      setSelectedTicket(updatedTicket);
      setTickets(prev => prev.map(t => (t._id === selectedTicket._id ? updatedTicket : t)));
      setReplyText('');
      setReplyImage('');
    } catch (err) {
      console.error('Send reply error:', err);
      // Local fallback
      const updatedTicket = {
        ...selectedTicket,
        messages: [...selectedTicket.messages, newMsg]
      };
      setSelectedTicket(updatedTicket);
      setTickets(prev => prev.map(t => (t._id === selectedTicket._id ? updatedTicket : t)));
      setReplyText('');
      setReplyImage('');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'open' | 'in_progress' | 'resolved') => {
    if (!selectedTicket) return;
    try {
      await apiClient.patch(
        API_ENDPOINTS.SUPPORT.UPDATE_STATUS(selectedTicket._id),
        { status: newStatus },
        { headers: { 'x-user-role': 'admin' } }
      );
      const updated = { ...selectedTicket, status: newStatus };
      setSelectedTicket(updated);
      setTickets(prev => prev.map(t => (t._id === selectedTicket._id ? updated : t)));
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesStatus = statusFilter === 'all' ? true : t.status === statusFilter;
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight">Customer Support & Live Inquiries</h1>
            <p className="text-xs text-zinc-500">Communicate directly with B2B & retail customers, review design references and resolve questions</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {tickets.filter(t => t.status === 'open').length} Open Inquiries
            </span>
          </div>
        </header>

        {/* 2-Column Split Workspace */}
        <div className="flex-1 flex min-h-0">
          {/* Left List (Ticket Inbox) */}
          <div className="w-80 md:w-96 bg-white border-r border-zinc-200 flex flex-col shrink-0">
            {/* Filter Bar */}
            <div className="p-4 border-b border-zinc-100 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search inquiries or buyers..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'open', label: 'Open' },
                  { id: 'in_progress', label: 'In Progress' },
                  { id: 'resolved', label: 'Resolved' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
              {isLoading ? (
                <div className="py-12 text-center text-zinc-400 text-xs">Loading customer inquiries...</div>
              ) : filteredTickets.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs px-4">No support inquiries found.</div>
              ) : (
                filteredTickets.map(ticket => {
                  const isSelected = selectedTicket?._id === ticket._id;
                  const lastMsg = ticket.messages[ticket.messages.length - 1];

                  return (
                    <div
                      key={ticket._id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/60 border-l-4 border-l-indigo-600' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-zinc-400 font-semibold">{ticket.ticketNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            ticket.status === 'open'
                              ? 'bg-amber-100 text-amber-800'
                              : ticket.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="font-bold text-zinc-900 text-xs mt-1 truncate">{ticket.subject}</h4>
                      <p className="text-[11px] text-zinc-500 font-medium truncate">{ticket.customerName}</p>

                      {lastMsg && (
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-1 italic">
                          {lastMsg.sender === 'admin' ? 'You: ' : ''}
                          {lastMsg.text || 'Sent reference image'}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Chat Thread */}
          <div className="flex-1 flex flex-col bg-zinc-50/40 min-w-0">
            {selectedTicket ? (
              <>
                {/* Active Ticket Banner */}
                <div className="px-6 py-3.5 bg-white border-b border-zinc-200 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {selectedTicket.customerName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 text-sm">{selectedTicket.subject}</h3>
                      <p className="text-xs text-zinc-500">
                        {selectedTicket.customerName} ({selectedTicket.customerEmail}) • {selectedTicket.customerPhone || 'Direct Inquiry'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedTicket.status !== 'resolved' ? (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus('resolved')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Resolved
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus('open')}
                        className="text-xs h-8 text-amber-700 border-amber-300 hover:bg-amber-50"
                      >
                        Re-open Inquiry
                      </Button>
                    )}
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {selectedTicket.messages.map((msg, index) => {
                    const isAdmin = msg.sender === 'admin';

                    return (
                      <div
                        key={index}
                        className={`flex gap-3 max-w-[80%] ${isAdmin ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                            isAdmin ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white'
                          }`}
                        >
                          {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>

                        <div className={`space-y-1.5 ${isAdmin ? 'text-right' : ''}`}>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                            <span className="font-semibold text-zinc-700">{msg.senderName}</span>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isAdmin
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-xs'
                                : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none shadow-xs text-left'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>

                            {/* Reference Images in Chat */}
                            {msg.images && msg.images.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-black/10">
                                {msg.images.map((img, i) => (
                                  <div
                                    key={i}
                                    onClick={() => setLightboxImage(img)}
                                    className="cursor-pointer overflow-hidden rounded-lg aspect-square border border-black/10 bg-black/5"
                                  >
                                    <img src={img} alt="Shared Design" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Form */}
                <form
                  onSubmit={handleSendReply}
                  className="p-4 bg-white border-t border-zinc-200 shrink-0 space-y-3"
                >
                  {replyImage && (
                    <div className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-xl w-fit">
                      <img src={replyImage} alt="Attachment" className="w-10 h-10 object-cover rounded-lg border" />
                      <span className="text-xs text-zinc-600">Sample attached</span>
                      <button
                        type="button"
                        onClick={() => setReplyImage('')}
                        className="text-zinc-400 hover:text-zinc-700 cursor-pointer p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
                      title="Attach reference sample image"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      placeholder="Type official reply to customer..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <Button
                      type="submit"
                      disabled={isSending || (!replyText.trim() && !replyImage)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-10 px-5 gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Send Reply
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-xs">
                <MessageSquare className="w-12 h-12 text-zinc-300 mb-2 stroke-1" />
                Select a customer inquiry thread from the left to view details and reply.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LIGHTBOX FOR PREVIEWING CHAT REFERENCE IMAGES */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={lightboxImage} alt="Reference Full View" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}

