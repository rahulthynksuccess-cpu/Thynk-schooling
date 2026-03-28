export const dynamic = "force-dynamic"
export async function POST() {
  const resp = Response.json({ message: 'Logged out' })
  resp.headers.set('Set-Cookie', 'ts_refresh=; HttpOnly; Path=/; Max-Age=0')
  return resp
}
