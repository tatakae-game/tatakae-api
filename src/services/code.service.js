import { get_all_group_match } from "./regex.service"

const include_regex = /include ["'](\w*.\w*)["'];?/g
const main_regex = /fn *main *\( *robot: *Robot&\) *{.*/g
const user_main_function = "fn user_super_giga_upra_cool_code(robot: Robot&) {";
/**
 * 
 * @param {[{name: String, code: String}]} files 
 */
export function check_include_errors(files) {
  const errors = []
  if (!has_one_entry_point(files)) {
    errors.push('No or more than one entry point detected')
  }

  const missing_files = get_missing_files(files)
  if (missing_files.length !== 0) {
    for (const missing_file of missing_files) {
      errors.push(`${missing_file} file does not exist`)
    }
  }

  return errors
}

export function replace_main_name(main_file) {
  console.log(main_file)
  const matchs = get_all_group_match(main_regex, main_file, 1)

  if (matchs.length <= 0) {
    console.log("Must provide a main function")
  } else if (matchs.length > 1){
    console.log("Multiple main function")

  } else {
    main_file = main_file.replace(main_regex, user_main_function)
  }

  return main_file
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

    for (const file of files_called) {
      if (!file_names.includes(file.selection)) {
        missing_files.push(file.selection)
      }
    }
  }
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
 * 
 * @param {string} code 
 */
function has_include(code) {
  return code.match(include_regex)
}

/**
 * @param {[{name: String, code: String}]} files
 */
export function resolve_files(files) {
  const file = files.filter(file => file.is_entrypoint === true)[0]
  let code = file.code
  const included_file = [file.name]

  while (has_include(code)) {

    const lines_to_suppress = get_all_group_match(include_regex, code, 1)
    for (const line of lines_to_suppress) {

      if (!included_file.includes(line.selection)) {
        const file_code = files.filter(file => file.name === line.selection)[0].code
        code = code.replace(line.match, file_code)
        included_file.push(line.selection)

      } else {
        code = code.replace(line.match, '')
      }
    }
  }

  return code
}