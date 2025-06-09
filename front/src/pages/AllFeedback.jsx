import React, { useState, useEffect, useRef } from 'react';
import './FeedbacksPage.css';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL, {
    withCredentials: true,
});

const AllFeedback = () => {
    const [messages, setMessages] = useState([]);
    const [activeUserId, setActiveUserId] = useState(null);
    const [users, setUsers] = useState([]);
    const [replyMessage, setReplyMessage] = useState("");
    const messagesContainerRef = useRef(null);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                // Check if user is admin
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/check-session`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await response.json();

                if (!data.success || data.userId !== 1) {
                    console.error("Unauthorized access");
                    return;
                }

                // Fetch list of users who have sent feedback
                const usersResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback/users`, {
                    method: 'GET',
                    credentials: 'include',
                });
                const usersData = await usersResponse.json();

                if (usersData.length > 0) {
                    setUsers(usersData);
                    setActiveUserId(usersData[0].id);
                }
            } catch (error) {
                console.error("Error fetching admin data:", error);
            }
        };

        fetchAdminData();

        // Join admin room
        socket.emit('join', '1'); // Admin user_id is static for now
        socket.on('new_feedback', newMessage => {
            setMessages(prev => [...prev, newMessage]);
            setUsers(prevUsers => {
                if (!prevUsers.some(user => user.id === newMessage.sender_id)) {
                    return [...prevUsers, { id: newMessage.sender_id, name: newMessage.user_name }];
                }
                return prevUsers;
            });
        });

        return () => {
            socket.off('new_feedback');
        };
    }, []);

    useEffect(() => {
        if (activeUserId) {
            const fetchUserMessages = async () => {
                try {
                    const response = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/feedback/user/${activeUserId}`,
                        {
                            method: 'GET',
                            credentials: 'include',
                        }
                    );
                    const data = await response.json();
                    setMessages(data);
                } catch (error) {
                    console.error('Error fetching user messages:', error);
                }
            };
            fetchUserMessages();
        }
    }, [activeUserId]);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim() || !activeUserId) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback/reply`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: replyMessage,
                    userId: activeUserId
                }),
            });

            if (response.ok) {
                setReplyMessage("");
            } else {
                console.error('Error sending reply');
            }
        } catch (error) {
            console.error('Error sending reply:', error);
        }
    };

    return (
        <div className="whatsapp-container">
            <div className="sidebar">
                <h2 className="sidebar-title">Users</h2>
                <div className="user-list">
                    {users.length === 0 || users[0]?.id == null ? (
                        <p className="no-messages">No users yet</p>
                    ) : (
                        users.map(user => (
                            <div
                                key={user.id}
                                className={`user-item ${user.id === activeUserId ? 'active' : ''}`}
                                onClick={() => setActiveUserId(user.id)}
                            >
                                {user.name || `User ${user.id}`}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="chat-panel">
                <div className="chat-messages" ref={messagesContainerRef}>
                    {messages.length === 0 ? (
                        <p className="no-messages">No messages yet.</p>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`message-bubble ${msg.sender_id === 1 ? 'sent' : 'received'
                                    }`}
                            >
                                {msg.message?.startsWith('http') && msg.message.match(/\.(jpeg|jpg|gif|png)$/) ? (
                                    <img src={msg.message} alt="uploaded" className="chat-image" />
                                ) : (
                                    <p className="message-text">{msg.message}</p>
                                )}
                                <div className="message-meta">
                                    <span className="message-timestamp">
                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true,
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {activeUserId && (
                    <form className="chat-input-box" onSubmit={handleReply}>
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Type a reply"
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                        />
                        <button type="submit" className="send-button">Send</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AllFeedback;