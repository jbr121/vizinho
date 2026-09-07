import fs from "node:fs"
import path from "node:path"

const cachePath = process.argv[2]
const outDir = process.argv[3]
const text = fs.readFileSync(cachePath, "utf8").replace(/\r\n/g, "\n")

const webPrefix =
  /^(package\.json|package-lock\.json|tsconfig\.json|next\.config\.ts|postcss\.config\.mjs|eslint\.config\.mjs|components\.json|\.gitignore|README\.md|vitest\.config\.ts|prisma\/|src\/|public\/)/

function cleanPath(raw) {
  return raw
    .trim()
    .replace(/^[\s\uFEFF\u200B-\u200D\u2060\u00A0]+/, "")
    .replace(/[\s\u200B-\u2060\u00A0"'`]+.*$/, "")
    .replace(/\s+\d+$/, "")
    .replace(/\s+[a-zA-Z0-9]{1,3}$/, "")
}

function isValidPath(filePath) {
  return filePath.length > 0 && !/[<>:"|?*]/.test(filePath)
}

function isPath(part) {
  const line = part.trim()
  if (!line || line.includes("\n")) return false
  return webPrefix.test(cleanPath(line))
}

function fixContent(content) {
  return content
    .replace(/^:z/, "")
    .replace(/^3(?=import )/, "")
    .replace(/SessÃ\n---\nlida/g, "Sessão inválida")
    .replace(/nÃ\n---\no/g, "não")
    .replace(/SÃ\n---\n /g, "Só ")
    .replace(/orÃ\n---\namento/g, "orçamento")
    .replace(/serviÃ\n---\n/g, "serviço ")
    .replace(/tÃ\n---\ntulo/g, "título")
    .replace(/prÃ\n---\nximos/g, "próximos")
    .replace(/jÃ\n---\n /g, "já ")
    .replace(/tambÃ\n---\nm/g, "também")
    .replace(/SolicitaÃ\n---\n/g, "Solicitação ")
    .replace(/moderaÃ\n---\no/g, "moderação")
    .replace(/nÃ\n---\n nas/g, "não está")
    .replace(/mÃ\n---\nnimo/g, "mínimo")
    .replace(/Ã\n---\n /g, "é ")
    .replace(/VocÃ\n---\n/g, "Você ")
    .replace(/UsuÃ\n---\nrio atual nÃ\n---\no/g, "Usuário atual não")
    .replace(/ConcluÃ\n---\ndo/g, "Concluído")
    .replace(/anÃ\n---\nlise/g, "análise")
    .replace(/concluÃ\n---\ndo/g, "concluído")
    .replace(/conclusÃ\n---\no/g, "conclusão")
    .replace(/serviÃ\n---\no/g, "serviço")
    .replace(/apÃ\n---\ns/g, "após")
    .replace(/NÃ\n---\nvel/g, "Não foi possível")
    .replace(/atÃ\n---\no/g, "até")
    .replace(/aÃ\n---\no/g, "ação")
    .replace(/Ã\n---\n/g, "ã")
}

const parts = text.split("\n---\n")
let written = 0

for (let i = 0; i < parts.length; i++) {
  if (!isPath(parts[i])) continue
  const filePath = cleanPath(parts[i])
  if (!isValidPath(filePath)) continue
  let content = ""
  if (i + 1 < parts.length && !isPath(parts[i + 1])) {
    content = fixContent(parts[i + 1])
    i++
  }

  if (
    filePath.endsWith(".ico") ||
    filePath.endsWith(".svg") ||
    filePath.endsWith(".png") ||
    filePath.endsWith(".jpg")
  ) {
    continue
  }

  if (!content.trim() && !filePath.endsWith(".json") && !filePath.endsWith(".mjs")) {
    continue
  }

  const target = path.join(outDir, filePath)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content.trimStart(), "utf8")
  written++
  console.log("wrote", filePath)
}

console.log(`Done: ${written} files`)
