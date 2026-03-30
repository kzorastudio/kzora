const fs = require('fs')
const path = require('path')

const getSessionCode = `import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function getAuthSession(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET
  const isProduction = process.env.NODE_ENV === 'production'
  
  let token = await getToken({ req, secret, secureCookie: isProduction })
  
  if (!token) {
    token = await getToken({ req, secret, secureCookie: false })
  }
  return token
}
`

fs.writeFileSync(path.join(process.cwd(), 'lib/getSession.ts'), getSessionCode)

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const dirFile = path.join(dir, file)
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist)
    } else {
      if (dirFile.endsWith('route.ts')) {
        filelist.push(dirFile)
      }
    }
  }
  return filelist
}

const apiDir = path.join(process.cwd(), 'app', 'api')
const files = walkSync(apiDir)

let updated = 0
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  let changed = false

  if (content.includes("import { getToken } from 'next-auth/jwt'")) {
    content = content.replace("import { getToken } from 'next-auth/jwt'", "import { getAuthSession } from '@/lib/getSession'")
    changed = true
  }

  const regex = /await getToken\(\{\s*req:\s*request,\s*secret:\s*process\.env\.NEXTAUTH_SECRET\s*\}\)/g
  if (regex.test(content)) {
    content = content.replace(regex, 'await getAuthSession(request)')
    changed = true
  }

  const regex2 = /await getToken\(\{\s*req:\s*req,\s*secret:\s*process\.env\.NEXTAUTH_SECRET\s*\}\)/g
  if (regex2.test(content)) {
    content = content.replace(regex2, 'await getAuthSession(req)')
    changed = true
  }

  if (changed) {
    fs.writeFileSync(file, content)
    console.log('Updated:', file)
    updated++
  }
}
console.log('Total fixed: ' + updated)
