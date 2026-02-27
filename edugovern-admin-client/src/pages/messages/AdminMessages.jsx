import { useState, useEffect, useRef } from 'react';
import './AdminMessages.css';
import Sidebar from '../../components/layout/Sidebar';
import {
  getAllMessages,
  getMessageById,
  sendReply,
  sendMessage,
  markAsRead,
  deleteMessage,
  getUnreadCount
} from '../../services/message.service.js';
import { getAllStudents } from '../../services/student.service.js';
import { getAllFaculty } from '../../services/faculty.service.js';

/* Admin Messages Chat Interface */
const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [userList, setUserList] = useState([]);
  const [displayList, setDisplayList] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSenderType, setSelectedSenderType] = useState('All');
  const [showRecentChat, setShowRecentChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
    fetchStudents();
    fetchFaculty();
  }, []);

  // Reset selectedSenderType if it's "other" (removed option)
  useEffect(() => {
    if (selectedSenderType === 'other') {
      setSelectedSenderType('All');
    }
  }, [selectedSenderType]);

  // Group messages into conversations and create user list
  useEffect(() => {
    groupMessagesIntoConversations();
    createUserList();
  }, [messages, students, faculty, selectedClass, selectedSection, selectedSenderType, searchTerm, showRecentChat]);

  // Combine conversations and user list for display
  useEffect(() => {
    combineConversationsAndUsers();
  }, [conversations, userList, selectedSenderType, showRecentChat, selectedClass, selectedSection]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  // Auto-refresh messages periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchMessages();
        fetchUnreadCount();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await getAllMessages();
      setMessages(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const fetchFaculty = async () => {
    try {
      const data = await getAllFaculty();
      setFaculty(data);
    } catch (err) {
      console.error('Failed to fetch faculty:', err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const getOtherParty = (msg) => {
    if (msg.recipient_type === 'admin') {
      return { id: msg.sender_id, type: msg.sender_type, name: msg.sender_name };
    }
    return { id: msg.recipient_id, type: msg.recipient_type, name: msg.recipient_name };
  };

  const groupMessagesIntoConversations = () => {
    let filtered = [...messages];

    // Filter by sender/recipient type (other party in conversation)
    if (selectedSenderType !== 'All') {
      filtered = filtered.filter(msg => {
        const other = getOtherParty(msg);
        return other.type === selectedSenderType;
      });
    }

    // Filter by class and section for student conversations
    if (!showRecentChat && (selectedClass || selectedSection)) {
      filtered = filtered.filter(msg => {
        const other = getOtherParty(msg);
        if (other.type !== 'student') return selectedSenderType === 'All';
        const student = students.find(s =>
          s.student_id === other.id || s.id?.toString() === other.id || s.email === other.id
        );
        if (!student) return false;
        if (selectedClass && student.class !== selectedClass) return false;
        if (selectedSection && student.section !== selectedSection) return false;
        return true;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(msg => {
        const other = getOtherParty(msg);
        return (
          (other.name || '').toLowerCase().includes(term) ||
          (msg.subject || '').toLowerCase().includes(term) ||
          (msg.message || '').toLowerCase().includes(term)
        );
      });
    }

    // Group by other party (conversation partner)
    const conversationMap = new Map();
    filtered.forEach(msg => {
      const other = getOtherParty(msg);
      const key = `${other.id}_${other.type}`;
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          sender_id: other.id,
          sender_name: other.name || 'Unknown',
          sender_type: other.type,
          messages: [],
          lastMessage: null,
          unreadCount: 0,
          studentInfo: other.type === 'student'
            ? students.find(s => s.student_id === other.id || s.id?.toString() === other.id)
            : null,
          facultyInfo: other.type === 'staff'
            ? faculty.find(f => f.staff_id === other.id || f.email === other.id)
            : null
        });
      }
      const conv = conversationMap.get(key);
      conv.messages.push(msg);
      if (!conv.lastMessage || new Date(msg.created_at) > new Date(conv.lastMessage.created_at)) {
        conv.lastMessage = msg;
      }
      if (!msg.is_read && msg.recipient_type === 'admin') {
        conv.unreadCount++;
      }
    });

    const convs = Array.from(conversationMap.values()).sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.created_at) : new Date(0);
      const dateB = b.lastMessage ? new Date(b.lastMessage.created_at) : new Date(0);
      return dateB - dateA;
    });

    setConversations(convs);
  };

  const createUserList = () => {
    if (selectedSenderType === 'All') {
      setUserList([]);
      return;
    }

    let users = [];

    if (selectedSenderType === 'student') {
      let filteredStudents = [...students];

      // Filter by class and section only if "Recent Chat" is not checked
      if (!showRecentChat) {
        // Filter by class
        if (selectedClass) {
          filteredStudents = filteredStudents.filter(s => s.class === selectedClass);
        }

        // Filter by section
        if (selectedSection) {
          filteredStudents = filteredStudents.filter(s => s.section === selectedSection);
        }
      }

      // Filter by search term
      if (searchTerm) {
        filteredStudents = filteredStudents.filter(s =>
          s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      users = filteredStudents.map(student => ({
        sender_id: student.student_id || student.id?.toString(),
        sender_name: student.name,
        sender_type: 'student',
        studentInfo: student,
        lastMessage: null,
        unreadCount: 0,
        messages: []
      }));
    } else if (selectedSenderType === 'staff') {
      let filteredFaculty = [...faculty];

      // Filter by class and section when selected (same as students)
      if (!showRecentChat) {
        if (selectedClass) {
          filteredFaculty = filteredFaculty.filter(f => f.class === selectedClass);
        }
        if (selectedSection) {
          filteredFaculty = filteredFaculty.filter(f => f.section === selectedSection);
        }
      }

      // Filter by search term
      if (searchTerm) {
        filteredFaculty = filteredFaculty.filter(f =>
          (f.staff_name || f.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.designation?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      users = filteredFaculty.map(facultyMember => ({
        sender_id: facultyMember.staff_id,
        sender_name: facultyMember.staff_name || facultyMember.name,
        sender_type: 'staff',
        facultyInfo: facultyMember,
        lastMessage: null,
        unreadCount: 0,
        messages: []
      }));
    } else if (selectedSenderType === 'transport_manager') {
      // Transport managers: use faculty with designation containing "Transport"
      let filteredTransport = faculty.filter(f => {
        const des = (f.designation || '').toLowerCase();
        return des.includes('transport') || des.includes('transport manager');
      });

      if (searchTerm) {
        filteredTransport = filteredTransport.filter(f =>
          (f.staff_name || f.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      users = filteredTransport.map(fm => ({
        sender_id: fm.staff_id,
        sender_name: fm.staff_name || fm.name,
        sender_type: 'transport_manager',
        facultyInfo: fm,
        lastMessage: null,
        unreadCount: 0,
        messages: []
      }));
    }

    setUserList(users);
  };

  const combineConversationsAndUsers = () => {
    if (selectedSenderType === 'All') {
      // When "All" is selected, show only conversations
      setDisplayList(conversations);
      return;
    }

    // If "Recent Chat" is checked, show only conversations
    if (showRecentChat) {
      // Sort conversations by last message date (most recent first)
      const sorted = [...conversations].sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.created_at) : new Date(0);
        const dateB = b.lastMessage ? new Date(b.lastMessage.created_at) : new Date(0);
        return dateB - dateA;
      });
      setDisplayList(sorted);
      return;
    }

    // When "Recent Chat" is NOT checked:
    // Show ALL matching users (with or without chats) when a specific user type is selected
    const shouldShowAllUsers =
      selectedSenderType === 'student' ||
      selectedSenderType === 'staff' ||
      selectedSenderType === 'transport_manager';

    if (shouldShowAllUsers) {
      // Show all users matching filters (with or without messages) + merge with existing conversations
      const combined = new Map();

      // Add existing conversations
      conversations.forEach(conv => {
        const key = `${conv.sender_id}_${conv.sender_type}`;
        combined.set(key, { ...conv, hasMessages: true });
      });

      // Add all users from the selected class/section (even without messages)
      userList.forEach(user => {
        const key = `${user.sender_id}_${user.sender_type}`;
        if (!combined.has(key)) {
          combined.set(key, { ...user, hasMessages: false });
        }
      });

      // Sort: Users with messages first (sorted by last message), then users without messages (sorted by name)
      const sorted = Array.from(combined.values()).sort((a, b) => {
        if (a.hasMessages && !b.hasMessages) return -1;
        if (!a.hasMessages && b.hasMessages) return 1;
        
        if (a.hasMessages && b.hasMessages) {
          const dateA = a.lastMessage ? new Date(a.lastMessage.created_at) : new Date(0);
          const dateB = b.lastMessage ? new Date(b.lastMessage.created_at) : new Date(0);
          return dateB - dateA;
        }
        
        // Both without messages, sort by name
        return (a.sender_name || '').localeCompare(b.sender_name || '');
      });

      setDisplayList(sorted);
    } else {
      // Show only conversations (recent chats) sorted by last message
      const sorted = [...conversations].sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.created_at) : new Date(0);
        const dateB = b.lastMessage ? new Date(b.lastMessage.created_at) : new Date(0);
        return dateB - dateA;
      });
      setDisplayList(sorted);
    }
  };

  const handleSelectConversation = async (conversation) => {
    try {
      if (conversation.messages && conversation.messages.length > 0) {

        const sortedMessages = [...conversation.messages].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        
        setSelectedConversation(conversation);
        setConversationMessages(sortedMessages);
        
        // Mark all messages as read
        const unreadIds = sortedMessages.filter(msg => !msg.is_read).map(msg => msg.id);
        if (unreadIds.length > 0) {
          for (const id of unreadIds) {
            await markAsRead(id);
          }
          await fetchMessages();
          await fetchUnreadCount();
        }
      } else {
        // No messages yet, create a new conversation object
        setSelectedConversation(conversation);
        setConversationMessages([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() && !selectedFile) {
      setError('Please enter a message or attach a file');
      return;
    }

    if (!selectedConversation) {
      setError('Please select a conversation first');
      return;
    }

    try {
      await sendMessage({
        recipient_id: selectedConversation.sender_id,
        recipient_name: selectedConversation.sender_name,
        recipient_type: selectedConversation.sender_type,
        subject: 'Message',
        message: messageInput.trim() || '(File attachment)',
        attachment: selectedFile || undefined
      });

      setMessageInput('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setError('');
      
      await fetchMessages();
      await fetchUnreadCount();
      
      const updatedMessages = await getAllMessages();
      const conv = selectedConversation;
      const conversationMsgs = updatedMessages.filter(msg => {
        const other = getOtherParty(msg);
        return other.id === conv.sender_id && other.type === conv.sender_type;
      });
      const sorted = conversationMsgs.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      setConversationMessages(sorted);
    } catch (err) {
      setError(err.message || 'Failed to send message');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSenderTypeLabel = (type) => {
    const labels = {
      student: 'Student',
      staff: 'Staff',
      transport_manager: 'Transport Manager',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getSenderTypeIcon = (type) => {
    const icons = {
      student: '👤',
      staff: '👨‍🏫',
      transport_manager: '🚌',
      other: '📧'
    };
    return icons[type] || '📧';
  };

  const getFileName = (path) => {
    if (!path) return '';
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  const renderAttachment = (attachment_path, attachment_name) => {
    if (!attachment_path) return null;
    const fileName = attachment_name || getFileName(attachment_path);
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
    const isPdf = /\.pdf$/i.test(fileName);
    const isDoc = /\.(doc|docx)$/i.test(fileName);

    return (
      <div className="message-attachment">
        {isImage ? (
          <img src={attachment_path} alt={fileName} className="attachment-image" />
        ) : (
          <a
            href={attachment_path}
            target="_blank"
            rel="noopener noreferrer"
            className="attachment-link"
          >
            📎 {fileName}
            {isPdf && <span className="file-type">PDF</span>}
            {isDoc && <span className="file-type">DOC</span>}
          </a>
        )}
      </div>
    );
  };

  return (
    <div className='messages-container'>
      <Sidebar />
      <div className="messages-page">
        <main className="messages-content">
            <h2>Chats</h2>
          <div className="messages-header">
            {unreadCount > 0 && (
              <div className="unread-badge">
                {unreadCount} unread
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="messages-filters">
            <select
              className="filter-btn"
              value={selectedSenderType === 'other' ? 'All' : selectedSenderType}
              onChange={(e) => setSelectedSenderType(e.target.value)}
            >
              <option value="All">Select User</option>
              <option value="student">Students</option>
              <option value="staff">Staff</option>
              <option value="transport_manager">Transport Manager</option>
            </select>
            <select
              className="filter-btn"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={showRecentChat}
            >
              <option value="">Select Class</option>
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
              <option value="3rd">3rd</option>
              <option value="4th">4th</option>
              <option value="5th">5th</option>
              <option value="6th">6th</option>
              <option value="7th">7th</option>
              <option value="8th">8th</option>
              <option value="9th">9th</option>
              <option value="10th">10th</option>
              <option value="11th">11th</option>
              <option value="12th">12th</option>
            </select>
            <select
              className="filter-btn"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={showRecentChat}
            >
              <option value="">Select Section</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
            <input
              type="text"
              className="search-input"
              placeholder="Search by sender details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <label className="recent-chat-checkbox">
              <input
                type="checkbox"
                checked={showRecentChat}
                onChange={(e) => setShowRecentChat(e.target.checked)}
              />
              <span>Recent Chat</span>
            </label>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Chat Layout */}
          <div className="chat-layout">
            {/* Conversations List */}
            <div className="conversations-panel">
              <div className="conversations-header">
                <h3>Messages last send</h3>
              </div>
              <div className="conversations-list">
                {loading ? (
                  <div className="loading-message">Loading conversations...</div>
                ) : displayList.length === 0 ? (
                  <div className="empty-message">
                    {selectedClass || selectedSection ? (
                      <div>
                        <p>No {selectedSenderType !== 'All' ? getSenderTypeLabel(selectedSenderType).toLowerCase() : 'users'} found for</p>
                        {selectedClass && selectedSection && (
                          <p className="filter-info"><strong>{selectedClass} - {selectedSection}</strong></p>
                        )}
                        {selectedClass && !selectedSection && (
                          <p className="filter-info"><strong>Class: {selectedClass}</strong></p>
                        )}
                        {!selectedClass && selectedSection && (
                          <p className="filter-info"><strong>Section: {selectedSection}</strong></p>
                        )}
                        {selectedSenderType !== 'All' && (
                          <p className="filter-info">User Type: {getSenderTypeLabel(selectedSenderType)}</p>
                        )}
                        {searchTerm && (
                          <p className="filter-info">Search: "{searchTerm}"</p>
                        )}
                        <p style={{ marginTop: '10px', fontSize: '13px', color: '#999' }}>
                          Try adjusting your filters or check if users exist for this selection.
                        </p>
                      </div>
                    ) : searchTerm ? (
                      <div>
                        <p>No users found for</p>
                        <p className="filter-info">Search: "<strong>{searchTerm}</strong>"</p>
                        <p style={{ marginTop: '10px', fontSize: '13px', color: '#999' }}>
                          Try a different search term or clear the search.
                        </p>
                      </div>
                    ) : selectedSenderType !== 'All' ? (
                      <div>
                        <p>No {getSenderTypeLabel(selectedSenderType).toLowerCase()} found.</p>
                        <p style={{ marginTop: '10px', fontSize: '13px', color: '#999' }}>
                          No {getSenderTypeLabel(selectedSenderType).toLowerCase()} match the current filters.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p>No conversations found.</p>
                        <p style={{ marginTop: '10px', fontSize: '13px', color: '#999' }}>
                          When users send messages, they will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  displayList.map((conv) => (
                    <div
                      key={`${conv.sender_id}_${conv.sender_type}`}
                      className={`conversation-item ${selectedConversation?.sender_id === conv.sender_id && selectedConversation?.sender_type === conv.sender_type ? 'active' : ''} ${conv.unreadCount > 0 ? 'unread' : ''} ${!conv.hasMessages ? 'no-messages' : ''}`}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div className="conversation-avatar">
                        {getSenderTypeIcon(conv.sender_type)}
                      </div>
                      <div className="conversation-info">
                        <div className="conversation-header">
                          <span className="conversation-name">{conv.sender_name}</span>
                          {conv.lastMessage && (
                            <span className="conversation-time">
                              {formatDate(conv.lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        <div className="conversation-preview">
                          {conv.lastMessage ? (
                            <>
                              <span className="preview-text">
                                {conv.lastMessage.sender_id === 'admin'
                                  ? `You: ${(conv.lastMessage.message || '').substring(0, 30)}${(conv.lastMessage.message || '').length > 30 ? '...' : ''}`
                                  : `${(conv.lastMessage.message || '').substring(0, 30)}${(conv.lastMessage.message || '').length > 30 ? '...' : ''}`}
                              </span>
                              {conv.unreadCount > 0 && (
                                <span className="unread-indicator">{conv.unreadCount}</span>
                              )}
                            </>
                          ) : (
                            <span className="preview-text no-messages-text">No messages yet</span>
                          )}
                        </div>
                        {(conv.studentInfo || conv.facultyInfo) && (
                          <div className="conversation-meta">
                            {conv.studentInfo && (
                              <span>{conv.studentInfo.class} - {conv.studentInfo.section}</span>
                            )}
                            {conv.facultyInfo && (
                              <span>{conv.facultyInfo.designation || 'Staff'}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Panel */}
            <div className="chat-panel">
              {selectedConversation ? (
                <>
                  <div className="chat-header">
                    <div className="chat-header-info">
                      <span className="chat-avatar">{getSenderTypeIcon(selectedConversation.sender_type)}</span>
                      <div>
                        <h3>{selectedConversation.sender_name}</h3>
                        <p className="chat-type">{getSenderTypeLabel(selectedConversation.sender_type)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="chat-messages">
                    {conversationMessages.map((msg, idx) => {
                      const isAdminMessage = msg.sender_id === 'admin' || (msg.sender_type === 'other' && msg.sender_name === 'Admin');
                      const prevMsg = idx > 0 ? conversationMessages[idx - 1] : null;
                      const showDate = !prevMsg || 
                        new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="message-date-divider">
                              {new Date(msg.created_at).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          )}
                          <div className={`message-bubble ${isAdminMessage ? 'admin' : 'sender'}`}>
                            {!isAdminMessage && (
                              <div className="message-sender-name">{msg.sender_name}</div>
                            )}
                            <div className="message-content">
                              {msg.message}
                              {renderAttachment(msg.attachment_path, msg.attachment_name)}
                            </div>
                            <div className="message-time">{formatTime(msg.created_at)}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="chat-input-container">
                    {selectedFile && (
                      <div className="file-preview">
                        <span>📎 {selectedFile.name}</span>
                        <button
                          className="remove-file-btn"
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <div className="chat-input-wrapper">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="file-input"
                        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="file-input" className="attachment-btn">
                        📎
                      </label>
                      <input
                        type="text"
                        className="chat-input"
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <button
                        className="send-btn"
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() && !selectedFile}
                      >
                        ✈️
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-conversation-selected">
                  <p>Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminMessages;
