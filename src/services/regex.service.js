

export function get_all_group_match(regex, str, second_index) {
  const matching_group = []
  let m

  while ((m = regex.exec(str)) !== null) {
    matching_group.push({ match: m[0], selection: m[second_index] })
  }
  return matching_group
}
