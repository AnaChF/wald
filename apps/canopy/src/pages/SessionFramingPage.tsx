import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../api';
import { useCanopyStore } from '../store';

export function SessionFramingPage() {
  const navigate = useNavigate();
  const setSession = useCanopyStore((s) => s.setSession);

  const [question, setQuestion] = useState('');
  const [title, setTitle] = useState('');
  const [years, setYears] = useState(10);
  const [unit, setUnit] = useState<'years' | 'decades'>('years');
  const [centre, setCentre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveYears = unit === 'decades' ? years * 10 : years;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    try {
      const session = await createSession({
        title: title || null,
        foresight_question: question,
        centre_description: centre || null,
        time_horizon_years: effectiveYears,
      } as any);
      setSession(session);
      navigate(`/canopy/session/${session.id}/signals`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div
        className="w-full max-w-xl rounded-2xl px-10 py-12"
        style={{ background: 'rgba(245,240,232,0.05)', border: '1px solid rgba(245,240,232,0.1)' }}
      >
        <h1
          className="font-cormorant font-light text-4xl mb-3"
          style={{ color: 'var(--parchment-text)' }}
        >
          What futures are you trying to see?
        </h1>
        <p
          className="font-spectral text-sm mb-10"
          style={{ color: 'rgba(245,240,232,0.4)' }}
        >
          Canopy begins with a question. Name it as specifically as you can.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label
              className="block font-mono-dm mb-2"
              style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Foresight question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What futures are available to me given…"
              rows={4}
              required
              className="w-full rounded-lg px-4 py-3 font-spectral text-base resize-none"
              style={{
                background: 'rgba(245,240,232,0.06)',
                border: '1px solid rgba(245,240,232,0.15)',
                color: 'var(--parchment-text)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              className="block font-mono-dm mb-2"
              style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Session title (optional)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name this session"
              className="w-full rounded-lg px-4 py-3 font-spectral text-base"
              style={{
                background: 'rgba(245,240,232,0.06)',
                border: '1px solid rgba(245,240,232,0.15)',
                color: 'var(--parchment-text)',
                outline: 'none',
              }}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label
                className="block font-mono-dm mb-2"
                style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                Time horizon
              </label>
              <input
                type="number"
                value={years}
                min={1}
                max={100}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full rounded-lg px-4 py-3 font-mono-dm text-base"
                style={{
                  background: 'rgba(245,240,232,0.06)',
                  border: '1px solid rgba(245,240,232,0.15)',
                  color: 'var(--parchment-text)',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label
                className="block font-mono-dm mb-2"
                style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'years' | 'decades')}
                className="rounded-lg px-3 py-3 font-mono-dm"
                style={{
                  background: 'rgba(245,240,232,0.08)',
                  border: '1px solid rgba(245,240,232,0.15)',
                  color: 'var(--parchment-text)',
                  outline: 'none',
                }}
              >
                <option value="years">years</option>
                <option value="decades">decades</option>
              </select>
            </div>
          </div>

          <div>
            <label
              className="block font-mono-dm mb-2"
              style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Your centre (optional)
            </label>
            <input
              value={centre}
              onChange={(e) => setCentre(e.target.value)}
              placeholder="Describe your position, context, or perspective"
              className="w-full rounded-lg px-4 py-3 font-spectral text-base"
              style={{
                background: 'rgba(245,240,232,0.06)',
                border: '1px solid rgba(245,240,232,0.15)',
                color: 'var(--parchment-text)',
                outline: 'none',
              }}
            />
            <p className="mt-1 font-spectral text-xs" style={{ color: 'rgba(245,240,232,0.28)', fontStyle: 'italic' }}>
              Where you stand shapes what you can see.
            </p>
          </div>

          {error && (
            <p className="font-mono-dm text-sm" style={{ color: '#D4A843' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="w-full py-4 rounded-lg font-cormorant text-xl font-light transition-slow"
            style={{
              background: loading || !question.trim() ? 'rgba(45,96,72,0.1)' : 'rgba(45,96,72,0.3)',
              border: '1px solid rgba(45,96,72,0.5)',
              color: loading || !question.trim() ? 'rgba(245,240,232,0.3)' : 'var(--parchment-text)',
              cursor: loading || !question.trim() ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Opening…' : 'Open this session'}
          </button>
        </form>
      </div>
    </div>
  );
}
