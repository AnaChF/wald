import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MOCK_TERRITORIES } from '../mockData';

interface Post {
  id: string;
  bolt: string;
  content: string;
  author: string;
  time: string;
  replies: number;
}

const INIT_POSTS: Post[] = [
  { id: 'p1', bolt: 'Automation creates more anxiety than unemployment.', content: 'The real crisis is not job loss but the constant threat of it — the precarity that shapes all decisions, regardless of whether the job is actually lost.', author: 'WaldoM', time: '2 hours ago', replies: 3 },
  { id: 'p2', bolt: 'UBI cannot replace the social meaning of work.', content: 'Economic security is necessary but not sufficient. We need new forms of contribution that carry social recognition.', author: 'QuietCurator', time: 'Yesterday', replies: 7 },
  { id: 'p3', bolt: 'The gig economy is feudalism with an app.', content: 'The power asymmetry between platform and worker mirrors pre-industrial labour relations, despite the technological veneer.', author: 'BrickLayer99', time: '3 days ago', replies: 12 },
];

export function ForumPage() {
  const { territory_id } = useParams<{ territory_id: string }>();
  const territory = MOCK_TERRITORIES.find(t => t.id === territory_id);
  const [posts, setPosts] = useState<Post[]>(INIT_POSTS);
  const [newBolt, setNewBolt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handlePost = () => {
    if (!newBolt.trim()) return;
    const post: Post = {
      id: 'p' + Date.now(),
      bolt: newBolt,
      content: newContent,
      author: 'You',
      time: 'Just now',
      replies: 0,
    };
    setPosts([post, ...posts]);
    setNewBolt('');
    setNewContent('');
    setShowForm(false);
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
            {territory?.name || 'Territory Forum'}
          </h1>
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
            onChange={e => setNewBolt(e.target.value)}
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
            onChange={e => setNewContent(e.target.value)}
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
            <button onClick={handlePost} style={{
              background: '#2d5016', color: '#fff', border: 'none', borderRadius: '4px',
              fontFamily: '"DM Mono", monospace', fontSize: '12px', padding: '8px 20px', cursor: 'pointer',
            }}>
              Post
            </button>
            <button onClick={() => setShowForm(false)} style={{
              background: 'transparent', color: 'rgba(245,230,200,0.5)', border: 'none',
              fontFamily: '"DM Mono", monospace', fontSize: '12px', padding: '8px', cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {posts.map(post => (
          <div key={post.id} style={{
            background: 'rgba(245,230,200,0.04)', border: '1px solid rgba(245,230,200,0.1)',
            borderRadius: '6px', padding: '20px',
          }}>
            <div style={{
              borderLeft: '4px solid #c9940a', paddingLeft: '16px', marginBottom: '12px',
            }}>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, fontSize: '18px', margin: 0, color: '#f5e6c8' }}>
                {post.bolt}
              </p>
            </div>
            {post.content && (
              <p style={{ fontFamily: 'Spectral, serif', fontSize: '14px', color: 'rgba(245,230,200,0.75)', margin: '0 0 12px', lineHeight: 1.55 }}>
                {post.content}
              </p>
            )}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', background: 'rgba(201,148,10,0.2)', color: '#c9940a', padding: '2px 8px', borderRadius: '99px' }}>
                {post.author}
              </span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(245,230,200,0.35)' }}>
                {post.time}
              </span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(245,230,200,0.35)' }}>
                💬 {post.replies}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
