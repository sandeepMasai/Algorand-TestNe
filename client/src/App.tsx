import { useEffect, useMemo, useState } from 'react'
import './App.css'

function App() {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [mnemonic, setMnemonic] = useState('')
  const [note, setNote] = useState('')

  const [txId, setTxId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])

  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE || 'http://localhost:3001/api/v1', [])

  useEffect(() => {
    let timer: number | undefined
    if (txId && status === 'pending') {
      timer = window.setInterval(async () => {
        try {
          const res = await fetch(`${apiBase}/algorand/status/${txId}`)
          const data = await res.json()
          if (data?.status) {
            setStatus(data.status)
          }
          if (data?.status === 'confirmed' || data?.status === 'failed') {
            if (timer) window.clearInterval(timer)
            // refresh transactions
            fetchTransactions()
          }
        } catch {}
      }, 2500)
    }
    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [txId, status, apiBase])

  async function fetchTransactions() {
    try {
      const res = await fetch(`${apiBase}/algorand/transactions`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setTransactions(data)
      }
    } catch {}
  }

  useEffect(() => {
    fetchTransactions()
  }, [apiBase])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)
    setTxId(null)
    setStatus(null)
    try {
      const res = await fetch(`${apiBase}/algorand/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          amount: typeof amount === 'number' ? amount : Number(amount),
          mnemonic,
          note: note || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to send transaction')
      }
      const data = await res.json()
      setTxId(data.txId)
      setStatus(data.status || 'pending')
      fetchTransactions()
    } catch (err: any) {
      setError(err?.message || 'Unknown error')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <h1>Algorand TestNet Sender</h1>
      <form className="card" onSubmit={handleSend}>
        <label>
          Recipient Address
          <input placeholder="TW3A3ZK4HPAQ3FGBGGQJW6CA67U65M4TDKH3DH645EYL46P37NA2T6Z2MI" value={to} onChange={e => setTo(e.target.value)} required />
        </label>
        <label>
          Amount (ALGO)
          <input type="number" min="0" step="0.000001" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} required />
        </label>
        <label>
          Sender Mnemonic (Test Only)
          <textarea placeholder="25-word mnemonic" value={mnemonic} onChange={e => setMnemonic(e.target.value)} required />
        </label>
        <label>
          Note (optional)
          <input value={note} onChange={e => setNote(e.target.value)} />
        </label>
        <button type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send ALGO'}</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {txId && (
        <div className="card">
          <div><strong>Transaction ID:</strong> {txId}</div>
          <div><strong>Status:</strong> {status}</div>
          {status === 'confirmed' && <div>Confirmed ✅</div>}
          {status === 'failed' && <div>Failed ❌</div>}
        </div>
      )}

      <div className="card">
        <h2>Saved Transactions</h2>
        <div style={{ maxHeight: 260, overflow: 'auto' }}>
          {transactions.length === 0 && <div>No transactions yet.</div>}
          {transactions.map(tx => (
            <div key={tx.txId} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
              <div><strong>{tx.txId}</strong></div>
              <div>From: {tx.from}</div>
              <div>To: {tx.to}</div>
              <div>Amount: {tx.amount} ALGO</div>
              <div>Status: {tx.status} {tx.confirmedRound ? `(Round ${tx.confirmedRound})` : ''}</div>
              <div>At: {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '-'}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default App
