import { match } from "xregexp"
import { get_all_group_match } from "./regex.service"


const include_regex = /include ["'](\w*.js)["'];?/gm

/**
 * 
 * @param {[{name: String, code: String}]} files 
 */
export function check_errors(files) {
  const errors = []
  if (!has_one_entry_point(files)) {
    errors.push('No entry point detected')
  }

  const missing_files = get_missing_files(files)
  if (missing_files.length !== 0) {
    for (const missing_file of missing_files) {
      errors.push(`${missing_file} file does not exist`)
    }
  }

  return errors
}


/**
 * 
 * @param {[{name: String, code: String}]} files 
 */
function get_missing_files(files) {
  const file_names = files.map(file => file.name)
  const missing_files = []

  for (const file of files) {
    const files_called = get_all_group_match(include_regex, file.code, 1)

    for (const file_name of files_called) {
      if (!file_names.includes(file_name)) {
        missing_files.push(file_name)
      }
    }
  }

  console.log(missing_files)

  return missing_files
}

/**
 * 
 * @param {[{file: String, code: String}]} files 
 */
function has_one_entry_point(files) {
  return files.filter(file => file.is_entrypoint).length === 1
}


/**
 * @param {[name: String, code: String]} files
 * 
 */
function resolve_code(files) {
  const entrypoint = 
}