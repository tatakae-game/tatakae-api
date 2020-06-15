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

  if (has_circular_inclusion(files)) {
    errors.push('Circular inclusion detected')
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
    
  }
}

/**
 * 
 * @param {[{file: String, code: String}]} files 
 */
function has_one_entry_point(files) {
  return files.filter(file => file.is_entrypoint).length === 1
}

function get_included_file_name(file) {
  const file_name_included = []

}

function has_circular_inclusion(files) {
  for (const file in files) {

  }
}