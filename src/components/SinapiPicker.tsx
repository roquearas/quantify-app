'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Database, Search, Sparkles, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  formatSinapiPrice,
  loadSinapiFilters,
  searchSinapi,
  type SinapiFilterOption,
  type SinapiSearchResult,
  type SinapiSearchType,
} from '../lib/sinapi/search'
import {
  formatScorePercent,
  scoreConfidence,
  suggestSinapi,
  type SinapiSuggestion,
} from '../lib/ai/suggestSinapi'

interface Props {
  isOpen: boolean
  defaultQuery?: string
  onClose: () => void
  onSelect: (result: SinapiSearchResult, updateCost: boolean) => Promise<void> | void
}

const SEARCH_DEBOUNCE_MS = 350

export function SinapiPicker({ isOpen, defaultQuery = '', onClose, onSelect }: Props) {
  const [filters, setFilters] = useState<SinapiFilterOption[]>([])
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [filter, setFilter] = useState<SinapiFilterOption | null>(null)
  const [query, setQuery] = useState(defaultQuery)
  const [tipo, setTipo] = useState<SinapiSearchType>('both')
  const [results, setResults] = useState<SinapiSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updateCost, setUpdateCost] = useState(true)
  const [linking, setLinking] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<SinapiSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const searchAbort = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load available filters on open
  useEffect(() => {
    if (!isOpen) return
    setLoadingFilters(true)
    setError(null)
    loadSinapiFilters(supabase)
      .then((opts) => {
        setFilters(opts)
        if (opts.length > 0 && !filter) setFilter(opts[0])
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingFilters(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Reset query to default when opening
  useEffect(() => {
    if (isOpen) setQuery(defaultQuery)
  }, [isOpen, defaultQuery])

  // Fase 2F: fetch AI fuzzy suggestions once per open+filter (uses item description)
  useEffect(() => {
    if (!isOpen || !filter || !defaultQuery.trim()) {
      setSuggestions([])
      return
    }
    let cancelled = false
    setLoadingSuggestions(true)
    suggestSinapi(supabase, {
      description: defaultQuery,
      estado: filter.estado,
      mesReferencia: filter.mesReferencia,
      desonerado: filter.desonerado,
      limit: 5,
    })
      .then((res) => {
        if (!cancelled) setSuggestions(res)
      })
      .catch(() => {
        // não derruba o picker; só oculta sugestões
        if (!cancelled) setSuggestions([])
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestions(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, filter, defaultQuery])

  // Debounced search
  useEffect(() => {
    if (!isOpen || !filter) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      if (searchAbort.current) searchAbort.current.abort()
      const ctrl = new AbortController()
      searchAbort.current = ctrl
      setSearching(true)
      setError(null)
      try {
        const res = await searchSinapi(supabase, {
          query: trimmed,
          estado: filter.estado,
          mesReferencia: filter.mesReferencia,
          desonerado: filter.desonerado,
          tipo,
          limit: 30,
        })
        if (!ctrl.signal.aborted) setResults(res)
      } catch (err) {
        if (!ctrl.signal.aborted) {
          setError(err instanceof Error ? err.message : String(err))
          setResults([])
        }
      } finally {
        if (!ctrl.signal.aborted) setSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [isOpen, filter, query, tipo])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const filterLabel = useCallback((f: SinapiFilterOption) => {
    const mes = f.mesReferencia.slice(0, 7)
    const des = f.desonerado ? 'des.' : 'c/enc.'
    return `${f.estado} · ${mes} (${des})`
  }, [])

  const noFilters = !loadingFilters && filters.length === 0

  const handleSelect = useCallback(
    async (r: SinapiSearchResult) => {
      setLinking(r.id)
      setError(null)
      try {
        await onSelect(r, updateCost)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLinking(null)
      }
    },
    [onSelect, updateCost],
  )

  // Fase 2F: ao aceitar uma sugestão, busca o registro completo via searchSinapi
  // (linkBudgetItemSinapi exige o id do registro — a sugestão só traz codigo)
  const handleAcceptSuggestion = useCallback(
    async (s: SinapiSuggestion) => {
      if (!filter) return
      setLinking(`suggestion-${s.codigo}`)
      setError(null)
      try {
        const hits = await searchSinapi(supabase, {
          query: s.codigo,
          estado: filter.estado,
          mesReferencia: filter.mesReferencia,
          desonerado: filter.desonerado,
          tipo: 'composicao',
          limit: 5,
        })
        const match = hits.find((h) => h.codigo === s.codigo && h.tipo === 'COMPOSICAO')
        if (!match) {
          setError(`Composição ${s.codigo} não encontrada no filtro atual.`)
          return
        }
        await onSelect(match, updateCost)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLinking(null)
      }
    },
    [filter, onSelect, updateCost],
  )

  const content = useMemo(() => {
    if (loadingFilters) return <div className="loading">Carregando filtros...</div>
    if (noFilters) {
      return (
        <div className="empty-state" style={{ padding: 24 }}>
          <h3>Nenhum import SINAPI concluído ainda</h3>
          <p>Peça a um super-admin para importar o XLSX em /admin/sinapi/import antes de linkar itens.</p>
        </div>
      )
    }
    if (!filter) return null

    return (
      <>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 160px',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Digite descrição ou código SINAPI..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: 30 }}
              autoFocus
            />
          </div>
          <select
            className="form-input"
            value={`${filter.estado}|${filter.mesReferencia}|${filter.desonerado}`}
            onChange={(e) => {
              const [estado, mes, des] = e.target.value.split('|')
              setFilter({
                estado,
                mesReferencia: mes,
                desonerado: des === 'true',
              })
            }}
          >
            {filters.map((f) => (
              <option
                key={`${f.estado}|${f.mesReferencia}|${f.desonerado}`}
                value={`${f.estado}|${f.mesReferencia}|${f.desonerado}`}
              >
                {filterLabel(f)}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            marginBottom: 12,
            fontSize: 12,
          }}
        >
          <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="radio"
              name="tipo"
              checked={tipo === 'both'}
              onChange={() => setTipo('both')}
            />
            Ambos
          </label>
          <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="radio"
              name="tipo"
              checked={tipo === 'insumo'}
              onChange={() => setTipo('insumo')}
            />
            Só insumos
          </label>
          <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="radio"
              name="tipo"
              checked={tipo === 'composicao'}
              onChange={() => setTipo('composicao')}
            />
            Só composições
          </label>
          <label style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
            <input
              type="checkbox"
              checked={updateCost}
              onChange={(e) => setUpdateCost(e.target.checked)}
            />
            Atualizar unit + unit_cost do item
          </label>
        </div>

        {error && (
          <div style={{ color: '#C0392B', fontSize: 12, marginBottom: 8 }}>
            <strong>Erro:</strong> {error}
          </div>
        )}

        {/* Fase 2F: sugestões AI por similaridade (pg_trgm) */}
        {(loadingSuggestions || suggestions.length > 0) && (
          <div
            data-testid="sinapi-suggestions"
            style={{
              marginBottom: 12,
              padding: 10,
              border: '1px dashed #B388EB',
              borderRadius: 4,
              background: '#FAF6FF',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: '#5B3A8A',
                marginBottom: 6,
              }}
            >
              <Sparkles size={14} />
              Sugestões IA (fuzzy-match)
              {loadingSuggestions && (
                <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                  · buscando...
                </span>
              )}
            </div>
            {!loadingSuggestions && suggestions.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Nenhuma sugestão acima do threshold.
              </div>
            )}
            {suggestions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {suggestions.map((s) => {
                  const conf = scoreConfidence(s.score)
                  const confBg =
                    conf === 'high' ? '#16A085' : conf === 'medium' ? '#E67E22' : '#95A5A6'
                  return (
                    <div
                      key={s.codigo}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '80px 60px 1fr 80px 100px 90px',
                        gap: 8,
                        alignItems: 'center',
                        fontSize: 12,
                        padding: '4px 6px',
                        background: '#fff',
                        borderRadius: 3,
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span
                        style={{
                          background: confBg,
                          color: '#fff',
                          padding: '2px 6px',
                          borderRadius: 3,
                          fontWeight: 700,
                          textAlign: 'center',
                          fontSize: 11,
                        }}
                      >
                        {formatScorePercent(s.score)}
                      </span>
                      <span style={{ fontFamily: 'monospace' }}>{s.codigo}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.descricao}
                      </span>
                      <span>{s.unidade}</span>
                      <span style={{ textAlign: 'right' }}>
                        {formatSinapiPrice(s.preco_unitario)}
                      </span>
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => handleAcceptSuggestion(s)}
                        disabled={linking !== null}
                      >
                        {linking === `suggestion-${s.codigo}` ? 'Linkando...' : 'Aceitar'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 4,
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {searching && <div style={{ padding: 16, fontSize: 12 }}>Buscando...</div>}
          {!searching && query.trim() === '' && (
            <div style={{ padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              Digite para buscar.
            </div>
          )}
          {!searching && query.trim() !== '' && results.length === 0 && (
            <div style={{ padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              Nenhum resultado pra &quot;{query}&quot; nesse filtro.
            </div>
          )}
          {results.length > 0 && (
            <table className="data-table" style={{ fontSize: 12, margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Tipo</th>
                  <th style={{ width: 100 }}>Código</th>
                  <th>Descrição</th>
                  <th style={{ width: 60 }}>Unid</th>
                  <th style={{ width: 110, textAlign: 'right' }}>Preço</th>
                  <th style={{ width: 90, textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={`${r.tipo}-${r.id}`}>
                    <td>
                      <span
                        className={`badge ${r.tipo === 'INSUMO' ? 'badge-review' : 'badge-validated'}`}
                      >
                        {r.tipo === 'INSUMO' ? 'Insumo' : 'Composição'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{r.codigo}</td>
                    <td>
                      {r.descricao}
                      {r.categoria_ou_grupo && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {r.categoria_ou_grupo}
                        </div>
                      )}
                    </td>
                    <td>{r.unidade}</td>
                    <td style={{ textAlign: 'right' }}>{formatSinapiPrice(r.preco_unitario)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => handleSelect(r)}
                        disabled={linking !== null}
                      >
                        {linking === r.id ? 'Linkando...' : 'Selecionar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    )
  }, [
    loadingFilters,
    noFilters,
    filter,
    filters,
    query,
    tipo,
    error,
    searching,
    results,
    updateCost,
    linking,
    filterLabel,
    handleSelect,
    loadingSuggestions,
    suggestions,
    handleAcceptSuggestion,
  ])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-label="Buscar SINAPI"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="card"
        style={{
          width: 'min(880px, 96vw)',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h3 style={{ display: 'flex', gap: 8, alignItems: 'center', margin: 0 }}>
            <Database size={16} /> Buscar SINAPI
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar">
            <X size={14} />
          </button>
        </div>
        {content}
      </div>
    </div>
  )
}
