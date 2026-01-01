
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Manage.css';

interface Message {
    id: number;
    user_id: number;
    sender_name: string;
    sender_role: string;
    message: string;
    created_at: string;
    workspace_id?: number;
    read_at?: string; // New: Read Receipt
}

interface Document {
    id: number;
    name: string;
    url: string;
    uploader_name: string;
    created_at: string;
    type?: string;
    verified?: boolean; // New: Verification Badge
}

const ProjectWorkspace: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isTyping, setIsTyping] = useState(false);


    const [activeTab, setActiveTab] = useState<'chat' | 'docs' | 'external' | 'timeline'>('chat');

    const [workspace, setWorkspace] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [externalData, setExternalData] = useState<any>(null);
    const [timeline, setTimeline] = useState<any[]>([]);

    const [uploadConfig, setUploadConfig] = useState({ name: '', type: 'DPR', showForm: false });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Quick Replies + New Dept Suggestions
    const QUICK_REPLIES = ['Hi', 'Status Update', 'Request Funds', 'Schedule Inspection'];
    const DEPT_SUGGESTIONS = [
        "Increase number of classrooms based on enrollment.",
        "Ensure PHC has 24x7 water supply.",
        "Verify land ownership records before next phase."
    ];

    useEffect(() => {
        if (projectId) fetchWorkspace();
    }, [projectId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const fetchWorkspace = async () => {
        try {
            const res = await api.get(`/workspace/project/${projectId}`);
            setWorkspace(res.data);
            fetchTabData(res.data.id, activeTab);
        } catch (error) {
            console.error(error);
            alert('Failed to load workspace. Ensure project is Sanctioned.');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const fetchTabData = async (wsId: number, tab: string) => {
        try {
            if (tab === 'chat') {
                const res = await api.get(`/workspace/${wsId}/messages`);
                setMessages(res.data);
            } else if (tab === 'docs') {
                const res = await api.get(`/workspace/${wsId}/documents`);
                // Mock verification status for demo
                const docsWithVerification = res.data.map((d: any, i: number) => ({
                    ...d,
                    verified: i % 2 === 0 // Mock: every second doc is verified
                }));
                setDocuments(docsWithVerification);
            } else if (tab === 'external') {
                const res = await api.get(`/workspace/${wsId}/external-data`);
                setExternalData(res.data);
            } else if (tab === 'timeline') {
                const res = await api.get(`/workspace/${wsId}/timeline`);
                setTimeline(res.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (workspace) fetchTabData(workspace.id, activeTab);
    }, [activeTab, workspace]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !workspace) return;

        const msgText = newMessage;
        setNewMessage('');
        setIsTyping(true);

        try {
            const res = await api.post(`/workspace/${workspace.id}/messages`, { message: msgText });
            setMessages(prev => [...prev, res.data]);

            // Simulate 3s delay for system reply
            setTimeout(() => {
                let replyContent = "The Ministry acknowledges your update. Proceed with the next milestone.";
                const lowerMsg = msgText.toLowerCase();

                if (lowerMsg.includes('status')) replyContent = "SYSTEM UPDATE: Project metrics have been logged. Please upload site photos.";
                else if (lowerMsg.includes('fund') || lowerMsg.includes('req')) replyContent = "FINANCE ALERT: Fund requisition logged. Validation in progress (3-5 days).";
                else if (lowerMsg.includes('inspection') || lowerMsg.includes('schedule')) replyContent = "SCHEDULING: Field Officer assigned for site visit. Please ensure records are ready.";
                else if (lowerMsg === 'hi' || lowerMsg === 'hello') replyContent = `Greetings from the ${workspace.department}. Select an action to proceed.`;

                const botMsg: Message = {
                    id: Date.now(),
                    user_id: 999999, // Force Green/Left
                    message: replyContent,
                    sender_name: 'Ministerial System',
                    sender_role: 'System',
                    created_at: new Date().toISOString(),
                    workspace_id: workspace.id,
                    read_at: new Date().toISOString()
                };

                setMessages(prev => [...prev.map(m => ({ ...m, read_at: new Date().toISOString() })), botMsg]); // Mark previous as read when replying
                setIsTyping(false);
            }, 3000);

        } catch (e) {
            console.error(e);
            setIsTyping(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspace || !uploadConfig.name) return;

        try {
            await api.post(`/workspace/${workspace.id}/documents`, {
                name: uploadConfig.name,
                url: 'https://example.com/mock-doc.pdf',
                type: uploadConfig.type
            });
            fetchTabData(workspace.id, 'docs');
            setUploadConfig({ name: '', type: 'DPR', showForm: false });
        } catch (e) {
            console.error(e);
            alert('Upload failed');
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Workspace...</div>;

    // derived insights
    const isHealth = workspace?.department?.includes('Health');
    const isEdu = workspace?.department?.includes('Education');
    const autoInsight = isHealth
        ? "The nearest PHC is 9 km away. This project improves accessibility."
        : (isEdu ? "Nearby 3 villages lack libraries. This project helps close the infrastructure gap." : "This project aligns with the district development master plan.");

    return (
        <div className="village-detail-view" style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>

            {/* Header Section with Profile Card & Insights */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

                {/* Main Header Info */}
                <div style={{ background: 'linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)', borderRadius: '12px', padding: '1.5rem', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', marginBottom: '1rem' }}>&larr; Back</button>
                        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Project Workspace</h1>
                        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>{workspace?.department} • District Project Office</p>
                    </div>
                    {/* Project Stage Timeline */}
                    <div style={{ marginTop: '2rem' }}>
                        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, marginBottom: '0.5rem' }}>Project Progress</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                            {/* Line */}
                            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '2px', background: 'rgba(255,255,255,0.3)', zIndex: 0 }}></div>

                            {['Sanctioned', 'Shared', 'Technical', 'Started', 'Monitoring', 'Completed'].map((stage, idx) => (
                                <div key={stage} style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                                    <div style={{
                                        width: '12px', height: '12px', borderRadius: '50%', background: idx < 3 ? '#4caf50' : (idx === 3 ? '#ffeb3b' : 'white'),
                                        margin: '0 auto', border: '2px solid rgba(255,255,255,0.5)'
                                    }}></div>
                                    <div style={{ fontSize: '0.7rem', marginTop: '4px', color: 'white' }}>{stage}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Officer Profile & Insights Card */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                        <div style={{ width: '50px', height: '50px', background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👨‍💼</div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>Rajesh Kumar</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Designated Officer • {workspace?.department}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Smart Insight 🤖</div>
                        <div style={{ background: '#f0f7ff', padding: '0.8rem', borderRadius: '8px', borderLeft: '3px solid #1976d2', fontSize: '0.85rem', color: '#444', fontStyle: 'italic' }}>
                            "{autoInsight}"
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid #eee' }}>
                {['chat', 'docs', 'external', 'timeline'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        style={{
                            flex: 1, padding: '0.8rem', border: 'none',
                            background: activeTab === tab ? '#e3f2fd' : 'transparent',
                            color: activeTab === tab ? '#1565c0' : '#666',
                            borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab === 'external' ? 'Dept. Data' : tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #ddd', minHeight: '500px', padding: '0' }}>

                {activeTab === 'chat' && (
                    <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                        {/* Chat Header / Controls */}
                        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={async () => {
                                    if (confirm('Clear all chat history?')) {
                                        await api.delete(`/workspace/${workspace?.id}/messages`);
                                        setMessages([]);
                                    }
                                }}
                                style={{ color: '#999', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                🗑️ Clear Chat
                            </button>
                        </div>

                        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: '#f8f9fa' }}>
                            {messages.length === 0 && <div style={{ color: '#999', textAlign: 'center', marginTop: '2rem' }}>No messages yet. Start the conversation!</div>}
                            {messages.map(msg => {
                                const isMe = msg.user_id === user?.id;
                                return (
                                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ maxWidth: '75%' }}>
                                            {!isMe && <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px', marginLeft: '4px' }}>{msg.sender_name}</div>}

                                            <div style={{
                                                background: isMe ? '#e3f2fd' : '#2e7d32', // Solid Green for Bot
                                                color: isMe ? '#333' : 'white',
                                                padding: '1rem',
                                                borderRadius: '12px',
                                                borderTopRightRadius: isMe ? '2px' : '12px',
                                                borderTopLeftRadius: isMe ? '12px' : '2px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                position: 'relative'
                                            }}>
                                                {msg.message}
                                                {/* Verification Badge for Bot Messages */}
                                                {!isMe && (
                                                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span>✔ Verified by {workspace.department}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Time & Read Receipt */}
                                            <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '4px', marginTop: '4px', paddingRight: '4px' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#999' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isMe && (
                                                    <span style={{ fontSize: '0.8rem', color: '#2196f3', fontWeight: 'bold' }}>✓✓ Seen by Dept</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                            {isTyping && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem', color: '#888', fontStyle: 'italic' }}>
                                    <div className="typing-dot" style={{ width: '8px', height: '8px', background: '#ccc', borderRadius: '50%', animation: 'bounce 1s infinite' }}></div>
                                    Department is typing...
                                </div>
                            )}
                        </div>

                        {/* Suggestions & Quick Replies */}
                        <div style={{ padding: '1rem', borderTop: '1px solid #eee', background: 'white' }}>
                            <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Dept. Suggestions</div>
                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                                {DEPT_SUGGESTIONS.map(sugg => (
                                    <button key={sugg} onClick={() => setNewMessage(sugg)} style={{
                                        padding: '0.5rem 1rem', borderRadius: '20px', border: '1px dashed #2196f3', background: '#f5faff', color: '#1565c0', fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer'
                                    }}>
                                        ✨ {sugg}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem' }}>
                                {QUICK_REPLIES.map(reply => (
                                    <button key={reply} onClick={() => setNewMessage(reply)} style={{
                                        padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid #e0e0e0', background: 'white', color: '#444', fontSize: '0.85rem', whiteSpace: 'nowrap', cursor: 'pointer'
                                    }}>
                                        {reply}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    style={{ flex: 1, padding: '1rem', borderRadius: '30px', border: '1px solid #ddd', fontSize: '1rem', paddingLeft: '1.5rem', outline: 'none' }}
                                />
                                <button type="submit" style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: '#1976d2', color: 'white', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    ➤
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Docs Tab */}
                {activeTab === 'docs' && (
                    <div style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0 }}>Project Documents</h2>
                            <button onClick={() => setUploadConfig({ ...uploadConfig, showForm: !uploadConfig.showForm })} className="btn-primary">+ Upload New</button>
                        </div>

                        {uploadConfig.showForm && (
                            <form onSubmit={handleUpload} style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                                <input
                                    value={uploadConfig.name}
                                    onChange={e => setUploadConfig({ ...uploadConfig, name: e.target.value })}
                                    placeholder="Document Name (e.g. Site Report)"
                                    style={{ padding: '0.8rem', width: '100%', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                    required
                                />
                                <button type="submit" className="btn-primary">Upload</button>
                            </form>
                        )}

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {documents.map(doc => (
                                <div key={doc.id} className="doc-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ fontSize: '2rem', color: '#e53935' }}>📄</div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{doc.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                Uploaded by {doc.uploader_name} • {new Date(doc.created_at).toLocaleDateString()}
                                            </div>
                                            {/* Verification Badge */}
                                            {doc.verified && (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px' }}>
                                                    <span>✔ Verified by {workspace.department}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button style={{ color: '#1976d2', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>Download ↓</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* External Data Tab */}
                {activeTab === 'external' && externalData && (
                    <div style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            {externalData.stats.map((stat: any, i: number) => (
                                <div key={i} style={{ background: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1976d2', marginBottom: '0.5rem' }}>{stat.value}</div>
                                    <div style={{ color: '#666', fontWeight: '500' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '0.5rem' }}>Government Schemes</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                            {externalData.schemes?.map((scheme: any, idx: number) => (
                                <div key={idx} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #ff9800', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{scheme.name}</div>
                                    <div style={{ color: '#666', fontSize: '0.9rem', margin: '0.5rem 0' }}>{scheme.benefit}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                    <div style={{ padding: '2rem' }}>
                        {timeline.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '1.5rem', paddingBottom: '1.5rem', borderLeft: '2px solid #e0e0e0', paddingLeft: '1.5rem', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '-9px', top: '0', width: '16px', height: '16px', borderRadius: '50%', background: '#1976d2', border: '3px solid white' }}></div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#333' }}>{item.actor_name}</div>
                                    <div style={{ color: '#666', marginTop: '4px' }}>{item.content}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '8px' }}>{new Date(item.created_at).toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProjectWorkspace;
