

export function get_all_group_match(regex, str, index) {
  const matching_group = []
  let m
  
  while ((m = regex.exec(str)) !== null) {
    matching_group.push(m[index])
  }
  return matching_group
}
