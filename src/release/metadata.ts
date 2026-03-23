import { promises as fs } from "fs"
import path from "path"
import { readJson, readText, writeJson, writeText } from "../utils/files"
import type { ReleaseComponent } from "./types"

type ClaudePluginManifest = {
  version: string
  description?: string
  mcpServers?: Record<string, unknown>
}

type CursorPluginManifest = {
  version: string
  description?: string
}

type MarketplaceManifest = {
  metadata: {
    version: string
    description?: string
  }
  plugins: Array<{
    name: string
    version?: string
    description?: string
  }>
}

type SyncOptions = {
  root?: string
  componentVersions?: Partial<Record<ReleaseComponent, string>>
  write?: boolean
}

type FileUpdate = {
  path: string
  changed: boolean
}

export type MetadataSyncResult = {
  updates: FileUpdate[]
}

export type PluginCounts = {
  agents: number
  skills: number
  mcpServers: number
}

export type CompoundEngineeringCounts = PluginCounts

const COMPOUND_ENGINEERING_DESCRIPTION =
  "AI-powered development tools for code review, research, design, and workflow automation."

const COMPOUND_ENGINEERING_MARKETPLACE_DESCRIPTION =
  "AI-powered development tools that get smarter with every use. Make each unit of engineering work easier than the last."

const FUELVIEWS_ENGINEERING_DESCRIPTION =
  "Laravel-focused engineering workflow with impact discovery, convergent review, and repo-layer truth. Requires compound-engineering plugin."

function resolveExpectedVersion(
  explicitVersion: string | undefined,
  fallbackVersion: string,
): string {
  return explicitVersion ?? fallbackVersion
}

export async function countMarkdownFiles(root: string): Promise<number> {
  const entries = await fs.readdir(root, { withFileTypes: true })
  let total = 0

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      total += await countMarkdownFiles(fullPath)
      continue
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      total += 1
    }
  }

  return total
}

export async function countSkillDirectories(root: string): Promise<number> {
  const entries = await fs.readdir(root, { withFileTypes: true })
  let total = 0

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const skillPath = path.join(root, entry.name, "SKILL.md")
    try {
      await fs.access(skillPath)
      total += 1
    } catch {
      // Ignore non-skill directories.
    }
  }

  return total
}

export async function countMcpServers(pluginRoot: string): Promise<number> {
  const mcpPath = path.join(pluginRoot, ".mcp.json")
  const manifest = await readJson<{ mcpServers?: Record<string, unknown> }>(mcpPath)
  return Object.keys(manifest.mcpServers ?? {}).length
}

export async function getCompoundEngineeringCounts(root: string): Promise<CompoundEngineeringCounts> {
  const pluginRoot = path.join(root, "plugins", "compound-engineering")
  const [agents, skills, mcpServers] = await Promise.all([
    countMarkdownFiles(path.join(pluginRoot, "agents")),
    countSkillDirectories(path.join(pluginRoot, "skills")),
    countMcpServers(pluginRoot),
  ])

  return { agents, skills, mcpServers }
}

export async function buildCompoundEngineeringDescription(_root: string): Promise<string> {
  return COMPOUND_ENGINEERING_DESCRIPTION
}

export async function buildCompoundEngineeringMarketplaceDescription(_root: string): Promise<string> {
  return COMPOUND_ENGINEERING_MARKETPLACE_DESCRIPTION
}

export async function getPluginCounts(root: string, pluginName: string): Promise<PluginCounts> {
  const pluginRoot = path.join(root, "plugins", pluginName)
  const [agents, skills, mcpServers] = await Promise.all([
    countMarkdownFiles(path.join(pluginRoot, "agents")),
    countSkillDirectories(path.join(pluginRoot, "skills")),
    countMcpServers(pluginRoot),
  ])

  return { agents, skills, mcpServers }
}

export async function getFuelviewsEngineeringCounts(root: string): Promise<PluginCounts> {
  return getPluginCounts(root, "fuelviews-engineering")
}

export async function buildFuelviewsEngineeringDescription(_root: string): Promise<string> {
  return FUELVIEWS_ENGINEERING_DESCRIPTION
}

export async function syncReleaseMetadata(options: SyncOptions = {}): Promise<MetadataSyncResult> {
  const root = options.root ?? process.cwd()
  const write = options.write ?? false
  const versions = options.componentVersions ?? {}
  const updates: FileUpdate[] = []

  const compoundDescription = await buildCompoundEngineeringDescription(root)
  const compoundMarketplaceDescription = await buildCompoundEngineeringMarketplaceDescription(root)

  const compoundClaudePath = path.join(root, "plugins", "compound-engineering", ".claude-plugin", "plugin.json")
  const compoundCursorPath = path.join(root, "plugins", "compound-engineering", ".cursor-plugin", "plugin.json")
  const codingTutorClaudePath = path.join(root, "plugins", "coding-tutor", ".claude-plugin", "plugin.json")
  const codingTutorCursorPath = path.join(root, "plugins", "coding-tutor", ".cursor-plugin", "plugin.json")
  const fuelviewsClaudePath = path.join(root, "plugins", "fuelviews-engineering", ".claude-plugin", "plugin.json")
  const fuelviewsCursorPath = path.join(root, "plugins", "fuelviews-engineering", ".cursor-plugin", "plugin.json")
  const marketplaceClaudePath = path.join(root, ".claude-plugin", "marketplace.json")
  const marketplaceCursorPath = path.join(root, ".cursor-plugin", "marketplace.json")

  const compoundClaude = await readJson<ClaudePluginManifest>(compoundClaudePath)
  const compoundCursor = await readJson<CursorPluginManifest>(compoundCursorPath)
  const codingTutorClaude = await readJson<ClaudePluginManifest>(codingTutorClaudePath)
  const codingTutorCursor = await readJson<CursorPluginManifest>(codingTutorCursorPath)
  const fuelviewsClaude = await readJson<ClaudePluginManifest>(fuelviewsClaudePath)
  const fuelviewsCursor = await readJson<CursorPluginManifest>(fuelviewsCursorPath)
  const marketplaceClaude = await readJson<MarketplaceManifest>(marketplaceClaudePath)
  const marketplaceCursor = await readJson<MarketplaceManifest>(marketplaceCursorPath)
  const expectedCompoundVersion = resolveExpectedVersion(
    versions["compound-engineering"],
    compoundClaude.version,
  )
  const expectedCodingTutorVersion = resolveExpectedVersion(
    versions["coding-tutor"],
    codingTutorClaude.version,
  )
  const expectedFuelviewsVersion = resolveExpectedVersion(
    versions["fuelviews-engineering"],
    fuelviewsClaude.version,
  )
  const fuelviewsDescription = await buildFuelviewsEngineeringDescription(root)

  let changed = false
  if (compoundClaude.version !== expectedCompoundVersion) {
    compoundClaude.version = expectedCompoundVersion
    changed = true
  }
  if (compoundClaude.description !== compoundDescription) {
    compoundClaude.description = compoundDescription
    changed = true
  }
  updates.push({ path: compoundClaudePath, changed })
  if (write && changed) await writeJson(compoundClaudePath, compoundClaude)

  changed = false
  if (compoundCursor.version !== expectedCompoundVersion) {
    compoundCursor.version = expectedCompoundVersion
    changed = true
  }
  if (compoundCursor.description !== compoundDescription) {
    compoundCursor.description = compoundDescription
    changed = true
  }
  updates.push({ path: compoundCursorPath, changed })
  if (write && changed) await writeJson(compoundCursorPath, compoundCursor)

  changed = false
  if (codingTutorClaude.version !== expectedCodingTutorVersion) {
    codingTutorClaude.version = expectedCodingTutorVersion
    changed = true
  }
  updates.push({ path: codingTutorClaudePath, changed })
  if (write && changed) await writeJson(codingTutorClaudePath, codingTutorClaude)

  changed = false
  if (codingTutorCursor.version !== expectedCodingTutorVersion) {
    codingTutorCursor.version = expectedCodingTutorVersion
    changed = true
  }
  updates.push({ path: codingTutorCursorPath, changed })
  if (write && changed) await writeJson(codingTutorCursorPath, codingTutorCursor)

  changed = false
  if (fuelviewsClaude.version !== expectedFuelviewsVersion) {
    fuelviewsClaude.version = expectedFuelviewsVersion
    changed = true
  }
  if (fuelviewsClaude.description !== fuelviewsDescription) {
    fuelviewsClaude.description = fuelviewsDescription
    changed = true
  }
  updates.push({ path: fuelviewsClaudePath, changed })
  if (write && changed) await writeJson(fuelviewsClaudePath, fuelviewsClaude)

  changed = false
  if (fuelviewsCursor.version !== expectedFuelviewsVersion) {
    fuelviewsCursor.version = expectedFuelviewsVersion
    changed = true
  }
  if (fuelviewsCursor.description !== fuelviewsDescription) {
    fuelviewsCursor.description = fuelviewsDescription
    changed = true
  }
  updates.push({ path: fuelviewsCursorPath, changed })
  if (write && changed) await writeJson(fuelviewsCursorPath, fuelviewsCursor)

  changed = false
  if (versions.marketplace && marketplaceClaude.metadata.version !== versions.marketplace) {
    marketplaceClaude.metadata.version = versions.marketplace
    changed = true
  }

  for (const plugin of marketplaceClaude.plugins) {
    if (plugin.name === "compound-engineering") {
      if (plugin.description !== compoundMarketplaceDescription) {
        plugin.description = compoundMarketplaceDescription
        changed = true
      }
    }
    // Plugin versions are not synced in marketplace.json -- the canonical
    // version lives in each plugin's own plugin.json. Duplicating versions
    // here creates drift that release-please can't maintain.
  }

  updates.push({ path: marketplaceClaudePath, changed })
  if (write && changed) await writeJson(marketplaceClaudePath, marketplaceClaude)

  changed = false
  if (versions["cursor-marketplace"] && marketplaceCursor.metadata.version !== versions["cursor-marketplace"]) {
    marketplaceCursor.metadata.version = versions["cursor-marketplace"]
    changed = true
  }

  for (const plugin of marketplaceCursor.plugins) {
    if (plugin.name === "compound-engineering") {
      if (plugin.description !== compoundMarketplaceDescription) {
        plugin.description = compoundMarketplaceDescription
        changed = true
      }
    }
  }

  updates.push({ path: marketplaceCursorPath, changed })
  if (write && changed) await writeJson(marketplaceCursorPath, marketplaceCursor)

  return { updates }
}
