import db from '../db'
import * as permissions from '../constants/permissions'

export const Permission = new db.Schema({
  name: { type: String, },
  value: { type: Boolean, default: false, },
})

export const model = db.model('Group', {
  name: { type: String, },
  permissions: { type: [Permission], default: [], },
})

export function get_default_permissions() {
  return Object.values(permissions).map(str => {
    return {
      name: str,
      value: false
    }
  })
}

export function fill_groups_permissions(groups) {
  const default_permissions = get_default_permissions();
  for (const group of groups) {
    const updated_permissions = default_permissions.map(permission => {
      const found = group.permissions.find(p => p.name === permission.name)
      if (found) {
        permission.value = found.value
      }
      return permission
    })
    group.permissions = updated_permissions
  }
  return groups
}
