/*
 * File: /modules/databasetools.js
 * -------------------------
 * File Created: 20190521
 * Author: Cenk Kılıç (cenk@kilic.dev)
 * -------------------------
 * Last Modified: 20190527
 * Modified By: Cenk Kılıç (cenk@kilic.dev>)
 * Changelog:----------------
 * Date          By      Ver      Comments
 * -----------   ----    ----     ---------------------------------------------------------
 * 20190527      CK      v1.10
 * 20190523      CK      v1.01
 * 20190521      CK      v1.00    Initial version.
 */

const fs = require('fs')
const pad = require('pad')
const chalk = require('chalk')

module.exports = {
  initdatabase,
  splitShareName
}

function initdatabase (databaseURL) {
  let buffer = JSON.stringify({ 'client': { 'repeat': 'INT_REPEATTIMEINSECONDS', 'mountDir': 'STR_MOUNTDIRECTORYFROMROOT', 'mountOptions': 'STR_CIFSOPTIONS' }, 'networks': { 'STR_NETWORKNAME': { 'network': 'STR_NETWORKIP', 'priority': 'INT' } }, 'mounts': { 'STR_SHARENAME': { 'mounts': 'ARRAY_[MOUNTNAME@(OPTIONAL)MOUNTALIAS]', 'available': 'ARRAY_[STR_NETWORKNAME]@(OPTIONAL)IP', 'user': 'STR_USERNAME', 'password': 'STR_PASSWORD' } } })
  if (!fs.existsSync(databaseURL)) {
    fs.writeFileSync(databaseURL, buffer, { flag: 'wx' })
    console.error(chalk.yellow(`${pad('CLIENT', 20)} | Database not found initating.`))
    console.log(chalk.red(`${pad('CLIENT', 20)} | Database initiated. Program will terminate.`))
    console.log(chalk.red(`${pad('CLIENT', 20)} | Please edit the database for it to function properly.`))
    process.exit(10)
  } else {
    console.log(chalk.green(`${pad('CLIENT', 20)} | Database exists and succesfully read.`))
  }
}

async function splitShareName (shareName) {
  // Split share name and alias by colon if defined
  shareName = shareName.split('@')
  var shareAlias = shareName[0]
  if (typeof shareName[1] !== 'undefined') {
    shareAlias = shareName[1]
  }
  shareName = shareName[0]
  return { 'shareName': shareName, 'shareAlias': shareAlias }
}
