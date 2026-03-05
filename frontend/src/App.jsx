import { useState } from 'react';
import axios from 'axios';
import './App.css';

export default function App() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const checkHealth = async () => {
        setLoading(true);
        setError(null);
        setStatus(null);
        try {
            // Use Vite proxy to avoid browser CORS/network edge cases in dev.
            const res = await axios.get('http://localhost:5000/api/health');
            setStatus(res.data);
        } catch (err) {
            const backendMessage = err?.response?.data?.error || err?.response?.data?.message;
            setError(backendMessage || err.message || 'Failed to reach backend');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app">
            <div className="hero">
                <div className="badge">Micro-SaaS</div>
                <h1 className="title">Catalog <span className="accent">AI</span></h1>
                <p className="subtitle">Catalog AI Frontend Running</p>

                <button className="btn" onClick={checkHealth} disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Check Backend Health'}
                </button>

                {status && (
                    <div className="result success">
                        <div className="result-label">Backend Response</div>
                        <pre className="result-json">{JSON.stringify(status, null, 2)}</pre>
                    </div>
                )}

                {error && (
                    <div className="result error">
                        <div className="result-label">Error</div>
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
