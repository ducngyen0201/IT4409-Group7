import React, { useState, useEffect, useContext } from 'react';
import axiosClient from '../../api/axiosClient';
import { AuthContext } from '../../context/AuthContext';
import { MessageSquare, Send, ChevronDown, ChevronUp, CornerDownRight, Plus, Lock, Trash2 } from 'lucide-react';

function DiscussionSection({ lectureId, lectureTitle, isTeacher }) {
  const { user } = useContext(AuthContext);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [posts, setPosts] = useState([]); // Chứa danh sách bình luận đã lồng ghép (nested)
  
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // 1. Lấy danh sách Threads khi bài giảng thay đổi
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`/api/lectures/${lectureId}/threads`);
        setThreads(res.data);
        if (res.data.length > 0) setActiveThreadId(res.data[0].id);
      } catch (err) {
        console.error("Lỗi lấy danh sách thread:", err);
      } finally {
        setLoading(false);
      }
    };
    if (lectureId) fetchThreads();
  }, [lectureId]);

  // 2. Lấy Posts khi Thread thay đổi
  useEffect(() => {
    const fetchPosts = async () => {
      if (!activeThreadId) return;
      try {
        const res = await axiosClient.get(`/api/threads/${activeThreadId}/posts`);
        // Chuyển dữ liệu phẳng thành cây để hiển thị replies
        const nestedData = buildTree(res.data);
        setPosts(nestedData);
      } catch (err) {
        console.error("Lỗi lấy bình luận:", err);
      }
    };
    fetchPosts();
  }, [activeThreadId]);

  // --- LOGIC: Chuyển mảng phẳng từ Database thành cấu trúc cây ---
  const buildTree = (flatList) => {
    const postMap = {};
    const tree = [];
    flatList.forEach(item => {
      postMap[item.id] = { ...item, replies: [] };
    });
    flatList.forEach(item => {
      if (item.parent_post_id && postMap[item.parent_post_id]) {
        postMap[item.parent_post_id].replies.push(postMap[item.id]);
      } else if (!item.parent_post_id) {
        tree.push(postMap[item.id]);
      }
    });
    return tree;
  };

  // 3. Xử lý tạo Thread mới
  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim()) return;
    try {
      const res = await axiosClient.post(`/api/lectures/${lectureId}/threads`, { title: newThreadTitle });
      setThreads([res.data, ...threads]);
      setActiveThreadId(res.data.id);
      setNewThreadTitle('');
    } catch (err) {
      alert("Lỗi tạo chủ đề");
    }
  };

  // 4. Gửi bình luận cấp 1
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activeThreadId) return;
    try {
      const res = await axiosClient.post(`/api/threads/${activeThreadId}/posts`, { body: newComment });
      const newPost = { ...res.data, author_name: user.full_name, replies: [] };
      setPosts([newPost, ...posts]);
      setNewComment('');
    } catch (err) {
      alert("Lỗi gửi bình luận");
    }
  };

  // 5. Gửi phản hồi (Reply)
  const handlePostReply = async (parentId) => {
    if (!replyText[parentId]?.trim()) return;
    try {
      const res = await axiosClient.post(`/api/threads/${activeThreadId}/posts`, { 
        body: replyText[parentId], 
        parent_post_id: parentId 
      });
      const newReply = { ...res.data, author_name: user.full_name };
      setPosts(prev => prev.map(p => p.id === parentId ? { ...p, replies: [...p.replies, newReply] } : p));
      setReplyText({ ...replyText, [parentId]: '' });
      setActiveReplyId(null);
      toggleExpand(parentId, true);
    } catch (err) {
      alert("Lỗi gửi phản hồi");
    }
  };

  // 6. Đặc quyền Giáo viên: Đóng Thread
  const handleCloseThread = async (threadId) => {
    if (!window.confirm("Bạn muốn đóng chủ đề thảo luận này?")) return;
    try {
      await axiosClient.put(`/api/threads/${threadId}/close`);
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, closed_at: new Date() } : t));
    } catch (err) {
      alert("Không thể đóng chủ đề");
    }
  };

  const toggleExpand = (id, forceOpen = false) => {
    const newSet = new Set(expandedComments);
    if (forceOpen || !newSet.has(id)) newSet.add(id);
    else newSet.delete(id);
    setExpandedComments(newSet);
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  return (
    <div className="flex flex-col h-full bg-white text-gray-800">
      {/* THREAD SELECTOR */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-xs flex items-center gap-1.5 text-gray-600 uppercase tracking-wider">
            <MessageSquare size={14} className="text-indigo-600" /> Chủ đề thảo luận
          </h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {threads.map(t => (
            <div key={t.id} className="relative group shrink-0">
              <button
                onClick={() => setActiveThreadId(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all 
                  ${activeThreadId === t.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
              >
                {t.closed_at && <Lock size={10} className="inline mr-1" />}
                {t.title}
              </button>
              {isTeacher && !t.closed_at && (
                <button 
                  onClick={() => handleCloseThread(t.id)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  title="Đóng chủ đề"
                >
                  <Lock size={10} />
                </button>
              )}
            </div>
          ))}
          <form onSubmit={handleCreateThread} className="flex gap-1">
            <input 
              className="text-xs border rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 w-28 bg-white" 
              placeholder="+ Chủ đề..." 
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
            />
          </form>
        </div>
      </div>

      {/* DANH SÁCH BÌNH LUẬN */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white custom-scrollbar">
        {!activeThreadId ? (
          <div className="text-center mt-10 text-gray-400 text-sm italic">Hãy chọn một chủ đề để xem thảo luận</div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="group">
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${post.author_role === 'TEACHER' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {post.author_name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className={`p-3 rounded-2xl rounded-tl-none shadow-sm transition-colors ${post.author_role === 'TEACHER' ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <p className={`text-[11px] font-bold ${post.author_role === 'TEACHER' ? 'text-indigo-700' : 'text-gray-600'}`}>
                        {post.author_name} {post.author_role === 'TEACHER' && <span className="ml-1 text-[9px] bg-indigo-200 px-1 rounded">GIẢNG VIÊN</span>}
                      </p>
                      <span className="text-[9px] text-gray-400">{new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-800">{post.body}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1.5 ml-1">
                    {!activeThread?.closed_at && (
                      <button 
                        onClick={() => setActiveReplyId(activeReplyId === post.id ? null : post.id)}
                        className="text-[11px] font-bold text-gray-400 hover:text-indigo-600"
                      >
                        Trả lời
                      </button>
                    )}

                    {post.replies?.length > 0 && (
                      <button 
                        onClick={() => toggleExpand(post.id)}
                        className="text-[11px] font-bold text-indigo-600 flex items-center gap-1"
                      >
                        {expandedComments.has(post.id) ? (
                          <><ChevronUp size={14}/> Thu gọn</>
                        ) : (
                          <><ChevronDown size={14}/> {post.replies.length} phản hồi</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* HIỂN THỊ REPLIES */}
              {expandedComments.has(post.id) && (
                <div className="ml-10 mt-3 space-y-4 border-l-2 border-indigo-50 pl-4">
                  {post.replies.map(reply => (
                    <div key={reply.id} className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${reply.author_role === 'TEACHER' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {reply.author_name?.charAt(0)}
                      </div>
                      <div className={`flex-1 p-2.5 rounded-xl shadow-sm ${reply.author_role === 'TEACHER' ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50/50'}`}>
                        <p className={`text-[10px] font-bold mb-0.5 ${reply.author_role === 'TEACHER' ? 'text-indigo-700' : 'text-gray-500'}`}>
                          {reply.author_name}
                        </p>
                        <p className="text-xs text-gray-700">{reply.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Ô NHẬP REPLY */}
              {activeReplyId === post.id && (
                <div className="ml-11 flex gap-2 mt-3">
                  <input 
                    className="flex-1 text-xs border-b border-indigo-200 focus:border-indigo-600 outline-none py-1 transition-all"
                    placeholder="Viết phản hồi công khai..."
                    value={replyText[post.id] || ''}
                    onChange={(e) => setReplyText({...replyText, [post.id]: e.target.value})}
                    autoFocus
                  />
                  <button onClick={() => handlePostReply(post.id)} className="text-indigo-600 hover:scale-110 transition"><Send size={16}/></button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* INPUT BÌNH LUẬN CHÍNH */}
      {activeThreadId && !activeThread?.closed_at ? (
        <div className="p-4 border-t bg-white">
          <form onSubmit={handlePostComment} className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all border border-transparent focus-within:border-indigo-200">
            <input 
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Hỏi đáp về bài giảng này..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <button type="submit" className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : activeThread?.closed_at && (
        <div className="p-4 border-t bg-gray-50 text-center text-gray-400 text-xs font-bold flex items-center justify-center gap-2 uppercase">
          <Lock size={14} /> Chủ đề này đã bị khóa bởi giảng viên
        </div>
      )}
    </div>
  );
}

export default DiscussionSection;