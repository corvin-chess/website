#!/usr/bin/env node
/**
 * CV-028: assert website README matches README_STYLE repository template rules.
 */
import { readFileSync, existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")
const workspaceRoot = resolve(repoRoot, "..")
const readmePath = join(repoRoot, "README.md")
const licensePath = join(repoRoot, "LICENSE")
const stylePath = join(workspaceRoot, "README_STYLE.md")
const reposPath = join(workspaceRoot, "REPOS.md")

const REPO = "website"
const SKILL = "astro"
const LICENSE_ID = "AGPL-3.0-or-later"
const CLOSING =
  "Docs and ADRs belong where players and operators can read the same source of truth."

const PLANNED_AREAS =
  /^(Astro \+ Starlight scaffold|Protocol \+ ADR docs mirror|Implementation)$/i

const BUILT_AREAS = /^(README|LICENSE|CI verify gate)$/i

const fail = (msg) => {
  console.error(`FAIL: ${msg}`)
  process.exitCode = 1
}

const ok = (msg) => console.log(`OK: ${msg}`)

if (!existsSync(readmePath)) {
  fail(`missing ${readmePath}`)
  process.exit(1)
}

const readme = readFileSync(readmePath, "utf8")

const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
if (emojiRe.test(readme)) {
  fail("emoji found in README")
} else {
  ok("no emoji")
}

const requiredSections = [
  "OVERVIEW",
  "GETTING+STARTED",
  "DEVELOPMENT",
  "TESTING",
  "ARCHITECTURE",
  "STATUS",
]
for (const section of requiredSections) {
  if (!readme.includes(`lines=${section}`)) {
    fail(`missing typing SVG section title: ${section}`)
  }
}
if (!process.exitCode) ok("required section typing titles present")

const sectionAlts = [
  "Overview",
  "Getting Started",
  "Development",
  "Testing",
  "Architecture",
  "Status",
]
for (const alt of sectionAlts) {
  if (!readme.includes(`alt="${alt}"`)) {
    fail(`missing section alt text: ${alt}`)
  }
}
if (!process.exitCode) ok("section alt texts present")

if (!readme.includes(`https://github.com/corvin-chess/${REPO}`)) {
  fail(`missing self link https://github.com/corvin-chess/${REPO}`)
} else {
  ok("self repository link present")
}

if (!readme.includes(`i=${SKILL}&theme=dark`)) {
  fail(`skill icon must be i=${SKILL}&theme=dark`)
} else {
  ok(`skill icon i=${SKILL} theme=dark`)
}

if (!readme.includes("i=github&theme=dark")) {
  fail("GitHub skill icon with theme=dark missing")
} else {
  ok("GitHub skill icon present")
}

const palette = ["0b0d12", "161b2b", "2f3d63", "8fa3d9", "c9a227", "e6e9f2"]
for (const hex of palette) {
  if (!readme.toLowerCase().includes(hex.toLowerCase())) {
    fail(`palette hex missing: ${hex}`)
  }
}
if (!process.exitCode) ok("DESIGN.md palette hexes present")

if (!readme.includes("capsule-render.vercel.app")) {
  fail("capsule-render header/footer missing")
} else {
  ok("capsule-render present")
}

if (!readme.includes("readme-typing-svg.demolab.com")) {
  fail("typing SVG missing")
} else {
  ok("typing SVG present")
}

const headerTypingMatch = readme.match(
  /readme-typing-svg\.demolab\.com\?[^"']*lines=([^"'&]+)/
)
if (!headerTypingMatch) {
  fail("could not parse header typing lines=")
} else {
  const linesParam = headerTypingMatch[1]
  if (/\s/.test(linesParam)) {
    fail("typing SVG lines= contains raw whitespace; encode spaces as +")
  }
  if (!linesParam.startsWith(`${REPO};`)) {
    fail(`typing SVG lines= must start with ${REPO};`)
  }
  ok(`typing SVG lines= encoded and starts with ${REPO};`)
}

if (!readme.includes(`<i>${CLOSING}</i>`)) {
  fail("closing sentence missing or altered")
} else {
  ok("closing sentence matches README_STYLE website example")
}

if (!readme.includes(LICENSE_ID)) {
  fail(`license section must state ${LICENSE_ID}`)
} else {
  ok(`license named ${LICENSE_ID}`)
}

if (!/CC BY-SA 4\.0/i.test(readme)) {
  fail("README must note content licensed under CC BY-SA 4.0 per REPOS.md")
} else {
  ok("content CC BY-SA 4.0 noted")
}

const statusTableMatch = readme.match(
  /\|\s*Area\s*\|\s*State\s*\|[\s\S]*?(?=<img src="https:\/\/capsule-render)/
)
if (!statusTableMatch) {
  fail("STATUS table missing or malformed")
} else {
  const table = statusTableMatch[0]
  const stateCells = [...table.matchAll(/\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|/g)]
  let sawReadmeBuilt = false
  let sawLicenseBuilt = false
  let sawCiBuilt = false
  let sawImplPlanned = false
  for (const [, areaRaw, stateRaw] of stateCells) {
    const area = areaRaw.trim()
    const state = stateRaw.trim()
    if (/^area$/i.test(area) && /^state$/i.test(state)) continue
    if (/^-+$/.test(area)) continue
    if (!/^(Planned|Built)$/i.test(state)) {
      fail(`STATUS row "${area}" must be Planned or Built; got "${state}"`)
      continue
    }
    if (/^README$/i.test(area) && /^Built$/i.test(state)) {
      sawReadmeBuilt = true
    }
    if (/^LICENSE$/i.test(area) && /^Built$/i.test(state)) {
      sawLicenseBuilt = true
    }
    if (/^CI verify gate$/i.test(area) && /^Built$/i.test(state)) {
      sawCiBuilt = true
    }
    if (BUILT_AREAS.test(area) && !/^Built$/i.test(state)) {
      fail(`STATUS row "${area}" must be Built; got "${state}"`)
    }
    if (PLANNED_AREAS.test(area) && !/^Planned$/i.test(state)) {
      fail(
        `STATUS row "${area}" must stay Planned until site/docs land; got "${state}"`
      )
    }
    if (/^Implementation$/i.test(area) && /^Planned$/i.test(state)) {
      sawImplPlanned = true
    }
  }
  if (!sawReadmeBuilt) fail('STATUS must include "| README | Built |"')
  if (!sawLicenseBuilt) fail('STATUS must include "| LICENSE | Built |"')
  if (!sawCiBuilt) fail('STATUS must include "| CI verify gate | Built |"')
  if (!sawImplPlanned) fail('STATUS must include "| Implementation | Planned |"')
  if (!process.exitCode) ok("STATUS rows use Planned/Built correctly")
}

if (
  !/No Astro project, Starlight docs, or published protocol\/ADR pages are in this repository yet/i.test(
    readme
  )
) {
  fail(
    'OVERVIEW must state "No Astro project, Starlight docs, or published protocol/ADR pages are in this repository yet"'
  )
} else {
  ok("OVERVIEW states no Astro/Starlight/docs artifacts yet")
}

if (!/Astro/i.test(readme) || !/Starlight/i.test(readme)) {
  fail("README must name Astro and Starlight")
} else {
  ok("Astro and Starlight named")
}

if (!/protocol/i.test(readme) || !/ADR/i.test(readme)) {
  fail("README must name protocol and ADR docs")
} else {
  ok("protocol and ADR docs named")
}

if (
  !readme.includes("https://github.com/corvin-chess/design-system") ||
  !readme.includes("https://github.com/corvin-chess/translations")
) {
  fail("README must link design-system and translations as Planned dependencies")
} else {
  ok("design-system and translations linked")
}

const claimedBuilt =
  /\b(Shipped|Live at|visitors|pageviews|uptime|99\.9%|in production|\d+\s+docs|\d+\s+pages)\b/i
if (claimedBuilt.test(readme)) {
  fail("unverified traffic, uptime, or production claims found")
} else {
  ok("no unverified traffic/uptime/production claims")
}

const forbiddenSources =
  /\b(Stockfish|Leela|lc0|Lichess|Chess\.com|Docusaurus|MkDocs)\b/i
if (forbiddenSources.test(readme)) {
  fail("third-party or competitor name found; keep wording Corvin Astro-focused")
} else {
  ok("no third-party or competitor names")
}

const linkRe = /https:\/\/github\.com\/corvin-chess\/([A-Za-z0-9._-]+)/g
const linked = new Set()
let m
while ((m = linkRe.exec(readme)) !== null) {
  linked.add(m[1])
}

const knownRepos = new Set([
  "web",
  "server",
  "chess-core",
  "engine",
  "engine-train",
  "worker",
  "fairplay",
  "puzzles",
  "explorer",
  "broadcast",
  "design-system",
  "assets",
  "mobile",
  "sdk",
  "bots",
  "translations",
  "infra",
  "website",
  ".github",
])

for (const name of linked) {
  if (!knownRepos.has(name)) {
    fail(`link to unknown repo: ${name}`)
  }
}
if (!linked.has(REPO)) {
  fail(`missing link to ${REPO}`)
}
if (!process.exitCode) ok("all github.com/corvin-chess links are in REPOS set")

if (existsSync(reposPath)) {
  const reposDoc = readFileSync(reposPath, "utf8")
  if (!reposDoc.includes(`### ${REPO}`)) {
    fail(`REPOS.md missing ### ${REPO}`)
  } else {
    ok("REPOS.md documents website")
  }
}

if (!existsSync(licensePath)) {
  fail("missing LICENSE")
} else {
  const license = readFileSync(licensePath, "utf8")
  if (!/GNU AFFERO GENERAL PUBLIC LICENSE/i.test(license)) {
    fail("LICENSE must be GNU Affero General Public License")
  } else if (license.length < 30000) {
    fail("LICENSE looks truncated; expect full AGPL-3.0 text")
  } else {
    ok("LICENSE present with full AGPL-3.0 text")
  }
  if (emojiRe.test(license)) {
    fail("emoji found in LICENSE")
  }
}

if (existsSync(stylePath)) {
  const style = readFileSync(stylePath, "utf8")
  if (!style.includes("| website | `astro` |")) {
    fail("README_STYLE skill table missing website/astro")
  } else {
    ok("README_STYLE lists website skill icon astro")
  }
  if (!style.includes(CLOSING)) {
    fail("README_STYLE missing website closing sentence example")
  } else {
    ok("closing sentence listed in README_STYLE")
  }
}

const requiredHeaderBits = [
  'alt="Corvin"',
  `alt="${REPO}"`,
  "section=footer",
  "## License",
]
for (const bit of requiredHeaderBits) {
  if (!readme.includes(bit)) {
    fail(`missing required README fragment: ${bit}`)
  }
}
if (!process.exitCode) ok("header, footer, license heading present")

if (!process.exitCode) {
  console.log("All CV-028 website README checks passed.")
}
