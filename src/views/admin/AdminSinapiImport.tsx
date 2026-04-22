'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

interface ImportLog {
  id: string
  estado: string
  mes_referencia: string
  desonerado: boolean
  arquivo_nome: string
  insumos_inserted: number
  insumos_updated: number
  composicoes_inserted: number
  composicoes_updated: number
  duracao_ms: number | null
  status: 'RUNNING' | 'OK' | 'ERROR'
  erros_jsonb: unknown
  created_at: string
}

interface ImportResult {
  logId: string
  status: 'OK' | 'ERROR'
  insumosInserted: number
  insumosUpdated: number
  composicoesInserted: number
  composicoesUpdated: number
  warnings: string[]
  errors: string[]
  duracaoMs: number
}

const statusIcon = {
  OK: <CheckCircle2 size={14} />,
  ERROR: <AlertCircle size={14} />,
  RUNNING: <Clock size={14} />,
}

export default function AdminSinapiImport() {
  const [logs, setLogs] = useState<ImportLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [estado, setEstado] = useState('SP')
  const [mes, setMes] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [desonerado, setDesonerado] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadLogs = useCallback(async () => {
    const { data } = await supabase
      .from('sinapi_import_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setLogs((data as unknown as ImportLog[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    async function check() {
      const { data: sess } = await supabase.auth.getSession()
      const uid = sess.session?.user?.id
      if (!uid) {
        setIsSuperAdmin(false)
        setLoading(false)
        return
      }
      const { data } = await supabase.from('users').select('is_super_admin').eq('id', uid).single()
      setIsSuperAdmin(Boolean(data?.is_super_admin))
      if (data?.is_super_admin) void loadLogs()
      else setLoading(false)
    }
    void check()
  }, [loadLogs])

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!file) return setError('Escolha um arquivo XLSX')
      setSubmitting(true)
      setError(null)
      setResult(null)
      try {
        const { data: sess } = await supabase.auth.getSession()
        const token = sess.session?.access_token
        if (!token) throw new Error('Sessão expirada')

        const form = new FormData()
        form.append('file', file)
        form.append('estado', estado)
        form.append('mes', mes)
        form.append('desonerado', String(desonerado))

        const res = await fetch('/api/admin/sinapi/import', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`)
        setResult(body as ImportResult)
        await loadLogs()
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setSubmitting(false)
      }
    },
    [file, estado, mes, desonerado, loadLogs],
  )

  const totalRowsByLog = useMemo(
    () => (l: ImportLog) =>
      l.insumos_inserted + l.insumos_updated + l.composicoes_inserted + l.composicoes_updated,
    [],
  )

  if (loading) {
    return (
      <>
        <div className="page-header">
          <h2>Importar SINAPI</h2>
        </div>
        <div className="loading">Carregando...</div>
      </>
    )
  }

  if (isSuperAdmin === false) {
    return (
      <>
        <div className="page-header">
          <h2>Importar SINAPI</h2>
        </div>
        <div className="card">
          <div className="empty-state">
            <h3>Acesso restrito</h3>
            <p>Apenas super-admin Quantify pode importar SINAPI.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Importar SINAPI</h2>
          <p>Upload do XLSX mensal da Caixa. Idempotente por (código, estado, mês, desonerado).</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={submit}>
          <div className="grid grid-3" style={{ gap: 12, marginBottom: 12 }}>
            <div>
              <label className="form-label">Estado (UF)</label>
              <input
                className="form-input"
                value={estado}
                maxLength={2}
                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div>
              <label className="form-label">Mês de referência</label>
              <input
                className="form-input"
                type="date"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Desonerado</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 8 }}>
                <input
                  type="checkbox"
                  id="desonerado"
                  checked={desonerado}
                  onChange={(e) => setDesonerado(e.target.checked)}
                />
                <label htmlFor="desonerado">Com desoneração</label>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="form-label">Arquivo XLSX</label>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
            <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              Planilha deve conter sheets &quot;Insumos&quot; e &quot;Composicoes&quot; com cabeçalhos padronizados.
            </p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting || !file}>
            <Upload size={14} />
            {submitting ? ' Importando...' : ' Importar'}
          </button>
        </form>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '3px solid #C0392B' }}>
          <strong>Erro:</strong> {error}
        </div>
      )}

      {result && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3>
              {result.status === 'OK' ? 'Importação concluída' : 'Importação com erros'}
            </h3>
            <span className={`badge ${result.status === 'OK' ? 'badge-validated' : 'badge-rejected'}`}>
              {result.status}
            </span>
          </div>
          <div className="grid grid-3" style={{ gap: 12 }}>
            <div>
              <div className="kpi-label">Insumos</div>
              <div>
                {result.insumosInserted} inseridos<br />
                {result.insumosUpdated} atualizados
              </div>
            </div>
            <div>
              <div className="kpi-label">Composições</div>
              <div>
                {result.composicoesInserted} inseridas<br />
                {result.composicoesUpdated} atualizadas
              </div>
            </div>
            <div>
              <div className="kpi-label">Duração</div>
              <div>{(result.duracaoMs / 1000).toFixed(1)}s</div>
            </div>
          </div>
          {result.warnings.length > 0 && (
            <details style={{ marginTop: 12 }}>
              <summary>{result.warnings.length} avisos</summary>
              <ul style={{ fontSize: 12, marginTop: 8 }}>
                {result.warnings.slice(0, 20).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Histórico (últimas 20)</h3>
        </div>
        {logs.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum import ainda.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Arquivo</th>
                <th>Estado/Mês</th>
                <th>Linhas</th>
                <th>Duração</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{new Date(l.created_at).toLocaleString('pt-BR')}</td>
                  <td style={{ fontSize: 12 }}>{l.arquivo_nome}</td>
                  <td>
                    {l.estado} / {l.mes_referencia.slice(0, 7)}{' '}
                    {l.desonerado ? '(des.)' : '(c/enc.)'}
                  </td>
                  <td>{totalRowsByLog(l)}</td>
                  <td>{l.duracao_ms ? `${(l.duracao_ms / 1000).toFixed(1)}s` : '—'}</td>
                  <td>
                    <span
                      className={`badge ${
                        l.status === 'OK' ? 'badge-validated' :
                        l.status === 'ERROR' ? 'badge-rejected' : 'badge-review'
                      }`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      {statusIcon[l.status]} {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
