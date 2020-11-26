const getBoolean = (info: any, { arguments: [{ value }] }): boolean =>
  value.kind === 'BooleanValue'
    ? value.value
    : info.variableValues[value.name.value]

function isExcludedByDirective(info: any, { directives }): boolean {
  if (!directives?.length) return false
  for (const directive of directives)
    if (
      getBoolean(info, directive) ===
      (directive.name.value === 'include' ? false : true)
    )
      return true
  return false
}

export function fields(
  info: any,
  asts = info.fieldASTs ?? info.fieldNodes
): Fields {
  if (!Array.isArray(asts)) asts = [asts]

  const selections = asts.flatMap(ast => ast?.selectionSet?.selections ?? [])

  const aggr: Fields = {}
  for (const selection of selections) {
    if (isExcludedByDirective(info, selection)) continue
    if (selection.kind === 'Field')
      aggr[selection.name.value] = selection.selectionSet
        ? fields(info, selection)
        : true
    else if (selection.kind === 'InlineFragment')
      Object.assign(aggr, fields(info, selection))
    else if (selection.kind === 'FragmentSpread')
      Object.assign(aggr, fields(info, info.fragments[selection.name.value]))
  }
  return aggr
}

export const args = (
  ast: any[],
  variables: Record<string, any>
): Record<string, any> => {
  const dict: Record<string, any> = {}

  for (const { name, value: raw } of ast) {
    if (raw.kind === 'Variable') dict[name.value] = variables[raw.name.value]
    else {
      const { kind, value } = raw
      dict[name.value] =
        kind === 'IntValue'
          ? parseInt(value)
          : kind === 'FloatValue'
          ? parseFloat(value)
          : value
    }
  }

  return dict
}
