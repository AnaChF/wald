import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../store';

export function ForumPage() {
  const { territory_id } = useParams<{ territory_id: string }>();
  const { territories, posts, loadPosts, submitPost, submitReply } = useStore();
  const territory = territories.find((t) => t.id === territory_id);

  const [newBolt, setNewBolt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyTarget, setReplyTarget] = useState<string | null>(null);

  useEffect(() => {
    if (territory_id) loadPosts(territory_id);
  }, [territory_id]);

  const handlePost = async () => {
    if (!newBolt.trim() || !territory_id) return;
    await submitPost(territory_id, newBolt.trim(), newContent.trim());
    setNewBolt('');
    setNewContent('');
    setShowForm(false);
  };

  const handleReply = async (postId: string) => {
    if (!replyText.trim()) return;
    await submitReply(postId, replyText.trim());
    setReplyText('');
    setReplyTarget(null);
  };

  const relativeTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={{ background: '#1e2a18', minHeight: '100vh', color: '#f5e6c8', padding: '40px' }}>
      {/* Protocol banner */}
      <div style={{
        background: 'rgba(201,148,10,0.15)', border: '1px solid rgba(201,148,10,0.3)',
        borderRadius: '4px', padding: '12px 16px', marginBottom: '28px',
        fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#c9940a', letterSpacing: '0.06em',
      }}>
        This forum follows the Walditorium protocol: claims must be stated as BOLTs — beliefs you are prepared to defend.
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#c9940a', letterSpacing: '0.1em', marginBottom: '4px' }}>FORUM</div>
          <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '36px', margin: 0, fontWeight: 600 }}>
            {territory?.name ?? 'Territory Forum'}
          </h1>
          {territory?.seek_question && (
            <p style={{ fontFamily: 'Spectral, serif', fontSize: '14px', color: 'rgba(245,230,200,0.55)', margin: '8px 0 0' }}>
              {territory.seek_question}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: '#c9940a', color: '#fff', border: 'none', borderRadius: '4px',
            fontFamily: '"Cormorant Garamond", serif', fontSize: '16px', fontWeight: 600,
            padding: '10px 24px', cursor: 'pointer',
          }}
        >
          New Post
        </button>
      </div>

      {/* New post form */}
      {showForm && (
        <div style={{
          background: 'rgba(245,230,200,0.05)', border: '1px solid rgba(245,230,200,0.15)',
          borderRadius: '6px', padding: '24px', marginBottom: '28px',
        }}>
          <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: '#c9940a', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
            YOUR BOLT — state a belief you will defend
          </label>
          <input
            value={newBolt}
            onChange={(e) => setNewBolt(e.target.value)}
            placeholder="I believe that..."
            style={{
              width: '100%', background: 'transparent', border: 'none',
              borderBottom: '1px solid rgba(201,148,10,0.5)', outline: 'none',
              color: '#f5e6c8', fontFamily: '"Cormorant Garamond", serif', fontWeight: 600,
              fontSize: '18px', padding: '6px 0', marginBottom: '20px', boxSizing: 'border-box',
            }}
          />
          <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(245,230,200,0.5)', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
            EXPAND ON YOUR CLAIM
          </label>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Provide context, evidence, or argument..."
            rows={3}
            style={{
              width: '100%', background: 'transparent', border: '1px solid rgba(245,230,200,0.2)',
              outline: 'none', color: '#f5e6c8', fontFamily: 'Spectral, serif',
              fontSize: '14px', padding: '10px', borderRadius: '4px', resize: 'vertical',
              boxSizing: 'border-box', marginBottom: '16px',
            }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handlePost}
              disabled={!newBolt.trim()}
              style={{
                background: newBolt.trim() ? '#2d5016' : 'rgba(45,80,22,0.4)',
                color: '#fff', border: 'none', borderRadius: '4px',
                fontFamily: '"DM Mono", monospace', fontSize: '12px',
                padding: '8px 20px', cursor: newBolt.trim() ? 'pointer' : 'default',
              }}
            >
              Post
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                background: 'transparent', color: 'rgba(245,230,200,0.5)', border: 'none',
                fontFamily: '"DM Mono", monospace', fontSize: '12px', padding: '8px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div style={{
          border: '1px dashed rgba(245,230,200,0.15)', borderRadius: '6px',
          padding: '48px', textAlign: 'center',
        }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '20px', color: 'rgba(245,230,200,0.4)', margin: 0 }}>
            No posts yet. Be the first to stake a claim.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {posts.map((post) => {
            const isExpanded = expandedPost === post.id;
            return (
              <div key={post.id} style={{
                background: 'rgba(245,230,200,0.04)', border: '1px solid rgba(245,230,200,0.1)',
                borderRadius: '6px', padding: '20px',
              }}>
                {/* Bolt claim */}
                <div style={{ borderLeft: '4px solid #c9940a', paddingLeft: '16px', marginBottom: '12px' }}>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, fontSize: '18px', margin: 0, color: '#f5e6c8' }}>
                    {post.bolt_claim}
                  </p>
                </div>

                {/* Body */}
                {post.content && (
                  <p style={{ fontFamily: 'Spectral, serif', fontSize: '14px', color: 'rgba(245,230,200,0.75)', margin: '0 0 12px', lineHeight: 1.55 }}>
                    {post.content}
                  </p>
                )}

                {/* Meta row */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', background: 'rgba(201,148,10,0.2)', color: '#c9940a', padding: '2px 8px', borderRadius: '99px' }}>
                    {post.author}
                  </span>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(245,230,200,0.35)' }}>
                    {post.created_at ? relativeTime(post.created_at) : ''}
                  </span>
                  <button
                    onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: '"DM Mono", monospace', fontSize: '10px',
                      color: 'rgba(245,230,200,0.45)', padding: 0,
                    }}
                  >
                    {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'} {isExpanded ? '▲' : '▼'}
                  </button>
                  <button
                    onClick={() => { setExpandedPost(post.id); setReplyTarget(post.id); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: '"DM Mono", monospace', fontSize: '10px',
                      color: '#c9940a', padding: 0,
                    }}
                  >
                    + Reply
                  </button>
                </div>

                {/* Replies section */}
                {isExpanded && (
                  <div style={{ marginTop: '16px', paddingLeft: '20px', borderLeft: '2px solid rgba(245,230,200,0.08)' }}>
                    {post.replies.map((reply) => (
                      <div key={reply.id} style={{ marginBottom: '12px' }}>
                        <p style={{ fontFamily: 'Spectral, serif', fontSize: '13px', color: 'rgba(245,230,200,0.8)', margin: '0 0 4px', lineHeight: 1.5 }}>
                          {reply.content}
                        </p>
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', background: 'rgba(201,148,10,0.15)', color: '#c9940a', padding: '1px 6px', borderRadius: '99px', marginRight: '8px' }}>
                          {reply.author}
                        </span>
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(245,230,200,0.3)' }}>
                          {reply.created_at ? relativeTime(reply.created_at) : ''}
                        </span>
                      </div>
                    ))}

                    {/* Reply compose */}
                    {replyTarget === post.id ? (
                      <div style={{ marginTop: '12px' }}>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          rows={2}
                          autoFocus
                          style={{
                            width: '100%', background: 'transparent', border: '1px solid rgba(245,230,200,0.2)',
                            outline: 'none', color: '#f5e6c8', fontFamily: 'Spectral, serif',
                            fontSize: '13px', padding: '8px', borderRadius: '4px', resize: 'vertical',
                            boxSizing: 'border-box', marginBottom: '8px',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleReply(post.id)}
                            disabled={!replyText.trim()}
                            style={{
                              background: replyText.trim() ? '#2d5016' : 'rgba(45,80,22,0.4)',
                              color: '#fff', border: 'none', borderRadius: '4px',
                              fontFamily: '"DM Mono", monospace', fontSize: '11px',
                              padding: '6px 14px', cursor: replyText.trim() ? 'pointer' : 'default',
                            }}
                          >
                            Reply
                          </button>
                          <button
                            onClick={() => { setReplyTarget(null); setReplyText(''); }}
                            style={{
                              background: 'transparent', color: 'rgba(245,230,200,0.4)', border: 'none',
                              fontFamily: '"DM Mono", monospace', fontSize: '11px', padding: '6px', cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyTarget(post.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: '"DM Mono", monospace', fontSize: '10px',
                          color: 'rgba(245,230,200,0.4)', marginTop: '8px', padding: 0,
                        }}
                      >
                        + Add a reply
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
