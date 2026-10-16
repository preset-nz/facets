import type { PropertyGroupDef, PropertySchema } from "./types"

/**
 * The page a group sits on. A group without `page` sits on the first declared
 * page, the default page. Without `pages`, every group is on the one page, `""`.
 */
export function pageOf(schema: PropertySchema, group: PropertyGroupDef): string {
  if (!schema.pages?.length) return ""
  return group.page ?? schema.pages[0].id
}

/**
 * What the JSON Schema can't say about pages and advanced groups, since it
 * needs one part of the schema checked against another. An empty list means
 * the schema is sound. `registerScope` throws on any problem, so a bad schema
 * fails where it is registered rather than drawing a page with nothing on it.
 *
 * - `pages`, when present, is not empty and its ids are unique.
 * - With pages, a group that names a page names a declared one; a group that
 *   names none is on the first page. Without pages, no group names one.
 * - Every page, including the one page of a schema without `pages`, has a group
 *   that isn't `advanced`. A schema with no groups at all is fine.
 */
export function schemaProblems(schema: PropertySchema): string[] {
  const problems: string[] = []
  const at = (i: number) => `groups[${i}] ("${schema.groups[i].id}")`
  const pages = schema.pages
  if (!pages) {
    schema.groups.forEach((g, i) => {
      if (g.page !== undefined)
        problems.push(`${at(i)}: names page "${g.page}", but there are no pages`)
    })
    if (schema.groups.length > 0 && schema.groups.every((g) => g.advanced)) {
      problems.push("every group is advanced: the panel would show only a closed Advanced row")
    }
    return problems
  }
  if (pages.length === 0) problems.push("pages is empty: omit it for one page")
  const ids = new Set<string>()
  for (const p of pages) {
    if (p.id === "") {
      problems.push("pages: an id is empty")
      continue
    }
    if (ids.has(p.id)) problems.push(`pages: "${p.id}" is declared twice`)
    ids.add(p.id)
  }
  schema.groups.forEach((g, i) => {
    if (g.page !== undefined && !ids.has(g.page))
      problems.push(`${at(i)}: page "${g.page}" is not declared`)
  })
  for (const id of ids) {
    const groups = schema.groups.filter((g) => pageOf(schema, g) === id)
    if (groups.length === 0) problems.push(`page "${id}" has no groups`)
    else if (groups.every((g) => g.advanced)) {
      problems.push(`page "${id}" has only advanced groups: give it one that isn't`)
    }
  }
  return problems
}
