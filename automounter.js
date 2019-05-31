/*
 * File: /automounter.js
 * -------------------------
 * File Created: 20190518
 * Author: Cenk Kılıç (cenk@kilic.dev)
 * -------------------------
 * Last Modified: 20190530
 * Modified By: Cenk Kılıç (cenk@kilic.dev>)
 * Changelog:----------------
 * Date          By      Ver      Comments
 * -----------   ----    ----     ---------------------------------------------------------
 * 20190530      CK      v1.11    Added enabled flag to database.
 * 20190527      CK      v1.10    Added fallback IP option to database.
 * 20190523      CK      v1.01    Formatted output with color and padding.
 * 20190518      CK      v1.00    Initial Version
 */

// Print logo
console.log('Automounter v1.10')
console.log('-------------------------------------------')

// initial control libraries
const os = require('os')
const isRoot = require('is-root')
const chalk = require('chalk')

// Check if the platform is compatible
if (os.platform() !== 'linux') {
  console.error(chalk.bgRed('This script is for now only compatible with Linux running on x64 microarchitecture.'))
  process.exit(2)
} else if (!isRoot()) {
  // Check if running as root
  console.error(chalk.bgRed('This script must run as superuser or sudo since it uses default Linux tools to mount drives and check for networks.'))
  process.exit(3)
}

//  libraries
const path = require('path')
const underscore = require('underscore')
const pad = require('pad')
const moment = require('moment')
// custom imports
const networktools = require('./libraries/networktools')
const mounttools = require('./libraries/mounttools')
const databasetools = require('./libraries/databasetools')
// custom database imports
const databaseRelURL = './automounter-db.json'
const databaseAbsURL = getExternalFile(databaseRelURL)
databasetools.initdatabase(databaseAbsURL)
const database = require(databaseAbsURL)

// This is for pkg to resolve external files
function getExternalFile (relPath) {
  if (typeof process.pkg === 'undefined') {
    return relPath
  } else {
    return path.resolve(path.dirname(process.execPath), relPath)
  }
}

async function main () {
  console.log('-------------------------------------------')
  console.log(`New run initiated @ ${moment().format('YMMDD, HH:mm:ss')}`)
  console.log('-------------------------------------------')

  // Get IP addresses of connected networks
  var connectedNetworks = await networktools.getConnectedNetworks()

  // Match connected networks with the known networks
  if (connectedNetworks) {
    var knownNetworks = await networktools.getKnownNetworks(database, connectedNetworks)
  } else {
    knownNetworks = []
  }

  // Sort known and connected networks by priority
  knownNetworks = underscore.sortBy(knownNetworks, 'priority')

  // Drive mount part per computer
  Object.keys(database.mounts).forEach(async (host) => {
    // Check if host is enabled
    if (database.mounts[host].enabled) {
    // Check if given mounts are avaliable in knownNetworks and determine the preffered networks of the mounts
      var prefferedNetworks = await networktools.getPrefferedNetworks(database, host, knownNetworks)

      // only get the network with the highest priorty and check if any network is avalaible else skip this mount
      if (prefferedNetworks.length > 0) {
        var useNetwork = prefferedNetworks[0]
        console.log(`${pad(host, 20)} | Network "${useNetwork.name}" will be used with network address "${useNetwork.network}" and priority ${useNetwork.priority}.`)
        database.mounts[host].mounts.forEach(async (shareName) => {
        // Split share name and alias by colon if defined
          shareName = await databasetools.splitShareName(shareName)
          // Check if already mounted
          var alreadyMounted = await mounttools.getAlreadyMounted(database.client.mountDir, shareName.shareAlias)
          // Mount if not already mounted
          if (alreadyMounted !== true) {
            console.log(`${pad(host, 20)} | ${pad('WISH TO MOUNT', 15)} | ${shareName.shareName}@${shareName.shareAlias}`)
            mounttools.mountDrive(database, host, useNetwork, shareName.shareName, shareName.shareAlias)
          } else {
            console.error(chalk.blue(`${pad(host, 20)} | ${pad('ALREADY MOUNT', 15)} | ${shareName.shareName}@${shareName.shareAlias}`))
          }
        })
      } else {
        console.log(chalk.yellow(`${pad(host, 20)} | ${pad('NETWORK', 15)} | Not in same network. Checking if any shares are already mounted.`))
        // umount if not on compatible network
        database.mounts[host].mounts.forEach(async (shareName) => {
        // Split share name and alias by colon if defined
          shareName = await databasetools.splitShareName(shareName)
          var alreadyMounted = await mounttools.getAlreadyMounted(database.client.mountDir, shareName.shareAlias)
          // UNMount if not already mounted
          if (alreadyMounted === true) {
            console.log(`${pad(host, 20)} | ${pad('WISH TO UNMOUNT', 15)} | ${shareName.shareName}@${shareName.shareAlias}`)
            mounttools.unmountDrive(database, host, shareName.shareAlias)
          } else {
            console.error(chalk.blue(`${pad(host, 20)} | ${pad('ALREADY UNMOUNT', 15)} | ${shareName.shareName}@${shareName.shareAlias}`))
          }
        })
      }
    } else {
      console.error(chalk.magenta(`${pad(host, 20)} | ${pad('SKIPPING', 15)} | Skipping host since it is disabled in database.`))
    }
  })
}

// run with given period
main()
setInterval(main, database.client.repeat * 1000)
