import { reportingFetch } from './supabase'

const REPORT_URL = 'http://localhost:54321/functions/v1/report-app-error'

function makeResponse(status: number): Response {
  return new Response(null, { status })
}

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('reportingFetch (chokepoint des opérations échouées — #96)', () => {
  it('laisse passer une réponse 2xx sans signaler quoi que ce soit', async () => {
    const fetchMock = vi.mocked(global.fetch).mockResolvedValue(makeResponse(200))
    const res = await reportingFetch('https://api.example.com/rest/v1/patients')
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("n'alerte pas sur un 4xx (flux attendu, ex. mot de passe faux)", async () => {
    const fetchMock = vi.mocked(global.fetch).mockResolvedValue(makeResponse(400))
    await reportingFetch('https://api.example.com/auth/v1/token')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls.some(([url]) => String(url) === REPORT_URL)).toBe(false)
  })

  it('alerte sur un 5xx en POSTant vers report-app-error, avec l\'endpoint en échec comme route', async () => {
    const fetchMock = vi.mocked(global.fetch).mockResolvedValue(makeResponse(500))
    await reportingFetch('https://api.example.com/rest/v1/patients')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [reportUrl, reportInit] = fetchMock.mock.calls[1]
    expect(String(reportUrl)).toBe(REPORT_URL)
    const body = JSON.parse(String(reportInit?.body))
    expect(body).toEqual(
      expect.objectContaining({
        kind: 'failed_operation',
        message: 'HTTP 500',
        platform: 'web',
        route: 'https://api.example.com/rest/v1/patients',
      }),
    )
  })

  it('deux endpoints distincts en échec produisent des routes différentes (pas de collision de signature)', async () => {
    vi.mocked(global.fetch).mockResolvedValue(makeResponse(500))
    await reportingFetch('https://api.example.com/rest/v1/patients')
    await reportingFetch('https://api.example.com/rest/v1/appointments')
    const reportCalls = vi.mocked(global.fetch).mock.calls.filter(([url]) => String(url) === REPORT_URL)
    const routes = reportCalls.map(([, init]) => JSON.parse(String(init?.body)).route)
    expect(routes).toEqual([
      'https://api.example.com/rest/v1/patients',
      'https://api.example.com/rest/v1/appointments',
    ])
  })

  it('retire la query string de la route (évite une signature par id de ligne)', async () => {
    vi.mocked(global.fetch).mockResolvedValue(makeResponse(500))
    await reportingFetch('https://api.example.com/rest/v1/patients?id=eq.abc-123')
    const [, reportInit] = vi.mocked(global.fetch).mock.calls[1]
    expect(JSON.parse(String(reportInit?.body)).route).toBe('https://api.example.com/rest/v1/patients')
  })

  it('alerte sur un échec réseau puis relance l\'erreur originale', async () => {
    const networkError = new Error('network down')
    const fetchMock = vi.mocked(global.fetch).mockRejectedValueOnce(networkError).mockResolvedValueOnce(makeResponse(200))
    await expect(reportingFetch('https://api.example.com/rest/v1/patients')).rejects.toThrow('network down')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [reportUrl] = fetchMock.mock.calls[1]
    expect(String(reportUrl)).toBe(REPORT_URL)
  })

  it("l'échec de l'envoi du rapport lui-même n'empêche pas la réponse de remonter", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(makeResponse(503))
      .mockRejectedValueOnce(new Error('resend down'))
    const res = await reportingFetch('https://api.example.com/rest/v1/patients')
    expect(res.status).toBe(503)
  })

  it("un 5xx renvoyé par report-app-error lui-même ne se re-signale pas (anti-boucle)", async () => {
    const fetchMock = vi.mocked(global.fetch).mockResolvedValue(makeResponse(500))
    await reportingFetch(REPORT_URL)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("un échec réseau sur report-app-error lui-même ne se re-signale pas (anti-boucle)", async () => {
    const fetchMock = vi.mocked(global.fetch).mockRejectedValue(new Error('edge down'))
    await expect(reportingFetch(REPORT_URL)).rejects.toThrow('edge down')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
