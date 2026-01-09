import { useState } from 'react';

function Login({ supabase }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // session이 있으면 자동 로그인 (이메일 확인 비활성화된 경우)
      if (data.session) {
        // 세션이 있으면 자동으로 로그인됨 (App.jsx의 onAuthStateChange가 처리)
        setSuccess('회원가입이 완료되었습니다.');
      } else {
        // 이메일 확인이 필요한 경우
        setSuccess('회원가입이 완료되었습니다. 이메일을 확인해주세요. (개발 환경에서는 Supabase 대시보드에서 이메일 확인을 비활성화하거나, 이메일 링크를 확인하세요)');
        setIsSignUp(false);
      }
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', background: 'white', borderRadius: '8px' }}>
      <h2 style={{ marginBottom: '20px' }}>{isSignUp ? '회원가입' : '로그인'}</h2>
      <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
        {success && <div style={{ color: 'green', marginBottom: '15px', fontSize: '14px' }}>{success}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px' }}
        >
          {loading ? (isSignUp ? '가입 중...' : '로그인 중...') : (isSignUp ? '회원가입' : '로그인')}
        </button>
      </form>
      <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
        {isSignUp ? (
          <>
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError('');
                setSuccess('');
              }}
              style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
            >
              로그인
            </button>
          </>
        ) : (
          <>
            계정이 없으신가요?{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError('');
                setSuccess('');
              }}
              style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
            >
              회원가입
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
